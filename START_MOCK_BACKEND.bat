@echo off
REM Mock Backend Startup Script
REM This starts the working mock backend on port 5000

color 0A
echo.
echo ============================================
echo   🛰️ Mock Backend Server Startup
echo ============================================
echo.

set nodePath=C:\nodejs\node-v18.18.0-win-x64
set PORT=5000

echo [*] Using Node.js: %nodePath%
echo [*] Starting on PORT: %PORT%
echo.

REM Kill any existing node processes
echo [*] Cleaning up existing processes...
taskkill /IM node.exe /F >nul 2>&1

REM Wait
timeout /t 2 /nobreak >nul

REM Change to backend directory
cd /d "c:\Users\HP\Desktop\Environment_project\backend"

REM Start the mock server
echo [+] Starting mock server...
echo.
"%nodePath%\node.exe" mock-server.js

echo.
echo [!] Server stopped
pause
