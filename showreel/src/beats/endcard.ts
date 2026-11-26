import { h } from '../core/dom';
import { splitText } from '../core/split';
import type { EndCardBeat, HookBeat, Resolved } from '../types';
import type { BeatContext } from './context';
import { createMarks } from './marks';

/**
 * Beat 8. Clean, and built to rhyme with the hook: the same viewfinder marks, the same huge
 * centred word slamming in, and the hook's four words listed underneath. The grade eases back to
 * the hook's, and the name steps aside last, so the cut back to SKETCH is the cut between any two flashes.
 */
export function buildEndCard({ beat, reel, root, cam, tl, m, tick, snap, at, reduced }: BeatContext<Resolved<EndCardBeat>>): void {
  const hook = reel.beats.find((b): b is Resolved<HookBeat> => b.kind === 'hook');
  const echoWords = hook?.flashes ?? [];

  const marks = createMarks();
  root.append(marks);

  const rings = [0, 1, 2].map(() => h('i', 'ring'));
  const name = h('h2', 'word-hero end-name');
  const rule = h('span', 'rule');
  const role = h('p', 'end-role');
  const dot = h('i', 'url-dot');
  const url = h('span', 'url', [dot, h('span', 'url-text', [beat.url])]);
  const echo = h('div', 'end-echo', echoWords.map((w) => h('span', 'echo-word', [w])));
  cam.append(h('div', 'rings', rings), name, rule, role, url, echo);

  const nameSplit = splitText(name, beat.segments.join(' '), { chars: true, mask: false });
  const roleSplit = splitText(role, beat.role);

  // Marks snap in; rings ping out from behind the name, once now and once more mid-beat.
  if (reduced) m.fade(marks, 0);
  else tl.fromTo(marks, { scale: 1.1, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.5, ease: 'expo.out' }, 0);

  if (!reduced) {
    for (const start of [tick(2), snap(at(0.45))]) {
      tl.fromTo(rings, { scale: 0.4, opacity: 0.55 }, { scale: 1.7, opacity: 0, duration: 1.8, ease: 'expo.out', stagger: 0.16, immediateRender: false }, start);
    }
  }

  // The name slams in the way the hook words do, just slower and with a longer stagger.
  if (reduced) m.fade(nameSplit.chars, tick(1), { dur: 0.8 });
  else {
    tl.fromTo(
      nameSplit.chars,
      { scale: 1.5, scaleY: 1.9, opacity: 0, transformOrigin: '50% 60%' },
      { scale: 1, scaleY: 1, opacity: 1, duration: 0.7, ease: 'expo.out', stagger: 0.05 },
      tick(1),
    );
  }

  m.wipe(rule, tick(8), { dur: 1, origin: '50% 50%' });
  m.reveal(roleSplit.words, tick(9), { stagger: 0.08 });
  m.pop(url, tick(12), { from: 0.7, dur: 0.6, ease: 'back.out(2)' });
  m.fade(echo, tick(16), { dur: 0.8, to: 1 });

  // Tail: SKETCH, the first word of the hook, lights up so the loop reads as the next flash.
  const first = echo.firstElementChild;
  if (first && !reduced) {
    tl.fromTo(first, { opacity: 0.4 }, { opacity: 1, duration: 0.2 }, beat.dur - 0.7);
  }
}
