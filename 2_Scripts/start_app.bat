@echo off
setlocal enabledelayedexpansion

:: CC Permission Manager Startup Script
:: Refresh PATH to include newly installed tools
for /f "tokens=2*" %%a in ('reg query "HKLM\SYSTEM\CurrentControlSet\Control\Session Manager\Environment" /v Path 2^>nul') do set "SYS_PATH=%%b"
for /f "tokens=2*" %%a in ('reg query "HKCU\Environment" /v Path 2^>nul') do set "USER_PATH=%%b"
set "PATH=%SYS_PATH%;%USER_PATH%"

echo.
echo === CC Permission Manager ===
echo.

:: Get script directory and resolve project paths
set "SCRIPT_DIR=%~dp0"
:: Remove trailing backslash
set "SCRIPT_DIR=%SCRIPT_DIR:~0,-1%"
:: Get parent directory
for %%I in ("%SCRIPT_DIR%") do set "PROJECT_ROOT=%%~dpI"
set "PROJECT_ROOT=%PROJECT_ROOT:~0,-1%"
set "SRC_DIR=%PROJECT_ROOT%\src"

:: Check if src directory exists
if not exist "%SRC_DIR%" (
    echo [ERROR] src directory not found: %SRC_DIR%
    pause
    exit /b 1
)

:: Change to src directory
pushd "%SRC_DIR%"
echo [INFO] Working directory: %CD%
echo.

:: Check if pnpm is installed
where pnpm >nul 2>&1
if errorlevel 1 (
    echo [ERROR] pnpm not installed
    echo Please install: npm install -g pnpm
    echo.
    echo If you just installed Node.js/pnpm:
    echo 1. Close this window
    echo 2. Open a new terminal
    echo 3. Run this script again
    pause
    popd
    exit /b 1
)

:: Check if node_modules exists
if not exist "node_modules" (
    echo [WARN] node_modules not found, installing dependencies...
    echo.
    pnpm install
    if errorlevel 1 (
        echo.
        echo [ERROR] Dependency installation failed
        pause
        popd
        exit /b 1
    )
    echo.
)

:: Start application
echo [START] Starting CC Permission Manager...
echo [TIP] Press Ctrl+C to stop
echo.

pnpm tauri dev

popd
