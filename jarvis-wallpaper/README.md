# Jarvis Wallpaper

Voice-reactive Jarvis HUD for Windows, packaged as an installer. Everything reacts to your **real microphone**. All PC numbers are **real** (CPU per core, RAM, disks, network, GPU, processes, battery, uptime). Nothing is simulated; with no data a field shows `--`.

## Design language
Taken from the original Claude Brain wallpaper: hairline strokes, one restrained accent, serif numerals, tiny tracked labels, vignette + scanlines, and the neural brain with firing pulses as the centrepiece. **Tray → Accent colour** recolours every theme: Claude terracotta (default), Ice, Mono, Amber, Violet, Jade.

## 13 themes
| Theme | Composition | PC data shown as |
|---|---|---|
| **Cortex** | neural brain inside fine concentric rings | clock, CPU/RAM/GPU left; network, storage, processes right |
| **Blueprint** | serif headline + hairline mesh sphere | leader-line callouts to the sphere |
| **Cockpit** | tilted glass pitch ladder | rungs = per-core load, tapes = CPU / RAM, markers = top processes |
| **Target** | symmetric reticle with katakana title | load bar, side readouts |
| **Orb** | glass orb holding the brain | thin orbit gauges: CPU / RAM / disk / network |
| **Halo** | tilted ring lens | CPU as a tick gauge around a serif numeral |
| **Sensory** | minimal symmetric panels | LEFT / RIGHT XYZ readouts |
| **Poster** | technical compass | tick arcs lit by CPU / RAM / disk / net |
| **Radar** | process radar | each top process is a blip; voice sends ripples |
| **Console** | dense dashboard | 90 s history graphs, per-core bars, process table |
| Core HUD, Claude Brain, Eye | the classic three | real stats |

## Show / hide data
Tray → **Data panels**: CPU, Memory, Storage, Network, Processes, GPU, Battery, System info & clock, Voice log. **Ctrl+Alt+H** hides/shows all. Voice: “jarvis hide processes”, “jarvis show data”.

## Shortcuts (work from anywhere)
`Ctrl+Alt+→ / ←` next / previous theme · `Ctrl+Alt+H` toggle all data · `Ctrl+Alt+V` voice commands on/off · `Esc` quit (Window mode)

## Voice commands (offline)
Uses the speech recogniser built into Windows (System.Speech), so nothing is sent to the cloud. Say the wake word + phrase:

- **Open**: “jarvis open downloads / documents / desktop / pictures”, “open settings / display settings / sound settings / bluetooth settings / wifi settings / update settings”, “open task manager / calculator / notepad / command prompt”, “take screenshot”, “open browser / youtube”
- **System**: “jarvis lock computer”, “volume up / volume down / mute”, “play pause / next track / previous track”
- **Wallpaper**: “switch to radar” (any theme name), “next theme”, “previous theme”, “hide data / show data”, “hide / show cpu / memory / network / processes …”, “mic louder / mic quieter”, “quit wallpaper”

### Add your own
Tray → Voice commands → **Edit my commands** opens `commands.json`:
```json
{ "wake": "jarvis", "minConfidence": 0.7,
  "commands": [
    { "say": "open projects",  "do": "open", "target": "D:\\Projects" },
    { "say": "open chrome",    "do": "run",  "target": "chrome" },
    { "say": "open my site",   "do": "open", "target": "https://example.com" },
    { "say": "open vs code",   "do": "run",  "target": "code", "args": ["D:\\Projects"] }
  ] }
```
`do`: `open` (folder / file / URL / `ms-settings:` page) · `run` (program + optional args) · `media` · `app`. Save, then tray → **Reload commands**. Only add commands you trust: they run with your permissions. Only phrases in this list are recognised (a fixed grammar), so ordinary speech and music won't trigger anything. Raise `minConfidence` if you get false triggers.
Needs a Windows speech recogniser for your language (en-US ships with Windows). A toast at the bottom shows what was heard and whether it ran.

## Install
1. GitHub → repo → **Actions** → **Build Windows installer** → latest green run → artifact **Jarvis-Wallpaper-Setup** → unzip.
2. Run the `.exe` (SmartScreen: *More info → Run anyway*, it is unsigned).
3. Open **Jarvis Wallpaper**; control everything from the tray icon.

Mic permission is automatic; Windows Settings → Privacy → Microphone → allow desktop apps.

## Build it yourself
```
cd jarvis-wallpaper/app && npm install && npm start      # run
npm run dist                                             # installer (on Windows)
```

## Limits
- Window mode is reliable. Wallpaper mode (behind icons) is experimental.
- GPU % and CPU temperature appear only when Windows exposes them (NVIDIA usually yes, others often not). Hidden when unavailable.
- Reacts to the microphone, not system audio.
