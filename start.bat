@echo off
cd /d "%~dp0"

netstat -ano | findstr ":3737 " >nul 2>&1
if not errorlevel 1 (
    echo Server is already running at http://localhost:3737
    start http://localhost:3737
    exit /b 0
)

echo Starting claudestats...
start "claudestats" node server.js

timeout /t 2 /nobreak >nul
echo Running at http://localhost:3737
echo Close the "claudestats" window or run stop.bat to shut it down.
start http://localhost:3737
