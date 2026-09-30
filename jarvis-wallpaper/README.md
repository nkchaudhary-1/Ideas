# Jarvis Wallpapers (Windows)

| Folder | Theme | Reacts to mic |
|---|---|---|
| `brain/` | Original Claude-brain: terracotta neural brain + radar rings (unchanged look) | Pulse rate, glow, rotation speed |
| `hud/`   | Perspective HUD: spectrum ring, gauge, waveform ring, side panels, brain core. Keys **1/2/3** = Claude / Mono / Reactor palettes | Everything |
| `eye/`   | Minimal monochrome glass lens with voice ripples | Everything |

## Setup

### 1. Get the files
1. Open the repo `nkchaudhary-1/Ideas`, branch `claude/eloquent-einstein-ljiepr`.
2. **Code → Download ZIP**, then unzip to a permanent folder, e.g. `C:\Wallpapers\jarvis-wallpaper`.
   (Don't move it afterwards, or re-add it.)

### 2A. Mode A — Mic-reactive (recommended): `launch.bat`
Uses Microsoft Edge (already on Windows). Mic is auto-allowed.
1. Double-click `launch.bat` for the HUD, or run `launch.bat brain` / `launch.bat eye` from a terminal.
2. Fullscreen window opens; speak and it reacts. Press **Alt+F4** to close.
3. Run at startup (optional): press `Win+R` → `shell:startup` → drop a shortcut to `launch.bat` there.

Limitation: it's a fullscreen window, not a real desktop layer, so desktop icons and the taskbar are hidden behind it.

### 2B. Mode B — True wallpaper with Lively Wallpaper
Reacts to **system audio** (music/video). Mic support depends on Lively's browser and may be blocked.
1. Install **Lively Wallpaper** (free): Microsoft Store, or rocksdanister.com/lively.
2. Open Lively → **+ Add Wallpaper** → **Browse** → select `hud\index.html` (repeat for `brain` and `eye`).
   Lively picks up `LivelyInfo.json` / `LivelyProperties.json` from the same folder.
3. Click the wallpaper to apply it. Right-click the thumbnail → **Customize** for theme, mic sensitivity, tilt, name, neuron count.
4. Lively Settings → Performance: set **Pause when fullscreen app is running** (saves battery/GPU).

### 3. Tips
- Keys (Mode A): **1/2/3** palette, **M** request mic, **B** toggle brain core (HUD).
- Laggy? Lower **Neuron count** (Customize) or use the `eye` theme (lightest).
- Mic doesn't react: click once on the page; check Windows Settings → Privacy → Microphone → allow for desktop apps; raise **Mic sensitivity**.
- Live transcript text works in Edge/Chrome only; it sends audio to the browser's speech service. Delete the `startSR()` call in `hud/index.html` if you want it fully offline.
- Name on the greeting: Customize → **Greeting name** (Lively) or edit `name:'Neelesh'` in the file.
