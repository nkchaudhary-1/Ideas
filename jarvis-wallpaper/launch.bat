@echo off
rem No-install fallback: launch.bat [hud|brain|eye]. Opens the theme full-screen in Edge with the mic allowed.
set THEME=%1
if "%THEME%"=="" set THEME=hud
start "" msedge --app="file:///%~dp0app/themes/%THEME%/index.html" --start-fullscreen --use-fake-ui-for-media-stream --user-data-dir="%TEMP%\jarvis-%THEME%"
