@echo off
title bgnk4 server
cd /d "%~dp0"
if not exist node_modules (
  echo Installiere Abhaengigkeiten...
  call npm install
)
start "bgnk4" cmd /k npm start
timeout /t 3 /nobreak >nul
where ngrok >nul 2>&1
if %errorlevel%==0 (
  start "ngrok" cmd /k ngrok http 8080
  echo.
  echo Server: http://localhost:8080
  echo ngrok-Fenster oeffnen fuer die oeffentliche URL
) else (
  echo.
  echo Server: http://localhost:8080
)
pause
