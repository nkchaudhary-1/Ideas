@echo off
rem No-install fallback: opens the wallpaper full-screen in Edge with the microphone allowed (no PC stats, no voice commands).
start "" msedge --app="file:///%~dp0app/themes/studio/index.html?theme=engine" --start-fullscreen --use-fake-ui-for-media-stream --user-data-dir="%TEMP%\jarvis-hud"
