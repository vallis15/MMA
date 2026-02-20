@echo off
REM MMA Manager - One-Click Project Starter
REM This script sets up and starts the MMA Manager application

echo.
echo ================================
echo   MMA MANAGER - Project Starter
echo ================================
echo.

REM Check if node_modules exists
if not exist "node_modules" (
    echo [+] Installing dependencies...
    call npm install
    if errorlevel 1 (
        echo [-] Failed to install dependencies
        pause
        exit /b 1
    )
    echo [+] Dependencies installed successfully
) else (
    echo [+] Dependencies already installed
)

echo.
echo [+] Starting development server...
echo.

REM Start the development server
call npm run dev

pause
