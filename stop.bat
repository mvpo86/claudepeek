@echo off
cd /d "%~dp0"

set FOUND=0
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3737 "') do (
    if not %%a==0 (
        taskkill /PID %%a /F >nul 2>&1
        set FOUND=1
    )
)

if %FOUND%==1 (
    echo Server stopped.
) else (
    echo Server is not running.
)
