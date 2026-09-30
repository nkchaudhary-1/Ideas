@echo off
rem Usage: launch.bat [hud|brain|eye]   (default: hud)
rem Opens the chosen theme full-screen in Edge with the microphone auto-allowed.
set THEME=%1
if "%THEME%"=="" set THEME=hud
start "" msedge --app="file:///%~dp0%THEME%/index.html" --start-fullscreen --use-fake-ui-for-media-stream --user-data-dir="%TEMP%\jarvis-%THEME%"
