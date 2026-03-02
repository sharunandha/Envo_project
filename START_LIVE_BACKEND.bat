@echo off
REM Live Backend Startup Script
REM This starts the REAL live backend on port 5000 (fetches from Open-Meteo, NASA, USGS, GloFAS)

color 0A
echo.
echo ============================================
echo   India Flood ^& Landslide Warning System
echo   LIVE DATA Backend Server
echo ============================================
echo.

set PORT=5000

REM Try common Node.js locations
where node >nul 2>&1
if %ERRORLEVEL%==0 (
    set NODE_CMD=node
    goto :found
)

if exist "C:\nodejs\node-v18.18.0-win-x64\node.exe" (
    set NODE_CMD=C:\nodejs\node-v18.18.0-win-x64\node.exe
    set PATH=C:\nodejs\node-v18.18.0-win-x64;%PATH%
    goto :found
)

if exist "C:\Program Files\nodejs\node.exe" (
    set NODE_CMD="C:\Program Files\nodejs\node.exe"
    goto :found
)

echo [ERROR] Node.js not found! Please install Node.js first.
pause
exit /b 1

:found
echo [*] Using Node.js: %NODE_CMD%
echo [*] Starting LIVE server on PORT: %PORT%
echo.

REM Kill any existing node processes on port 5000
echo [*] Cleaning up existing processes...
taskkill /IM node.exe /F >nul 2>&1
timeout /t 2 /nobreak >nul

REM Change to backend directory
cd /d "%~dp0backend"

REM Install deps if needed
if not exist "node_modules" (
    echo [*] Installing backend dependencies...
    call npm install
    echo.
)

REM Start the LIVE server (NOT mock)
echo [+] Starting LIVE data server...
echo [*] First load may take 30-60 seconds as it fetches data for 50+ dams
echo.
%NODE_CMD% server.js

echo.
echo [!] Server stopped
pause
