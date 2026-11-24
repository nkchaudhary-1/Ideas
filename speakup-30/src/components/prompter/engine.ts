import { useCallback, useEffect, useRef, useState } from "react";
import { unitSeconds, type Unit } from "../../lib/script";

export interface PrompterView {
  index: number;
  /** Words read so far in the active unit (fractional). */
  pos: number;
  /** Seconds left in a pause, or null when not pausing. */
  pauseLeft: number | null;
  playing: boolean;
  finished: boolean;
  /** Seconds the teleprompter has actually been running. */
  elapsed: number;
}

/**
 * The teleprompter clock. Each unit is read at the chosen words per minute (slower between [SLOW] and [CONTINUE]), and
 * [PAUSE] and [BREATHE] cues really stop it for their length. Pace is by words, so the highlight tells the speaker where
 * they should be, and they can always skip ahead or back.
 */
export function usePrompterEngine(units: Unit[], wpm: number, onFinish?: () => void) {
  const [view, setView] = useState<PrompterView>({ index: 0, pos: 0, pauseLeft: null, playing: false, finished: false, elapsed: 0 });
  const s = useRef({ index: 0, pos: 0, pause: null as number | null, playing: false, finished: false, elapsed: 0, last: 0, push: 0 });
  const unitsRef = useRef(units);
  const wpmRef = useRef(wpm);
  const finishRef = useRef(onFinish);
  unitsRef.current = units;
  wpmRef.current = wpm;
  finishRef.current = onFinish;

  const publish = useCallback(() => {
    const x = s.current;
    setView({ index: x.index, pos: x.pos, pauseLeft: x.pause, playing: x.playing, finished: x.finished, elapsed: x.elapsed });
  }, []);

  // Keep the cursor valid if the script changes under us (placeholders filled in).
  useEffect(() => {
    const x = s.current;
    if (x.index >= units.length) {
      x.index = Math.max(0, units.length - 1);
      x.pos = 0;
      publish();
    }
  }, [units, publish]);

  useEffect(() => {
    let raf = 0;
    const tick = (ts: number) => {
      const x = s.current;
      const dt = x.last ? Math.min(0.25, (ts - x.last) / 1000) : 0;
      x.last = ts;
      let changed = false;
      if (x.playing && !x.finished) {
        x.elapsed += dt;
        const us = unitsRef.current;
        const u = us[x.index];
        if (u) {
          if (x.pause !== null) {
            x.pause -= dt;
            if (x.pause <= 0) {
              x.pause = null;
              if (x.index < us.length - 1) {
                x.index++;
                x.pos = 0;
                changed = true;
              } else {
                x.finished = true;
                x.playing = false;
                changed = true;
                finishRef.current?.();
              }
            }
          } else {
            x.pos += dt * (u.words / unitSeconds(u, wpmRef.current));
            if (x.pos >= u.words) {
              x.pos = u.words;
              if (u.pauseAfter > 0) x.pause = u.pauseAfter;
              else if (x.index < us.length - 1) {
                x.index++;
                x.pos = 0;
                changed = true;
              } else {
                x.finished = true;
                x.playing = false;
                changed = true;
                finishRef.current?.();
              }
            }
          }
        }
        if (ts - x.push > 90) {
          x.push = ts;
          changed = true;
        }
      }
      if (changed) publish();
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [publish]);

  const play = useCallback(() => {
    const x = s.current;
    if (x.finished) {
      x.index = 0;
      x.pos = 0;
      x.pause = null;
      x.finished = false;
      x.elapsed = 0;
    }
    x.playing = true;
    x.last = 0;
    publish();
  }, [publish]);
  const pause = useCallback(() => {
    s.current.playing = false;
    publish();
  }, [publish]);
  const toggle = useCallback(() => (s.current.playing ? pause() : play()), [pause, play]);
  const jump = useCallback(
    (i: number) => {
      const x = s.current;
      x.index = Math.min(Math.max(0, i), Math.max(0, unitsRef.current.length - 1));
      x.pos = 0;
      x.pause = null;
      x.finished = false;
      publish();
    },
    [publish],
  );
  const next = useCallback(() => jump(s.current.index + 1), [jump]);
  const prev = useCallback(() => {
    const x = s.current;
    const u = unitsRef.current[x.index];
    // Past the first third of a sentence, "previous" restarts it. Otherwise it goes back one.
    jump(u && (x.pause !== null || x.pos > Math.max(1, u.words * 0.33)) ? x.index : x.index - 1);
  }, [jump]);
  const reset = useCallback(() => {
    const x = s.current;
    x.playing = false;
    x.elapsed = 0;
    jump(0);
  }, [jump]);

  return { view, play, pause, toggle, jump, next, prev, reset };
}
