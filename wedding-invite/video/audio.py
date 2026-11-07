"""Synthesises a soft soundtrack: a tanpura-style drone, a slow pad, light chimes and a little reverb.
It is a placeholder you can replace with a real track (shehnai, sitar, a song you license).
usage: python3 audio.py <out.wav> <duration_s> <sa_hz> <planStart_s> [seed]"""
import sys, wave
import numpy as np

out, dur, sa, plan = sys.argv[1], float(sys.argv[2]), float(sys.argv[3]), float(sys.argv[4])
seed = int(sys.argv[5]) if len(sys.argv) > 5 else 7
SR = 44100
rng = np.random.default_rng(seed)
N = int(SR * dur)
L = np.zeros(N); R = np.zeros(N)

def add(buf, sig, start, gain=1.0):
    i = int(start * SR)
    if i >= N: return
    j = min(N, i + len(sig)); buf[i:j] += sig[:j - i] * gain

def pluck(freq, length=6.5):
    t = np.arange(int(SR * length)) / SR; s = np.zeros_like(t)
    for n in range(1, 17):
        amp = 1.0 / n ** 0.85
        swell = 1 + (2.2 * np.exp(-((t - 1.1) / 0.8) ** 2) if 5 <= n <= 13 else 0)   # the jivari shimmer
        decay = np.exp(-t / (3.4 / (1 + 0.16 * n)))
        s += amp * swell * decay * np.sin(2 * np.pi * freq * n * (1 + 0.0003 * n) * t + rng.uniform(0, 6.28))
    s *= np.minimum(1, t / 0.012)
    return s / np.abs(s).max()

def chime(freq, length=3.2):
    t = np.arange(int(SR * length)) / SR; s = np.zeros_like(t)
    for k, (r, a, d) in enumerate([(1, 1, 2.2), (2.76, .55, 1.4), (5.4, .3, .8), (8.93, .15, .5)]):
        s += a * np.exp(-t / d) * np.sin(2 * np.pi * freq * r * t)
    s *= np.minimum(1, t / 0.004)
    return s / np.abs(s).max()

# tanpura: Pa (low), Sa, Sa, Sa (low), repeating
cycle = [sa * 0.75, sa, sa, sa * 0.5]; step = 1.3; i = 0; t0 = 0.4
while t0 < dur:
    p = pluck(cycle[i % 4]); pan = [.35, .6, .5, .4][i % 4]
    add(L, p, t0, .5 * (1 - pan) * 2 * .5 + .25); add(R, p, t0, .5 * pan * 2 * .5 + .25)
    t0 += step; i += 1

# pad: slow stack on Sa and Pa that swells through the piece
tt = np.arange(N) / SR
pad = np.zeros(N)
for r, a in [(1, 1), (1.5, .6), (2, .5), (3, .22), (4, .12)]:
    for det in (-0.6, 0.0, 0.7):
        pad += a * np.sin(2 * np.pi * (sa * r + det) * tt + rng.uniform(0, 6.28))
lfo = 0.6 + 0.4 * np.sin(2 * np.pi * 0.11 * tt)
arc = np.interp(tt, [0, 5, 20, 33, 40, dur - 4, dur], [0.0, .35, .6, .8, .9, .6, 0.0])   # builds toward the celebration
pad *= lfo * arc * 0.05
L += pad; R += pad * np.roll(np.sin(2 * np.pi * 0.07 * tt), 3000)

# chimes: gate opens, "with", the diyas, the blessings
ev = [(loader := plan - 1.8) + 0.4, plan + 11.9, plan + 33.2, plan + 33.9, plan + 34.6, plan + 35.3, plan + 44.8, plan + 46.6, plan + 48.2]
notes = [sa * 4, sa * 6, sa * 4, sa * 6, sa * 8, sa * 12, sa * 6, sa * 8, sa * 12]
for k, (e, nf) in enumerate(zip(ev, notes)):
    c = chime(nf); add(L, c, e, .35 if k else .5); add(R, c, e + 0.012, .35 if k else .5)

# a little reverb: exponentially decaying noise as the impulse response
ir_len = int(SR * 2.4); ir = rng.standard_normal((2, ir_len)) * np.exp(-np.arange(ir_len) / (SR * 0.7)); ir[:, :400] *= np.linspace(0, 1, 400)
def conv(x, h):
    n = len(x) + len(h) - 1; m = 1 << (n - 1).bit_length()
    return np.fft.irfft(np.fft.rfft(x, m) * np.fft.rfft(h, m), m)[:len(x)]
wl, wr = conv(L, ir[0]), conv(R, ir[1])
wl *= np.abs(L).max() / (np.abs(wl).max() + 1e-9); wr *= np.abs(R).max() / (np.abs(wr).max() + 1e-9)
L = L * .72 + wl * .5; R = R * .72 + wr * .5

# master: fades, normalise
fade_in = np.minimum(1, tt / 1.6); fade_out = np.minimum(1, (dur - tt) / 3.2)
L *= fade_in * fade_out; R *= fade_in * fade_out
peak = max(np.abs(L).max(), np.abs(R).max()); L, R = L / peak * .7, R / peak * .7
pcm = (np.stack([L, R], 1) * 32767).astype("<i2")
with wave.open(out, "wb") as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
print("wrote", out, f"{dur:.1f}s")
