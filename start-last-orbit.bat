@echo off
setlocal

cd /d "%~dp0"
set "PORT=4173"
set "GAME_URL=http://127.0.0.1:%PORT%/games/last-orbit/"

powershell -NoProfile -Command "if (Get-NetTCPConnection -LocalPort %PORT% -State Listen -ErrorAction SilentlyContinue) { exit 0 } else { exit 1 }" >nul 2>&1
if not errorlevel 1 (
  start "" "%GAME_URL%"
  exit /b 0
)

where py >nul 2>&1
if not errorlevel 1 (
  set "PYTHON=py -3"
  goto :start_server
)

where python >nul 2>&1
if not errorlevel 1 (
  set "PYTHON=python"
  goto :start_server
)

echo Python was not found.
echo Install Python 3, then run this file again.
pause
exit /b 1

:start_server
echo Starting Last Orbit at %GAME_URL%
echo Keep this window open while playing. Press Ctrl+C to stop the server.
start "" powershell -NoProfile -WindowStyle Hidden -Command "Start-Sleep -Milliseconds 900; Start-Process '%GAME_URL%'"
%PYTHON% -m http.server %PORT% --bind 127.0.0.1

if errorlevel 1 (
  echo.
  echo The local server could not be started.
  pause
)

endlocal
