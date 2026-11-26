/**
 * The whole reel lives in this file: copy, timings, worlds and the numbers.
 * Nothing in the animation code needs touching to retime or reword it.
 *
 * RETIMING
 *  - Each beat has an `in`. It ends where the next beat starts, so moving one boundary is one edit.
 *  - `duration` is the end of the last beat (and the loop point).
 *  - Times are seconds (`75`) or clocks (`"1:15"`, `"0:22.5"`). Every beat needs at least 3 seconds.
 *  - Choreography inside a beat is laid out as fractions of its length, so it stretches with it.
 *  - Boundaries that sit on the 120 bpm grid (every half second) will line up with a music bed.
 *
 * CAPTION MARKUP
 *  - `_text_` is set dimmer, `\n` forces a line break.
 *  - An array of strings means the beat reveals them one after another.
 *
 * WORLDS
 *  - `cool` (the designer), `warm` (the human), `neutral` (the end card).
 *  - `{ from, to }` blends across the beat. `dim` darkens the grade.
 *  - A change of world on a cut is a hard cut, and a cool/warm change also gets a heat bloom.
 */
import type { ReelConfig } from './types';

export const reel: ReelConfig = {
  title: "This isn't my job, it's my thing",
  duration: '1:15',
  bpm: 120,
  poster: 0.3,
  loopBlend: 0.8,
  flash: { opacity: 0.85, duration: 0.06 },

  // Leave both empty to ship silent. Put your files in public/audio/ and use paths like 'audio/vo.mp3'.
  audio: { vo: '', music: '', musicGain: 0.35 },

  beats: [
    {
      id: 'hook',
      kind: 'hook',
      label: 'Hook',
      in: '0:00',
      world: 'cool',
      dim: 0.5,
      // Added on top of the brief so the question reads with the sound off. Delete it to keep only the flashes.
      caption: "_You're a designer?_\nSo what do you actually do?",
      vo: "People always ask — you're a designer? So what do you actually do?",
      flashes: ['SKETCH', 'SHUTTER', 'FIGMA', 'UNLOCK'],
      flashEvery: 0.5,
    },
    {
      id: 'companies',
      kind: 'companies',
      label: 'Companies',
      in: '0:04',
      world: 'cool',
      caption: 'I build products millions use — every day.',
      vo: 'Simple. I build products that millions of people use, every single day.',
      companies: ['Nykaa Fashion', 'Nike India', 'H&M', 'Zomato', 'Deloitte'],
    },
    {
      id: 'numbers',
      kind: 'numbers',
      label: 'Numbers',
      in: '0:12',
      world: 'cool',
      caption: 'Moved real numbers.',
      vo: "I've moved orders, lifted conversions, improved retention. And yeah — a Game Changer Award along the way.",
      metrics: [
        { prefix: '+', value: 4.49, decimals: 2, suffix: '%', label: 'Order placement' },
        { prefix: '+', value: 847, suffix: ' bps', label: 'Import intent' },
        { value: 47, suffix: '%', label: 'Gamification CVR' },
      ],
      award: 'Game Changer Award',
    },
    {
      // 0:22: the temperature flip. Cool turns warm, and the motion goes from locked to loose.
      id: 'curiosity',
      kind: 'curiosity',
      label: 'The real fuel',
      in: '0:22',
      world: 'warm',
      caption: "_Honestly?_\nI'm just endlessly curious.",
      vo: "But honestly — I love this work because I'm endlessly curious. I see design everywhere: a signboard, a sunset, some random little app.",
      sightings: [
        { art: 'signboard', label: 'A signboard' },
        { art: 'sunset', label: 'A sunset' },
        { art: 'app', label: 'Some random little app' },
      ],
    },
    {
      id: 'builder',
      kind: 'builder',
      label: 'Builder',
      in: '0:34',
      world: 'warm',
      // Three phases. The third is in the voiceover but not the brief's caption; delete it to drop it.
      caption: ['_New trend?_\nI try it.', '_Boring task?_\nI build a plugin.', "_AI?_\nWe're friends."],
      vo: "So I never really stop. New trend? I try it. Boring repetitive task? I build a plugin for it. AI? We're friends.",
    },
    {
      id: 'craft',
      kind: 'craft',
      label: 'Craft',
      in: '0:46',
      world: 'cool',
      caption: ['From one pixel', 'to a whole system.'],
      vo: "One small screen or an entire design system — I'm in love with structure. The pixel, and the pattern.",
    },
    {
      id: 'close',
      kind: 'close',
      label: 'Close',
      in: '0:56',
      world: { from: 'cool', to: 'warm' },
      years: 7,
      caption: 'years in.\nSame excitement.',
      // Added on top of the brief: the line the reel is named after, so it lands with the sound off.
      payoff: "_This isn't my job…_\nit's my thing.",
      vo: "Seven years in, and the excitement's exactly the same. Because this isn't my job… it's my thing.",
    },
    {
      id: 'endcard',
      kind: 'endcard',
      label: 'End card',
      in: '1:08',
      world: 'neutral',
      caption: 'Neelesh',
      role: 'Product Designer',
      url: 'neelesh.one',
      vo: "Neelesh. Let's build something.",
    },
  ],
};
