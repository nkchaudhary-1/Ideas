/**
 * End-to-end check of the built reel against the acceptance list in the brief.
 *
 *   npm run build && npm run test:e2e
 *
 * Needs Playwright with Chromium available to Node (`require('playwright')`). It serves `dist/`
 * with `vite preview`, drives the page through the `?debug` handle, and exits non-zero on failure.
 * It checks behaviour that can be read off the DOM and the timeline; it cannot certify 60 fps on
 * real hardware, so it counts layout passes during playback instead, which is what thrash looks like.
 */
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
if (!existsSync(path.join(root, 'dist/index.html'))) {
  console.error('No dist/ found. Run `npm run build` first.');
  process.exit(1);
}
const { chromium } = createRequire(import.meta.url)('playwright');

const PORT = 4173;
const BASE = `http://127.0.0.1:${PORT}/`;
const preview = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--strictPort', '--host', '127.0.0.1'], { cwd: root, stdio: 'ignore' });
const stop = () => preview.kill();
process.on('exit', stop);

for (let i = 0; i < 50; i++) {
  try {
    if ((await fetch(BASE)).ok) break;
  } catch {
    await new Promise((r) => setTimeout(r, 200));
  }
}

const results = [];
const check = async (name, fn) => {
  try {
    const detail = await fn();
    results.push({ name, ok: true, detail });
  } catch (error) {
    results.push({ name, ok: false, detail: error.message });
  }
};
const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};
const near = (a, b, tolerance, label) => assert(Math.abs(a - b) <= tolerance, `${label}: expected ${b}, got ${a}`);

const browser = await chromium.launch();

/** Opens a page, collects console problems, and waits for the debug handle. */
async function open(query, { viewport = { width: 1280, height: 720 }, reducedMotion = 'no-preference' } = {}) {
  const context = await browser.newContext({ viewport, reducedMotion });
  const page = await context.newPage();
  const problems = [];
  page.on('console', (m) => {
    if (m.type() === 'error' || m.type() === 'warning') problems.push(`${m.type()}: ${m.text()}`);
  });
  page.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`));
  page.on('requestfailed', (r) => problems.push(`request failed: ${r.url()}`));
  await page.goto(`${BASE}${query}`);
  await page.waitForFunction(() => window.__reel, null, { timeout: 15000 });
  await page.waitForTimeout(600);
  return { page, problems, context };
}

/** Seeks the paused timeline and reads back layer opacities. */
const at = (page, t) =>
  page.evaluate((time) => {
    const tl = window.__reel.player.timeline;
    tl.pause();
    tl.time(time, false);
    const op = (s) => Number(getComputedStyle(document.querySelector(s)).opacity);
    return {
      cool: op('.world--cool'),
      warm: op('.world--warm'),
      neutral: op('.world--neutral'),
      shade: op('.shade'),
      flash: op('.flash'),
      bloomWarm: op('.bloom--warm'),
    };
  }, t);

/* ---------------------------------------------------------------- pip mode */
const pip = await open('?debug');
const reel = await pip.page.evaluate(() => JSON.parse(JSON.stringify(window.__reel.reel)));

await check('pip: no console errors or warnings', () => assert(pip.problems.length === 0, pip.problems.join(' | ')));

await check('pip: autoplays and loops forever, with no controls and no audio loaded', async () => {
  const state = await pip.page.evaluate(() => {
    const tl = window.__reel.player.timeline;
    return {
      repeat: tl.repeat(),
      playing: !tl.paused(),
      buttons: document.querySelectorAll('button, [role=slider], [role=toolbar]').length,
      audioSrc: [...document.querySelectorAll('audio')].map((a) => a.getAttribute('src')),
      mode: document.querySelector('.app').dataset.mode,
    };
  });
  assert(state.mode === 'pip', 'default mode should be pip');
  assert(state.repeat === -1, `repeat should be -1, got ${state.repeat}`);
  assert(state.playing, 'should be playing on load');
  assert(state.buttons === 0, `pip should show no controls, found ${state.buttons}`);
  assert(state.audioSrc.every((s) => s === null), 'pip must not load any audio');
});

await check('timeline: one master, length pinned to the config duration', async () => {
  const d = await pip.page.evaluate(() => window.__reel.player.timeline.duration());
  near(d, reel.duration, 0.001, 'duration');
  return `${d}s`;
});

await check('retiming: every beat sits on the timeline exactly where the config says', async () => {
  const starts = await pip.page.evaluate(() => window.__reel.player.timeline.getChildren(false, false, true).map((t) => t.startTime()));
  assert(starts.length === reel.beats.length, `expected ${reel.beats.length} beat timelines, found ${starts.length}`);
  reel.beats.forEach((beat, i) => near(starts[i], beat.start, 0.001, `beat ${beat.id}`));
  return reel.beats.map((b) => `${b.id}@${b.start}`).join(' ');
});

// The temperature flip: the first beat that opens warm straight after a beat that closes cool.
const flipBeat = reel.beats.find((b, i) => i > 0 && reel.beats[i - 1].world.to === 'cool' && b.world.from === 'warm');
if (!flipBeat) throw new Error('The config has no cool-to-warm cut to test.');
await check(`temperature flip at ${flipBeat.start}s: cool to warm in one cut, with a bloom`, async () => {
  const before = await at(pip.page, flipBeat.start - 0.05);
  const after = await at(pip.page, flipBeat.start + 0.15);
  const bloom = await at(pip.page, flipBeat.start + 0.05);
  assert(before.cool === 1 && before.warm === 0, `before: ${JSON.stringify(before)}`);
  assert(after.cool === 0 && after.warm === 1, `after: ${JSON.stringify(after)}`);
  assert(bloom.bloomWarm > 0.5, `bloom should be strong just after the cut, got ${bloom.bloomWarm}`);
});

await check('motion style changes at the flip: precise before, loose after', () => {
  const feels = reel.beats.map((b) => `${b.id}:${b.feel}`);
  const i = reel.beats.findIndex((b) => b.id === flipBeat.id);
  assert(reel.beats[i - 1].feel === 'precise' && reel.beats[i].feel === 'loose', feels.join(' '));
});

await check('cut flash: fires at every beat start (loop point included) and is gone within 60 ms', async () => {
  for (const beat of reel.beats) {
    const start = await at(pip.page, beat.start + 0.001);
    const gone = await at(pip.page, beat.start + 0.1);
    assert(start.flash > 0.5, `${beat.id}: flash at start was ${start.flash}`);
    assert(gone.flash === 0, `${beat.id}: flash still ${gone.flash} at +100 ms`);
    const mid = await at(pip.page, beat.start + reel.flash.duration / 2);
    assert(mid.flash > 0 && mid.flash < reel.flash.opacity, `${beat.id}: flash should be decaying at +30 ms, got ${mid.flash}`);
  }
});

await check('no gaps on boundaries: sampled exactly on a beat start or a hook flash change, something is on screen', async () => {
  const hook = reel.beats[0];
  const times = [...reel.beats.map((b) => b.start), ...hook.flashes.map((_, i) => i * hook.flashEvery)].filter((t) => t > 0);
  for (const t of times) {
    await at(pip.page, t);
    const visible = await pip.page.evaluate(() => [...document.querySelectorAll('.beat')].filter((b) => getComputedStyle(b).visibility === 'visible').length);
    assert(visible === 1, `${visible} beats visible at exactly ${t}s`);
  }
  // Inside the hook, exactly one flash frame is up at each change (the question takes over after the last).
  for (let i = 0; i < hook.flashes.length; i++) {
    await at(pip.page, i * hook.flashEvery || 0.002);
    const frames = await pip.page.evaluate(() => [...document.querySelectorAll('.hf')].filter((f) => getComputedStyle(f).visibility === 'visible').length);
    assert(frames === 1, `${frames} hook frames visible at flash ${i}`);
  }
});

await check('loop: the last frame grades back into the first frame, so there is no seam', async () => {
  const first = await at(pip.page, 0.3);
  const last = await at(pip.page, reel.duration - 0.001);
  for (const key of ['cool', 'warm', 'neutral', 'shade']) near(last[key], first[key], 0.01, `layer ${key}`);
  const echo = await pip.page.evaluate(() => document.querySelector('.beat--endcard .end-echo .echo-word')?.textContent);
  const hook = reel.beats[0];
  assert(echo === hook.flashes[0], `the end card should hand off to the first hook word (${hook.flashes[0]}), found ${echo}`);
});

await check('motion on screen is only transform, opacity and visibility', async () => {
  const allowed = new Set(['transform', 'opacity', 'visibility', 'translate', 'rotate', 'scale', 'will-change', 'transform-origin', 'transform-box']);
  // Static values written once by the builders, never animated.
  const staticOnly = new Set(['width', 'grid-column', 'grid-column-start', 'grid-column-end', 'grid-row', 'grid-row-start', 'grid-row-end', '--stage-radius']);
  const offenders = await pip.page.evaluate(
    ({ allowed, staticOnly, times }) => {
      const tl = window.__reel.player.timeline;
      tl.pause();
      const found = new Map();
      for (const t of times) {
        tl.time(t, false);
        for (const el of document.querySelectorAll('.stage, .stage *')) {
          for (const name of el.style) {
            if (allowed.includes(name) || staticOnly.includes(name)) continue;
            found.set(`${el.className?.baseVal ?? el.className} -> ${name}`, true);
          }
        }
      }
      return [...found.keys()];
    },
    { allowed: [...allowed], staticOnly: [...staticOnly], times: Array.from({ length: 76 }, (_, i) => i + 0.4) },
  );
  assert(offenders.length === 0, `non-compositor properties written inline: ${offenders.slice(0, 6).join('; ')}`);
});

/**
 * What every element in the stage looks like right now: visibility, opacity and transform matrix,
 * rounded so float noise does not count. Computed, not inline, because a touched element and an
 * untouched one can look identical while their style attributes differ. The grain is skipped:
 * it is a CSS animation on the compositor and moves by design.
 */
const snapshotSource = (() => {
  const round = (n) => (Math.round(n * 100) / 100).toString();
  const lines = [];
  document.querySelectorAll('.stage *').forEach((el, i) => {
    if (el.classList.contains('grain')) return;
    const cs = getComputedStyle(el);
    const matrix = Array.from(new DOMMatrix(cs.transform === 'none' ? undefined : cs.transform).toFloat64Array(), round).join(',');
    lines.push(`${i} .${el.getAttribute('class') ?? ''} visibility=${cs.visibility} opacity=${round(Number(cs.opacity))} transform=${matrix}`);
  });
  return lines;
}).toString();

await check('rewinding is clean: a time looks the same whether you jump to it or reach it after two full passes and a loop wrap', async () => {
  const times = [0.2, 1.2, 3.9, 4.3, 9, 12.5, 22.05, 25, 35.5, 40, 47, 52, 58, 62, 66, 69, 72, 74.9];
  const jump = (page, t) =>
    page.evaluate(({ source, time }) => {
      const tl = window.__reel.player.timeline;
      tl.pause();
      tl.time(time, false);
      return eval(`(${source})()`);
    }, { source: snapshotSource, time: t });

  // Reference: a brand-new page jumping straight to each time.
  const canon = {};
  for (const t of times) {
    const fresh = await open('?debug');
    canon[t] = await jump(fresh.page, t);
    await fresh.context.close();
  }

  // Worn: sweep forwards through the whole reel twice, across the loop wrap, then visit the times out of order.
  const worn = await open('?debug');
  await worn.page.evaluate(() => {
    const tl = window.__reel.player.timeline;
    tl.pause();
    for (let t = 0; t <= 150; t += 0.25) tl.totalTime(t, false);
  });
  const mismatches = [];
  for (const t of [...times].sort(() => 0.5 - Math.random())) {
    const got = await jump(worn.page, t);
    got.forEach((line, i) => {
      if (line !== canon[t][i]) mismatches.push(`t=${t}: ${canon[t][i].trim()}  !=  ${line.trim()}`);
    });
  }
  await worn.context.close();
  assert(mismatches.length === 0, `${mismatches.length} elements differ after rewinding, e.g. ${mismatches.slice(0, 3).join(' || ')}`);
});

await check('no layout thrash: layout passes per second of playback stay far below the frame count', async () => {
  const cdp = await pip.context.newCDPSession(pip.page);
  await cdp.send('Performance.enable');
  const read = async () => Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map((m) => [m.name, m.value]));
  await pip.page.evaluate(() => {
    // The debug card writes text as it runs, which is its own layout work. Measure the reel without it.
    document.querySelector('.debug')?.remove();
    const tl = window.__reel.player.timeline;
    tl.time(12, false);
    tl.play();
  });
  const a = await read();
  await pip.page.waitForTimeout(6000);
  const b = await read();
  const seconds = b.Timestamp - a.Timestamp;
  const layouts = b.LayoutCount - a.LayoutCount;
  const recalcs = b.RecalcStyleCount - a.RecalcStyleCount;
  assert(layouts / seconds < 10, `${(layouts / seconds).toFixed(1)} layouts per second`);
  return `${(layouts / seconds).toFixed(2)} layouts/s, ${(recalcs / seconds).toFixed(1)} style recalcs/s over ${seconds.toFixed(1)}s`;
});

await check('accessibility: the stage has one description and nothing inside it is exposed', async () => {
  const info = await pip.page.evaluate(() => {
    const stage = document.querySelector('.stage');
    return { role: stage.getAttribute('role'), label: stage.getAttribute('aria-label'), exposed: [...stage.children].filter((c) => c.getAttribute('aria-hidden') !== 'true').length };
  });
  assert(info.role === 'img' && info.label.includes('Neelesh'), 'stage should be role=img with a description that includes the end card');
  assert(info.exposed === 0, `${info.exposed} stage children are exposed to assistive tech`);
});
await pip.context.close();

/* -------------------------------------------------------- reduced motion */
const reduced = await open('?debug', { reducedMotion: 'reduce' });
await check('reduced motion: no console problems, and nothing moves, scales or rotates', async () => {
  assert(reduced.problems.length === 0, reduced.problems.join(' | '));
  const moving = await reduced.page.evaluate(() => {
    const bad = new Set(['x', 'y', 'xPercent', 'yPercent', 'scale', 'scaleX', 'scaleY', 'rotation', 'svgOrigin']);
    const offenders = [];
    for (const tween of window.__reel.player.timeline.getChildren(true, true, false)) {
      const keys = Object.keys(tween.vars ?? {}).filter((k) => bad.has(k));
      if (keys.length) offenders.push(keys.join(','));
    }
    return offenders;
  });
  assert(moving.length === 0, `${moving.length} tweens still move things: ${[...new Set(moving)].join(' | ')}`);
});
await check('reduced motion: no white flash, and cuts become crossfades', async () => {
  for (const beat of reel.beats) assert((await at(reduced.page, beat.start + 0.001)).flash === 0, `flash fired at ${beat.id}`);
  const mid = await at(reduced.page, flipBeat.start + 0.45);
  assert(mid.cool > 0 && mid.cool < 1 && mid.warm > 0 && mid.warm < 1, `world should be mid-crossfade, got cool ${mid.cool} warm ${mid.warm}`);
});
await reduced.context.close();

/* ---------------------------------------------------------------- aspects */
for (const [aspect, ratio, viewport] of [
  ['9:16', 9 / 16, { width: 540, height: 960 }],
  ['1:1', 1, { width: 800, height: 800 }],
  ['16:9', 16 / 9, { width: 1280, height: 720 }],
]) {
  const view = await open(`?debug&aspect=${aspect}`, { viewport });
  await check(`aspect ${aspect}: stage ratio is right, nothing clips, the page never scrolls sideways`, async () => {
    assert(view.problems.length === 0, view.problems.join(' | '));
    const result = await view.page.evaluate(() => {
      const box = document.querySelector('.stage').getBoundingClientRect();
      const tl = window.__reel.player.timeline;
      tl.pause();
      let clipped = [];
      for (let t = 0.5; t < 75; t += 1.5) {
        tl.time(t, false);
        clipped = clipped.concat([...document.querySelectorAll('.l:not(.l--open)')].filter((l) => l.scrollWidth > l.clientWidth + 2).map((l) => l.textContent));
      }
      return { ratio: box.width / box.height, clipped: [...new Set(clipped)], overflow: document.documentElement.scrollWidth - window.innerWidth };
    });
    near(result.ratio, ratio, 0.01, 'stage ratio');
    assert(result.clipped.length === 0, `clipped lines: ${result.clipped.join(' | ')}`);
    assert(result.overflow <= 0, `page scrolls sideways by ${result.overflow}px`);
  });
  await view.context.close();
}

/* -------------------------------------------------------------- full mode */
const full = await open('?mode=full&debug');
await check('full mode: no console problems, transport and a beat-marked timeline are present', async () => {
  assert(full.problems.length === 0, full.problems.join(' | '));
  const info = await full.page.evaluate(() => ({
    repeat: window.__reel.player.timeline.repeat(),
    paused: window.__reel.player.timeline.paused(),
    segments: document.querySelectorAll('.track--dim .seg').length,
    named: [...document.querySelectorAll('.bar button, .bar [role=slider]')].every((el) => el.getAttribute('aria-label') || el.textContent.trim()),
    worlds: [...document.querySelectorAll('.track--dim .seg')].map((s) => s.dataset.world),
    sound: document.querySelectorAll('.bar button[aria-label="Mute"], .bar button[aria-label="Unmute"]').length,
  }));
  assert(info.repeat === 0 && info.paused, 'full mode should start paused and not loop');
  assert(info.segments === reel.beats.length, `expected ${reel.beats.length} beat segments, got ${info.segments}`);
  assert(info.named, 'every control needs an accessible name');
  const hasAudio = Boolean(reel.audio.vo || reel.audio.music);
  assert(info.sound === (hasAudio ? 1 : 0), `the sound button should appear exactly when audio is configured (audio: ${hasAudio}, buttons: ${info.sound})`);
  assert(info.worlds.includes('cool') && info.worlds.includes('warm') && info.worlds.includes('blend') && info.worlds.includes('neutral'), `world spine: ${info.worlds}`);
});

await check('full mode: play, pause, restart, scrub and beat stepping all work', async () => {
  const time = () => full.page.evaluate(() => window.__reel.player.time);
  await full.page.click('button[aria-label="Play"]');
  await full.page.waitForTimeout(700);
  assert((await time()) > 0.6, 'should be playing');
  await full.page.click('button[aria-label="Pause"]');
  const held = await time();
  await full.page.waitForTimeout(300);
  near(await time(), held, 0.001, 'time while paused');

  const box = await full.page.locator('.scrub').boundingBox();
  await full.page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  const middle = await time();
  near(middle, reel.duration / 2, 1, 'scrub to the middle');

  // ] jumps to the start of the next beat.
  const current = [...reel.beats].reverse().find((b) => middle >= b.start);
  await full.page.keyboard.press(']');
  near(await time(), reel.beats[current.index + 1].start, 0.01, 'next beat');

  await full.page.keyboard.press('r');
  await full.page.waitForTimeout(200);
  assert((await time()) < 1, 'restart should go back to the top');
});

await check('full mode: the page never scrolls sideways, wherever the playhead is', async () => {
  for (const t of [0.3, 20, 45, 70, reel.duration - 0.01]) {
    await full.page.evaluate((time) => window.__reel.player.seek(time), t);
    const overflow = await full.page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    assert(overflow <= 0, `page scrolls sideways by ${overflow}px with the playhead at ${t}s`);
  }
});

await check('full mode: the subtitle toggle shows the voiceover line for the current time', async () => {
  await full.page.evaluate(() => window.__reel.player.seek(30));
  await full.page.waitForTimeout(100);
  assert(!(await full.page.locator('.subs[data-on]').count()), 'subtitles should start off');
  await full.page.click('button:has-text("Subtitles")');
  await full.page.waitForTimeout(100);
  const text = await full.page.locator('.subs').textContent();
  assert(await full.page.locator('.subs[data-on]').isVisible(), 'subtitle bar should be visible');
  assert(text.length > 10, `expected a voiceover line, got "${text}"`);
  assert(await full.page.locator('button:has-text("Subtitles")').getAttribute('aria-pressed') === 'true', 'toggle should report pressed');
});
await full.context.close();

await browser.close();
stop();

/* ------------------------------------------------------------------ report */
let failed = 0;
for (const r of results) {
  if (!r.ok) failed++;
  console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.name}${r.detail ? `\n        ${r.detail}` : ''}`);
}
console.log(`\n${results.length - failed}/${results.length} checks passed`);
process.exit(failed ? 1 : 0);
