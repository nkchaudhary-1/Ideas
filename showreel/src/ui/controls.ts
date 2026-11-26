import { h } from '../core/dom';
import { formatTimecode } from '../core/timecode';
import type { Player } from '../core/player';
import type { AudioLayer } from './audio';
import { GLYPHS } from './glyphs';
import type { Subtitles } from './subtitles';

const SEEK_STEP = 1;

const setGlyph = (button: HTMLElement, glyph: string) => {
  button.innerHTML = glyph;
};

/**
 * Transport for `full` mode: play and pause, restart, a scrubbable timeline whose segments are the
 * beats, coloured by world, then the subtitle and sound toggles. Everything here is plain DOM.
 * Returns a function that removes it and its listeners.
 */
export function mountControls(app: HTMLElement, player: Player, subtitles: Subtitles, audio: AudioLayer): () => void {
  const reel = player.reel;
  const worldOf = (beat: (typeof reel.beats)[number]) => (beat.world.from === beat.world.to ? beat.world.from : 'blend');

  const play = h('button', 'btn', [], { type: 'button', 'aria-label': 'Play', title: 'Play (space)' });
  const restart = h('button', 'btn', [], { type: 'button', 'aria-label': 'Restart', title: 'Restart (R)' });
  restart.innerHTML = GLYPHS.restart;

  const now = h('span', '', ['0:00']);
  const time = h('span', 'time num', [now, ` / ${formatTimecode(reel.duration)}`]);
  const beatName = h('span', 'beat-name');

  // Two copies of the track: dim underneath, bright on top and clipped to what has played.
  const segments = (lit: boolean) =>
    h(
      'div',
      `track ${lit ? 'track--lit' : 'track--dim'}`,
      reel.beats.map((beat) =>
        h('i', 'seg', [], { 'data-world': worldOf(beat), style: `--w:${beat.dur}`, ...(lit ? {} : { title: `${beat.index + 1}. ${beat.label}, ${formatTimecode(beat.start)}` }) }),
      ),
      { 'aria-hidden': 'true' },
    );
  const lit = segments(true);
  const head = h('div', 'head', [h('i')]);
  const scrub = h('div', 'scrub', [segments(false), lit, head], {
    role: 'slider',
    tabindex: '0',
    'aria-label': 'Timeline',
    'aria-valuemin': '0',
    'aria-valuemax': String(Math.round(reel.duration)),
  });

  const subsButton = h('button', 'pill', ['Subtitles'], { type: 'button', 'aria-pressed': 'false', title: 'Voiceover subtitles (C)' });
  const sound = h('button', 'btn', [], { type: 'button', 'aria-label': 'Mute', title: 'Sound (M)' });
  const children: HTMLElement[] = [play, restart, h('div', 'readout', [time, beatName]), scrub, subsButton];
  if (audio.available) children.push(sound);
  const bar = h('div', 'bar', children, { role: 'toolbar', 'aria-label': 'Playback' });
  app.append(bar);

  /* ---- keep the controls in step with the player ---- */
  let lastSecond = -1;
  const render = () => {
    const t = player.time;
    const progress = t / reel.duration;
    head.style.transform = `translateX(${progress * 100}%)`;
    lit.style.clipPath = `inset(0 ${(1 - progress) * 100}% 0 0)`;

    const second = Math.floor(t);
    if (second !== lastSecond) {
      lastSecond = second;
      now.textContent = formatTimecode(t);
      const beat = player.beatAt(t);
      beatName.textContent = `Beat ${beat.index + 1} of ${reel.beats.length} · ${beat.label}`;
      scrub.setAttribute('aria-valuenow', String(second));
      scrub.setAttribute('aria-valuetext', `${formatTimecode(t)}, ${beat.label}`);
    }
    const playing = player.playing;
    if (play.dataset.state !== String(playing)) {
      play.dataset.state = String(playing);
      setGlyph(play, playing ? GLYPHS.pause : GLYPHS.play);
      play.setAttribute('aria-label', playing ? 'Pause' : 'Play');
      play.title = playing ? 'Pause (space)' : 'Play (space)';
    }
    subtitles.update(t);
  };
  const unsubscribe = player.onChange(render);
  render();

  const renderSound = () => {
    setGlyph(sound, audio.muted ? GLYPHS.muted : GLYPHS.sound);
    sound.setAttribute('aria-label', audio.muted ? 'Unmute' : 'Mute');
  };
  renderSound();
  const syncSubs = () => {
    subsButton.setAttribute('aria-pressed', String(subtitles.enabled));
  };
  syncSubs();

  /* ---- actions ---- */
  const toggleSubs = () => {
    subtitles.setEnabled(!subtitles.enabled);
    syncSubs();
  };
  const toggleSound = () => {
    audio.setMuted(!audio.muted);
    renderSound();
  };
  play.addEventListener('click', () => player.toggle());
  restart.addEventListener('click', () => player.restart());
  subsButton.addEventListener('click', toggleSubs);
  sound.addEventListener('click', toggleSound);

  /* ---- scrubbing: pointer events, so mouse, touch and pen behave the same ---- */
  let dragging = false;
  let resume = false;
  const seekTo = (event: PointerEvent) => {
    const box = scrub.getBoundingClientRect();
    player.seek(Math.min(Math.max((event.clientX - box.left) / box.width, 0), 1) * reel.duration);
  };
  scrub.addEventListener('pointerdown', (event) => {
    dragging = true;
    resume = player.playing;
    if (resume) player.pause();
    scrub.setPointerCapture(event.pointerId);
    scrub.focus();
    seekTo(event);
  });
  scrub.addEventListener('pointermove', (event) => {
    if (dragging) seekTo(event);
  });
  const endDrag = () => {
    if (!dragging) return;
    dragging = false;
    if (resume) player.play();
  };
  scrub.addEventListener('pointerup', endDrag);
  scrub.addEventListener('pointercancel', endDrag);

  /* ---- keyboard ---- */
  const onKey = (event: KeyboardEvent) => {
    if (event.metaKey || event.ctrlKey || event.altKey) return;
    const target = event.target as HTMLElement | null;
    const onButton = target instanceof HTMLButtonElement; // a focused button handles space and enter itself
    switch (event.key) {
      case ' ':
        if (onButton) return;
        player.toggle();
        break;
      case 'k':
        player.toggle();
        break;
      case 'r':
        player.restart();
        break;
      case 'c':
        toggleSubs();
        break;
      case 'm':
        if (audio.available) toggleSound();
        break;
      case '[':
        player.stepBeat(-1);
        break;
      case ']':
        player.stepBeat(1);
        break;
      case 'ArrowLeft':
        if (event.shiftKey) player.stepBeat(-1);
        else player.seek(player.time - SEEK_STEP);
        break;
      case 'ArrowRight':
        if (event.shiftKey) player.stepBeat(1);
        else player.seek(player.time + SEEK_STEP);
        break;
      case 'Home':
        player.seek(0);
        break;
      case 'End':
        player.seek(reel.duration);
        break;
      default:
        return;
    }
    event.preventDefault();
  };
  document.addEventListener('keydown', onKey);

  return () => {
    unsubscribe();
    document.removeEventListener('keydown', onKey);
    bar.remove();
  };
}
