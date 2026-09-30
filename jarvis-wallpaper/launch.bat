@echo off
rem Full-screen HUD window with microphone auto-allowed (Edge ships with Windows).
start "" msedge --app="file:///%~dp0index.html" --start-fullscreen --use-fake-ui-for-media-stream --user-data-dir="%TEMP%\jarvis-hud"
