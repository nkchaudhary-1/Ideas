# SpeakUp 30

A private, 30-day speaking coach for one person: interview practice for Senior, Lead and Staff Product Designer roles. It is a working web app, not a mock-up: it runs a daily session, reads scripts on a teleprompter, records you, transcribes you, analyses what you said and tracks how you change over a month.

Everything is stored on your device. There is no account, no server and no tracking.

## Run it

```bash
cd speakup-30
npm install
npm run dev          # http://localhost:5173
```

```bash
npm run build        # static site in dist/
npm run preview      # serve the build at http://localhost:4173
```

`dist/` is a plain static folder (relative paths, so any sub-path works). Put it on any static host (Vercel, Netlify, GitHub Pages, Cloudflare Pages).

**To practise on your phone, host it over https.** Browsers only allow the microphone on `localhost` or an https page. Open the hosted address on your phone, then Add to Home Screen. It installs as an app and its shell works offline.

## Day 1, immediately

Open the app. The first screen says *Welcome to SpeakUp 30* with one button, **Start Day 1**. That starts the session: a two-minute vocal warm-up, the teleprompter, guided speaking, a challenge question and a reflection.

## What is in it

| Screen | What it does |
| --- | --- |
| Dashboard | Today's topic, objective and length. **Start today's practice** and **Continue where I left off**. Streak, sessions, programme and weekly progress, the 30-day timeline, your last session and your overall improvement. |
| Daily practice | The session runner. Steps, a countdown per step, pause, resume and skip. Closing the app mid-session keeps your place. |
| Teleprompter | Auto-scroll at a words-per-minute pace, real pauses, full screen, font size, line spacing, active-sentence highlight, keyboard shortcuts, microphone, session timer, progress, and three levels of cues. |
| Interview challenge | One question at a time, with a 3-2-1 countdown, a recording timer and countdown, replay, an editable transcript, a report, retry with comparison, and follow-up questions chosen from what you said. |
| Speaking analysis | Every answer, its report, and a way to analyse any pasted transcript. |
| Progress & analytics | Totals, trends for readiness, clarity, fluency, pace and fillers, week by week, previous-session comparison, and the reflection journal. |
| 30-day curriculum | All 30 days with topic, skill, length and a preview of the script and keywords. |
| Settings | Theme, language, recording options, optional AI review, backup, restore and delete. |

### The programme

Days 1–7 foundation, 8–14 process, 15–21 portfolio and collaboration, 22–28 leadership and strategy, then Day 29 (first 90 days) and Day 30 (a full ten-part interview). Session length grows from 20 to 30 minutes and support is removed week by week: full scripts, then script plus bullets, then key phrases only, then nothing.

### The teleprompter

- **Cues** are visually unlike the script: small upper-case pills, green for pauses and breaths, blue for emphasis, grey for delivery tips. They are never read aloud. Intensity is Beginner (all cues), Intermediate (pauses and emphasis) or Advanced (pauses as dots).
- **Pauses are real.** `[PAUSE 2]` stops the prompter for two seconds. `[SLOW]` slows the pace by a quarter until `[CONTINUE]`.
- **Scripts are split into speaking chunks** at sentences, pauses, commas and conjunctions.
- **Make it yours.** Anything personal is a placeholder with coaching, such as your project, role or metric. The scripts contain no invented results.
- **Script support** (Full text, First words, Key phrases) fades the script out in the later weeks.
- Shortcuts: Space play or pause, ← → sentence, ↑ ↓ speed, + − size, R reset, F full screen, M microphone, C cue intensity.

## What is real, and what needs setup

| Feature | Needs | Notes |
| --- | --- | --- |
| Recording, replay, level meter | A browser with `MediaRecorder` and a secure page | Real audio. Pauses and speaking time are measured from the actual microphone signal. |
| Live transcription | A browser with speech recognition (Chrome, Edge, Safari) | Uses the browser's own speech service, English (India) by default. **In Chrome and Edge that service sends audio to the browser maker's servers.** Turn it off in Settings to keep audio on the device. |
| Without speech recognition (for example Firefox) | Nothing | You record, then type or paste the transcript. The app says so plainly. |
| Scores, reports, follow-ups | Nothing | Built from your transcript and the microphone measurements with rules that run on your device. No account, no cost. |
| **AI review** (optional) | **Your own Anthropic API key** | Off until you add a key in Settings. Pressing *Get an AI review* sends the transcript text, never the audio, from your browser straight to Anthropic. Default model `claude-opus-5-5`, editable. The key is stored in this browser only and is never put in backups. |

I could not test a live AI call from the build environment (no outbound route), so that one path is tested only up to the request: the SDK loads on demand, sends a correct browser request and turns failures into plain messages.

## How the analysis works

Nothing is faked. A score is `Not scored` when there is not enough real data.

- **Pace:** words in the transcript divided by the time you spoke, without the silence at both ends. Anything above 300 words a minute is rejected as a mismatch between transcript and recording.
- **Pauses and fluency:** counted from the microphone level. Pauses of one second or more, and two seconds or more, between speech.
- **Filler words** (um, uh, actually, basically, like, you know, so, I think, maybe): counted by context. "I would like to" is not a filler, "it was, like, hard" is. A couple of natural uses are always allowed, and every finding shows why it was or was not counted.
- **Sentences, vocabulary, hedging and apologies:** rule-based, with the sentence quoted. Vocabulary suggestions target unnatural phrasing and never upgrade simple words. A "better sentence" is built from your own words.
- **Structure:** opening, context, explanation, example and conclusion, found by signal phrases.
- **Relevance:** the key ideas for each question, matched against what you said.
- **Phrasing** looks at the words you chose. It does not claim to measure how confident your voice sounds.
- Judgement-style scores top out at 9: rules can say that no problem was found, not that an answer is perfect.

The report has a *How this was scored* section with the exact basis of each number.

## Your data

- Stored in `localStorage` (progress, text) and IndexedDB (recordings, only if you turn on *Keep recordings*). Replay still works for the current visit without saving.
- **Export a backup** as one JSON file and restore it on another device. Recordings and the API key are not included.
- Delete transcripts, recordings or session history separately, or reset everything.
- While recording, a red *Recording* indicator is always visible.

## Where things live

```
src/content/        the programme: week1.ts … week4.ts, final.ts, phases.ts, warmups.ts
src/lib/script.ts   script markup → speaking units (cues, pauses, chunks, placeholders)
src/lib/analysis/   the analysis: fillers, hedges, vocabulary, structure, scoring, follow-ups
src/lib/speech/     microphone capture, silence measurement, speech recognition
src/lib/ai.ts       the optional Claude review
src/components/     prompter, recorder, report, session phases, UI primitives
src/screens/        the eight screens plus the welcome page
```

Script markup: `[PAUSE 1]`, `[PAUSE 2]`, `[BREATHE]`, `[EMPHASISE]`, `[SLOW]`, `[CONTINUE]`, `[TONE]`, `[CONFIDENT]`, `[SMILE]`, `[LOOK UP]`, `*emphasised phrase*`, `{{key|Label|Coaching hint}}`, and a blank line between paragraphs.

## Tests

```bash
npm run typecheck
npm run test:unit                      # script parser, analysis, silence meter, curriculum, stats, backups
npm run build && npm run preview &     # then, in another terminal:
node tests/e2e/smoke.cjs               # Day 1 end to end with a fake microphone
node tests/e2e/finale.cjs              # the simulation days, Day 29 and Day 30
npm run audit                          # design lint, then layout audit at 1600px, dark
node tests/audit/run.cjs --all         # 1600, 2200, light, and phones at 390, 360 and 320
```

The audit drives every screen and dialog with seeded history and checks sideways scroll, 28px minimum targets, accessible names, text wrapping inside controls, corner radii and text contrast. The end-to-end tests need Playwright with Chromium (preinstalled in the Claude Code cloud environment).

## Design

Follows the repo's `/CLAUDE.md`: 24px cards, 32px dialogs, capsule controls (36px, 44px on touch), a 4px grid, a 32px card gutter, sentence case, British spelling, and a bottom-docked sheet pattern on phones. Colours are the brief's palette (`#0C0D10`, `#15171B`, `#282A31`, `#F4F4F5`, `#9799A3`, accent `#C5F26B`), in Geist, with a light theme as an option.

Two deliberate departures from the generic rules, because this brief asks for them: sliders keep the capsule shape and 44px size but use a solid accent fill instead of a gradient ("no unnecessary gradients"), and the cue pills are upper case as the brief specifies.

## Limits worth knowing

- Browser speech recognition can drop or mishear words, especially technical terms. Fix the transcript and press *Update report*. Pace is only as good as the transcript.
- Some phones may not let recording and speech recognition share the microphone. If that happens, the recording still works and you type the transcript. The app tells you when it does.
- Rule-based feedback is a prompt for reflection, not a verdict. The optional AI review is a second opinion, not a replacement for a human coach.
- Not built, on purpose: accounts, sync, social features and gamification.
