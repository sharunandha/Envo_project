@echo off
REM Installation and Setup Script for Windows

echo.
echo 🛰️  India Flood and Landslide Warning System - Setup Script
echo ===========================================================
echo.

REM Check Node.js installation
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js 14+ first.
    exit /b 1
)

for /f "tokens=*" %%i in ('node -v') do set NODE_VERSION=%%i
for /f "tokens=*" %%i in ('npm -v') do set NPM_VERSION=%%i

echo ✓ Node.js %NODE_VERSION% is installed
echo ✓ npm %NPM_VERSION% is installed
echo.

REM Setup Backend
echo 📦 Setting up Backend...
cd backend

if exist .env (
    echo ⚠️  .env file already exists. Skipping...
) else (
    echo Creating .env file from template...
    copy .env.example .env
    echo ✓ .env created
)

echo Installing dependencies...
call npm install
echo ✓ Backend dependencies installed
echo.

cd ..

REM Setup Frontend
echo 📦 Setting up Frontend...
cd frontend

if exist .env (
    echo ⚠️  .env file already exists. Skipping...
) else (
    echo Creating .env file from template...
    copy .env.example .env
    echo ✓ .env created
)

echo Installing dependencies...
call npm install
echo ✓ Frontend dependencies installed
echo.

cd ..

echo ===========================================================
echo ✅ Setup Complete!
echo ===========================================================
echo.
echo 📝 Next Steps:
echo.
echo 1. Start Backend Server:
echo    cd backend && npm start
echo.
echo 2. In another terminal, Start Frontend Development Server:
echo    cd frontend && npm start
echo.
echo 3. Open http://localhost:3000 in your browser
echo.
echo ===========================================================
pause
