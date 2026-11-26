import { gsap } from 'gsap';
import { h } from '../core/dom';
import { formatTimecode } from '../core/timecode';
import type { Player } from '../core/player';
import type { Aspect } from '../params';
import type { StageRefs } from './stage';

const RATIOS: Record<Aspect, number> = { '16:9': 16 / 9, '9:16': 9 / 16, '1:1': 1 };
/** Seconds between writes to the card. Text changes cost layout, so it is not done every frame. */
const REFRESH = 0.1;

/**
 * `?debug`: dashed guides for the crops that must survive (a centred 1:1 and 9:16 inside a 16:9
 * stage, and so on), plus a card with the current beat, timecode, grade and frame rate.
 * Returns a function that removes it.
 */
export function mountDebug(refs: StageRefs, player: Player, aspect: Aspect): () => void {
  const stageRatio = RATIOS[aspect];
  const guides = (Object.keys(RATIOS) as Aspect[])
    .filter((a) => a !== aspect && RATIOS[a] < stageRatio)
    .map((a) => {
      // A crop narrower than the stage keeps the full height and a share of the width.
      const share = (RATIOS[a] / stageRatio) * 100;
      return h('div', 'guide', [h('span', '', [a])], { style: `width:${share}%` });
    });
  const guideLayer = h('div', 'guides', guides, { 'aria-hidden': 'true' });
  refs.stage.append(guideLayer);

  const beat = h('div', 'dbg-beat');
  const clock = h('div', 'dbg-clock num');
  const grade = h('div', 'dbg-grade num');
  const fps = h('div', 'dbg-fps num');
  const card = h('div', 'debug', [beat, clock, grade, fps], { 'aria-hidden': 'true' });
  refs.app.append(card);

  let smoothed = 60;
  let lastWrite = 0;
  const update = (time: number) => {
    smoothed += (60 / Math.max(gsap.ticker.deltaRatio(60), 0.01) - smoothed) * 0.05; // deltaRatio is 1 on a perfect 60 fps frame
    if (time - lastWrite < REFRESH) return;
    lastWrite = time;
    const t = player.time;
    const current = player.beatAt(t);
    const opacity = (el: HTMLElement) => Number(gsap.getProperty(el, 'opacity')).toFixed(2);
    beat.textContent = `${String(current.index + 1).padStart(2, '0')} ${current.label}`;
    clock.textContent = `${formatTimecode(t, 1)} / ${formatTimecode(player.reel.duration)}`;
    grade.textContent = `cool ${opacity(refs.worlds.cool)} · warm ${opacity(refs.worlds.warm)} · neutral ${opacity(refs.worlds.neutral)}`;
    fps.textContent = `${Math.round(smoothed)} fps`;
  };
  gsap.ticker.add(update);

  return () => {
    gsap.ticker.remove(update);
    guideLayer.remove();
    card.remove();
  };
}
