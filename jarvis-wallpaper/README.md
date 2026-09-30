# Jarvis Wallpaper

A live knowledge-graph of your PC, in the style of a "second brain" star map. Your machine is the graph:

- **Hubs** (labelled, with counts): CPU · MEMORY · GPU · STORAGE · NETWORK · PROCESSES · VOICE
- **Stars**: every CPU core, 18 memory cells, each drive, each top process, upload/download, and 20 voice bands. Size and glow = the real value.
- **Links**: thin lines between hubs and nodes; light pulses travel along them faster when that part of the PC is busy.
- **Your voice** (real microphone): the voice stars flare, links arc with your waveform, everything pulses.

Nothing is simulated. No data yet shows `--`.

## 6 modes (same live data, different worlds)
`01 Quantum Flow` · `02 Knowledge Orb` · `03 Layered Intelligence` · `04 Knowledge Galaxy` · `05 Intelligence Engine` (tilted orbital rings R 03.0 / 08.0 / 13.5) · `06 Neural Brain` (the original brain at the core)

Switch by clicking the pill bar (window mode), tray → Theme, `Ctrl+Alt+← / →`, or say "jarvis switch to knowledge galaxy". Modes morph into each other.

## Controls
- **Top nav** (click to hide/show): SYSTEM NODES · PROCESSES · STORAGE · NETWORK · VOICE. Also tray → Data panels, `Ctrl+Alt+H` for all.
- **Hover** a star for its value (window mode).
- **Tray → Accent colour**: Cyan (default), Claude terracotta, Mono, Amber, Violet, Jade.
- **Shortcuts**: `Ctrl+Alt+←/→` theme · `Ctrl+Alt+H` hide/show data · `Ctrl+Alt+V` voice commands · `Esc` quit (window mode).

## Voice commands (offline)
Uses the speech recogniser built into Windows, nothing leaves your PC. Say the wake word + phrase:
- **Open**: "jarvis open downloads / documents / desktop / pictures", "open settings / display / sound / bluetooth / wifi / update settings", "open task manager / calculator / notepad / command prompt", "take screenshot", "open browser / youtube"
- **System**: "lock computer", "volume up / down", "mute", "play pause", "next / previous track"
- **Wallpaper**: "switch to <mode name>", "next theme", "hide data / show data", "hide / show cpu / memory / network / processes …", "mic louder / quieter", "quit wallpaper"

Add your own: tray → Voice commands → **Edit my commands** (`commands.json`):
```json
{ "say": "open projects", "do": "open", "target": "D:\\Projects" }
{ "say": "open chrome",   "do": "run",  "target": "chrome" }
```
`do`: `open` (folder / file / URL / `ms-settings:`) · `run` (program + `args`) · `media` · `app`. Save, then **Reload commands**. Only add commands you trust. Only listed phrases are recognised, so normal speech or music won't trigger anything; raise `minConfidence` if needed. Matching is forgiving: the wake word tolerates mis-hearings ("service", "travis"…) and phrases are fuzzy-matched, so "jarvis opn sound setings" still works.

### If voice commands do nothing
1. Bottom-right status: `● voice ready` = engine running, `✕ voice engine error` = see the toast, `○ voice off` = disabled (tray → Voice commands → Enabled).
2. Speak, then watch the top-right box: it shows what Windows heard. "speech not understood" = too quiet or unclear; raise Windows mic volume, speak closer.
3. Tray → Voice commands → **Test: simulate "jarvis open downloads"**. If that opens Downloads, actions work and only recognition is the problem.
4. Tray → Voice commands → **Open voice log**. Send me that file if it still fails.
5. Windows needs a speech recogniser: Settings → Time & language → Speech (en-US/en-GB etc.). Privacy → Microphone → allow desktop apps.


## Install
1. GitHub → **Actions** → **Build Windows installer** → latest green run → artifact **Jarvis-Wallpaper-Setup** → unzip.
2. Run the `.exe` (SmartScreen: *More info → Run anyway*, it is unsigned). Uninstall any older version first.
3. Open **Jarvis Wallpaper**; everything is controlled from the tray icon. Allow desktop apps to use the microphone in Windows Settings → Privacy.

## Build it yourself
```
cd jarvis-wallpaper/app && npm install && npm start
npm run dist      # installer, run on Windows
```

## Limits
- Window mode is reliable. Wallpaper mode (behind desktop icons) is experimental and is not clickable.
- GPU % and CPU temperature appear only when Windows exposes them.
- Reacts to the microphone, not system audio.
