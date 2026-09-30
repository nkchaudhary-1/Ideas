# Jarvis Wallpaper

Voice-reactive Jarvis HUD for Windows, packaged as an installable app (`Jarvis Wallpaper Setup.exe`).

Everything you see reacts to **real microphone input** (Web Audio FFT + waveform). With no sound the visuals sit still.
CPU / RAM / network bars show **real** system values from the app; nothing is simulated.

| Theme | Look |
|---|---|
| `brain` | Original Claude-brain: terracotta neural net + radar rings |
| `hud` | Tilted HUD: spectrum ring, level gauge, waveform ring, side panels, brain core. Palettes: Claude / Mono / Reactor |
| `eye` | Monochrome glass lens with voice ripples |

## A. Install (get the .exe)
1. GitHub → repo `nkchaudhary-1/Ideas` → **Actions** → **Build Windows installer** → latest green run → download the **Jarvis-Wallpaper-Setup** artifact (zip) → unzip.
   (A run starts automatically on every push to this branch; or click **Run workflow**. Tagging `v1.0.0` also attaches the .exe to a GitHub Release.)
2. Run `Jarvis Wallpaper Setup 1.0.0.exe`. Windows SmartScreen will warn (unsigned): **More info → Run anyway**.
3. Finish the installer. Launch **Jarvis Wallpaper** from the desktop shortcut.

## B. Use
- A tray icon (bottom-right, may be under `^`) controls everything: **Theme**, **HUD palette**, **Mic sensitivity**, **Mode**, **Start with Windows**, **Quit**.
- **Mode → Window**: fullscreen on each monitor, **Esc** quits. Most reliable.
- **Mode → Wallpaper (experimental)**: attaches behind desktop icons (WorkerW technique). If you see a black screen, switch back to Window mode.
- Mic is allowed automatically. Windows Settings → Privacy → Microphone → "Let desktop apps access your microphone" must be **On**.
- Greeting uses your Windows username.

## C. Build it yourself
```
cd jarvis-wallpaper/app
npm install
npm start          # run without installing
npm run dist       # builds dist/Jarvis Wallpaper Setup 1.0.0.exe (run this on Windows)
```
Requires Node 20+.

## D. Without the app
`launch.bat [hud|brain|eye]` opens a theme in fullscreen Edge (mic auto-allowed, no stats).
`app/themes/<theme>/index.html` can also be added to Lively Wallpaper; Lively's browser may block the mic.

## Notes / limits
- Reacts to the **microphone** only. Reacting to system audio (music) would need a loopback capture; tell me if you want it.
- Live speech-to-text was removed: Electron has no speech-recognition backend. Adding one means a local model (Whisper) or a cloud API key.
- The .exe must be built on Windows (the GitHub Action does it); it can't be produced from this Linux session.
