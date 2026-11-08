"""Original synthesised soundtrack for the 40 s film. Follows the brief's musical progression, locked to the scene timeline:
   0-5   peaceful Indian classical ambience (tanpura drone, soft bansuri)
   5-11  romantic and elegant (sitar-style melody over a rising pad)
   11-21 warm ceremonial (tanpura, bells, a soft tabla pulse arriving in scene 4)
   21-30 the baraat: dhol and festive percussion at 96 bpm, shehnai-style lead, ghungroo
   30-35 grand lift: full pad, big dhol hits, shehnai melody at its fullest
   35-40 soft emotional resolution: drone and a last chord
It is a stand-in for a recorded track. Replace it with licensed music by passing a different wav to compose.py.
usage: python3 audio_film.py <out.wav>"""
import sys, wave
import numpy as np

SR = 44100; DUR = 40.0; N = int(SR * DUR)
rng = np.random.default_rng(11)
L = np.zeros(N); R = np.zeros(N)
SA = 146.83                      # D3
BEAT = 60 / 96
def hz(semi): return SA * 2 ** (semi / 12)
# raga-flavoured scale (Yaman-like): Sa Re Ga Ma# Pa Dha Ni  =  0 2 4 6 7 9 11
S = {"S": 0, "R": 2, "G": 4, "M": 6, "P": 7, "D": 9, "N": 11}
def note(name, octv=0): return hz(S[name] + 12 * octv)

def put(sig, t, gl=1.0, gr=None, pan=0.0):
    gr = gl if gr is None else gr
    i = int(t * SR)
    if i >= N or i + len(sig) < 0: return
    a = max(0, -i); j = min(N, i + len(sig))
    seg = sig[a:a + (j - max(i, 0))]
    gL = gl * (1 - max(0, pan)); gR = gr * (1 + min(0, pan))
    L[max(i, 0):j] += seg * gL; R[max(i, 0):j] += seg * gR

def tt(d): return np.arange(int(SR * d)) / SR
def env_ad(d, a=.01, rel=None):
    t = tt(d); rel = rel or d * .9
    return np.minimum(1, t / a) * np.exp(-t / (rel / 4))

def pluck(f, d=3.0, bright=1.0):
    t = tt(d); s = np.zeros_like(t)
    for n in range(1, 21):
        amp = bright / n ** .9
        jawari = 1 + (1.8 * np.exp(-((t - .35) / .5) ** 2) if 4 <= n <= 12 else 0)
        s += amp * jawari * np.exp(-t / (2.4 / (1 + .22 * n))) * np.sin(2 * np.pi * f * n * (1 + .0002 * n * n) * t + rng.uniform(0, 6.28))
    s *= np.minimum(1, t / .004); return s / np.abs(s).max()

def tanpura_pluck(f, d=6.0):
    t = tt(d); s = np.zeros_like(t)
    for n in range(1, 17):
        swell = 1 + (2.2 * np.exp(-((t - 1.1) / .8) ** 2) if 5 <= n <= 13 else 0)
        s += (1 / n ** .85) * swell * np.exp(-t / (3.4 / (1 + .16 * n))) * np.sin(2 * np.pi * f * n * (1 + .0003 * n) * t + rng.uniform(0, 6.28))
    s *= np.minimum(1, t / .012); return s / np.abs(s).max()

def flute(f, d, vib=5.2, breath=.05):
    t = tt(d); v = 1 + .006 * np.sin(2 * np.pi * vib * t) * np.minimum(1, t / .5)
    ph = 2 * np.pi * np.cumsum(f * v) / SR
    s = np.sin(ph) + .28 * np.sin(2 * ph) + .08 * np.sin(3 * ph)
    n = rng.standard_normal(len(t)); k = np.exp(-np.arange(80) / 12); n = np.convolve(n, k, "same") * breath
    e = np.minimum(1, t / .12) * np.minimum(1, (d - t) / .25); return (s + n) * e

def reed(f, d, vib=5.8, gl=0.0):
    t = tt(d); v = 1 + .009 * np.sin(2 * np.pi * vib * t) * np.minimum(1, t / .25)
    ph = 2 * np.pi * np.cumsum(f * v) / SR; s = np.zeros_like(t)
    for n in range(1, 15):
        formant = 1 + 2.6 * np.exp(-((n * f - 1500) / 700) ** 2)           # nasal shehnai-like resonance
        s += formant / n ** .75 * np.sin(n * ph)
    e = np.minimum(1, t / .05) * np.minimum(1, (d - t) / .12); return s / np.abs(s).max() * e

def pad(freqs, d, a=1.5, r=2.0, det=(-.7, 0, .8)):
    t = tt(d); s = np.zeros_like(t)
    for f in freqs:
        for dt in det: s += np.sin(2 * np.pi * (f + dt) * t + rng.uniform(0, 6.28)) + .4 * np.sin(2 * np.pi * 2 * (f + dt) * t + rng.uniform(0, 6.28))
    e = np.minimum(1, t / a) * np.minimum(1, (d - t) / r); return s / (len(freqs) * len(det)) * e

def bell(f, d=3.5):
    t = tt(d); s = np.zeros_like(t)
    for r, a, dc in [(1, 1, 2.4), (2.76, .5, 1.5), (5.4, .3, .9), (8.93, .14, .5)]: s += a * np.exp(-t / dc) * np.sin(2 * np.pi * f * r * t)
    s *= np.minimum(1, t / .003); return s / np.abs(s).max()

def dhol(strong=1.0):
    t = tt(.55); f = 62 + 70 * np.exp(-t / .035); ph = 2 * np.pi * np.cumsum(f) / SR
    body = np.sin(ph) * np.exp(-t / .16); click = rng.standard_normal(len(t)) * np.exp(-t / .006) * .5
    skin = np.sin(2 * np.pi * 180 * t) * np.exp(-t / .05) * .35
    return (body + click + skin) * strong

def tilli(strong=1.0):                  # the thin stick side of the dhol
    t = tt(.16); n = rng.standard_normal(len(t)); n = n - np.convolve(n, np.ones(6) / 6, "same")
    return (n * np.exp(-t / .028) + .5 * np.sin(2 * np.pi * 420 * t) * np.exp(-t / .03)) * .55 * strong

def tabla_na(f=300):
    t = tt(.35); return (np.sin(2 * np.pi * f * (1 + .25 * np.exp(-t / .03)) * t) * np.exp(-t / .12) + .15 * rng.standard_normal(len(t)) * np.exp(-t / .01)) * .6

def shaker(strong=1.0):
    t = tt(.09); n = rng.standard_normal(len(t)); n = n - np.convolve(n, np.ones(4) / 4, "same")
    return n * np.exp(-t / .02) * .22 * strong

def riser(d):                           # filtered noise swell leading into a transition
    t = tt(d); n = rng.standard_normal(len(t)); out = np.zeros_like(n); y = 0; a0 = .02
    for i in range(0, len(n), 1):
        pass
    k = np.exp(-np.arange(300) / 60); n1 = np.convolve(n, k, "same"); n2 = n - np.convolve(n, np.ones(40) / 40, "same")
    mixv = np.clip(t / d, 0, 1) ** 2; s = n2 * mixv + n1 * (1 - mixv) * .05
    return s * (t / d) ** 2.2 * np.minimum(1, (d - t) / .02)

def crash(d=2.6):
    t = tt(d); n = rng.standard_normal(len(t)); n = n - np.convolve(n, np.ones(10) / 10, "same")
    return n * np.exp(-t / .75) * .5

# ---------- 0..40 s ----------
# tanpura runs throughout (Pa, Sa, Sa, low Sa), slowly fading in
cyc = [SA * .75, SA, SA, SA * .5]; k = 0; t0 = .3
while t0 < DUR:
    p = tanpura_pluck(cyc[k % 4]); pan = [.35, .6, .5, .4][k % 4]
    g = .5 * np.interp(t0, [0, 3, 34, 40], [.45, 1, 1, .5])
    put(p, t0, g * (1 - pan) * 1.5 + .12, g * pan * 1.5 + .12); t0 += 1.3; k += 1

# 0-5: bansuri breathes a slow phrase
put(flute(note("S", 1), 2.4), .9, .22, .22, pan=-.15); put(flute(note("R", 1), 1.8), 3.1, .2, .2, pan=-.15)
# the opening gate: soft bell
put(bell(note("S", 2)), .35, .35, .35)

# 5-11: romantic sitar-style melody (S G P M G R S ...) over a rising pad
mel = [(5.3, "G", 1, 1.0), (6.0, "P", 1, .9), (6.6, "M", 1, .8), (7.2, "P", 1, 1.0), (7.9, "D", 1, .9), (8.6, "P", 1, .8), (9.2, "G", 1, .9), (9.9, "R", 1, 1.0), (10.5, "S", 1, 1.2)]
for tm, nm, oc, vol in mel: put(pluck(note(nm, oc), 3.2), tm, .42 * vol, .42 * vol, pan=.12)
put(pad([note("S"), note("P"), note("G", 1)], 6.5, 1.4, 1.6), 4.8, .17, .17)
put(flute(note("G", 1), 2.6), 7.4, .14, .14, pan=-.2)
put(bell(note("G", 2)), 5.05, .3, .3); put(bell(note("P", 2)), 7.2, .2, .2)

# 11-21: warm ceremonial: pad, bells on the beat, a tabla pulse enters at 16
put(pad([note("S"), note("P"), note("S", 1), note("G", 1)], 10.4, 1.4, 1.2), 10.8, .2, .2)
for tm in np.arange(11.2, 21, BEAT * 2): put(bell(note(["S", "G", "P", "D"][int((tm - 11) / (BEAT * 2)) % 4], 2), 2.6), tm, .16, .16, pan=np.sin(tm))
for tm in np.arange(16.0, 21, BEAT):
    a = np.interp(tm, [16, 19], [.0, .5]); put(tabla_na(280 + 30 * (int((tm - 16) / BEAT) % 3)), tm, a * .5, a * .5)
put(flute(note("D", 1), 2.2), 13.4, .15, .15, pan=-.25); put(flute(note("P", 1), 2.6), 17.0, .15, .15, pan=-.25)
for tm, nm in [(12.0, "G"), (14.0, "P"), (15.4, "D"), (18.0, "P")]: put(pluck(note(nm, 1), 2.8), tm, .22, .22, pan=.2)

# 21-30: the baraat. dhol on every beat (96 bpm), tilli and shaker on the off beats, shehnai playing a festive line
for i, tm in enumerate(np.arange(21.0, 30.0, BEAT)):
    strong = 1.0 if i % 4 == 0 else (.7 if i % 2 == 0 else .5)
    put(dhol(strong), tm, .62, .62)
    put(tilli(1.0), tm + BEAT * .5, .38, .38, pan=.1); put(tilli(.7), tm + BEAT * .75, .26, .26, pan=-.1)
    put(shaker(), tm + BEAT * .25, .3, .3); put(shaker(.7), tm + BEAT * .75, .3, .3)
    if i % 4 == 3:                                          # a fill into the next bar
        for j in range(4): put(tilli(.8), tm + BEAT * (.5 + j * .125), .3, .3)
put(riser(1.0), 20.0, .38, .38)
sh = [(21.0, "S", 1, .9), (21.6, "G", 1, .3), (21.9, "P", 1, .6), (22.5, "D", 1, .6), (23.1, "P", 1, 1.2), (24.4, "M", 1, .6), (25.0, "G", 1, .6), (25.6, "P", 1, 1.2),
      (26.9, "D", 1, .6), (27.5, "N", 1, .6), (28.1, "S", 2, 1.4), (29.5, "N", 1, .5)]
for tm, nm, oc, d in sh: put(reed(note(nm, oc), d), tm, .26, .26, pan=-.1)
for tm in np.arange(21.0, 30.0, BEAT * 2): put(bell(note("S", 3), 1.2), tm + BEAT, .08, .08, pan=np.cos(tm))

# 30-35: grand lift: crash and big dhol, full pad, shehnai at its fullest, rolling dhol
put(riser(1.2), 28.8, .5, .5); put(crash(), 30.0, .55, .55); put(dhol(1.2), 30.0, .8, .8); put(bell(note("S", 3), 4), 30.0, .3, .3)
put(pad([note("S"), note("P"), note("S", 1), note("G", 1), note("P", 1), note("S", 2)], 6.0, .5, 2.4), 29.9, .3, .3)
for i, tm in enumerate(np.arange(30.0, 35.0, BEAT)):
    put(dhol(.9 if i % 2 == 0 else .55), tm, .5, .5); put(tilli(.8), tm + BEAT * .5, .28, .28); put(shaker(), tm + BEAT * .25, .24, .24)
sh2 = [(30.0, "S", 2, 1.3), (31.4, "N", 1, .5), (31.9, "D", 1, .5), (32.4, "P", 1, 1.0), (33.5, "M", 1, .5), (34.0, "G", 1, 1.4)]
for tm, nm, oc, d in sh2: put(reed(note(nm, oc), d), tm, .3, .3, pan=.08)
put(flute(note("S", 2), 3.0), 30.4, .16, .16, pan=-.3)

# 35-40: soft resolution: the drone, a last warm chord and one bell
put(pad([note("S"), note("P"), note("S", 1), note("G", 1)], 5.4, 1.2, 3.4), 34.6, .22, .22)
put(pluck(note("S", 1), 4.5), 35.3, .32, .32); put(pluck(note("G", 1), 4.5), 36.1, .22, .22, pan=.2); put(pluck(note("P", 1), 4.0), 36.8, .2, .2, pan=-.2)
put(bell(note("S", 2), 5.0), 37.6, .28, .28); put(flute(note("S", 1), 3.4), 36.0, .12, .12, pan=-.2)

# ---------- reverb, master ----------
irl = int(SR * 2.6); ir = rng.standard_normal((2, irl)) * np.exp(-np.arange(irl) / (SR * .75)); ir[:, :500] *= np.linspace(0, 1, 500)
def conv(x, h):
    n = len(x) + len(h) - 1; m = 1 << (n - 1).bit_length(); return np.fft.irfft(np.fft.rfft(x, m) * np.fft.rfft(h, m), m)[:len(x)]
wl, wr = conv(L, ir[0]), conv(R, ir[1])
wl *= np.abs(L).max() / (np.abs(wl).max() + 1e-9); wr *= np.abs(R).max() / (np.abs(wr).max() + 1e-9)
t = np.arange(N) / SR
wet = np.interp(t, [0, 20, 30, 40], [.55, .45, .3, .6])
L2 = L * (1 - wet * .5) + wl * wet * .55; R2 = R * (1 - wet * .5) + wr * wet * .55
fin = np.minimum(1, t / .9); fout = np.minimum(1, (DUR - t) / 2.4); L2 *= fin * fout; R2 *= fin * fout
# gentle soft clip, then normalise to -1.5 dBFS peak
L2 = np.tanh(L2 * 1.25) / np.tanh(1.25); R2 = np.tanh(R2 * 1.25) / np.tanh(1.25)
pk = max(np.abs(L2).max(), np.abs(R2).max()); g = .84 / pk; L2 *= g; R2 *= g
pcm = (np.stack([L2, R2], 1) * 32767).astype("<i2")
with wave.open(sys.argv[1], "wb") as w: w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
print("wrote", sys.argv[1], "%.1fs" % DUR)
