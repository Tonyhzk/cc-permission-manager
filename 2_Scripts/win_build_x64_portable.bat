@echo off
chcp 65001 >nul

echo.
echo ================================================================
echo     Claude Code Permission Manager - Build x64 Portable
echo     (Cross-compile from ARM64 to x64 - Portable Version)
echo ================================================================
echo.

:: Get script directory and resolve project paths
set "SCRIPT_DIR=%~dp0"
pushd "%SCRIPT_DIR%.."
set "PROJECT_ROOT=%CD%"
popd
set "SRC_DIR=%PROJECT_ROOT%\src"

:: Set build target directory (avoid network drive issues)
set "CARGO_TARGET_DIR=C:\temp\cc-permission-target"

:: Rust/Cargo path
set "CARGO_BIN=%USERPROFILE%\.cargo\bin"

:: VS Build Tools path
set "VCVARS_PATH=C:\Program Files (x86)\Microsoft Visual Studio\2022\BuildTools\VC\Auxiliary\Build\vcvarsall.bat"

:: Check if Rust is installed
if not exist "%CARGO_BIN%\cargo.exe" (
    echo [ERROR] Cargo not found at: %CARGO_BIN%
    echo Please install Rust:
    echo winget install Rustlang.Rustup
    echo.
    pause
    exit /b 1
)

:: Check if VS Build Tools exists
if not exist "%VCVARS_PATH%" (
    echo [ERROR] Visual Studio Build Tools not found
    echo Please run:
    echo winget install Microsoft.VisualStudio.2022.BuildTools --override "--wait --passive --add Microsoft.VisualStudio.Workload.VCTools --includeRecommended"
    echo.
    pause
    exit /b 1
)

:: Check if src directory exists
if not exist "%SRC_DIR%\package.json" (
    echo [ERROR] package.json not found in: %SRC_DIR%
    pause
    exit /b 1
)

:: Create build target directory
if not exist "%CARGO_TARGET_DIR%" (
    echo [INFO] Creating build target directory: %CARGO_TARGET_DIR%
    mkdir "%CARGO_TARGET_DIR%"
)

echo [INFO] Project directory: %SRC_DIR%
echo [INFO] Build directory: %CARGO_TARGET_DIR%
echo [INFO] Target: x86_64-pc-windows-msvc (x64 Portable)
echo.

:: Initialize ARM64 to x64 cross-compile environment
echo [INFO] Initializing ARM64 to x64 cross-compile environment...
echo.

call "%VCVARS_PATH%" arm64_amd64
if errorlevel 1 (
    echo [ERROR] Failed to initialize MSVC cross-compile environment
    pause
    exit /b 1
)

:: Add Cargo to PATH
set "PATH=%CARGO_BIN%;%PATH%"

echo.
echo [INFO] Building x64 release (portable)...
echo [INFO] This may take a few minutes...
echo.

:: Switch to src directory
pushd "%SRC_DIR%"
if errorlevel 1 (
    echo [ERROR] Failed to change directory to %SRC_DIR%
    pause
    exit /b 1
)

echo [INFO] Working directory: %CD%
echo.

:: Build x64 version (will create installer, we'll extract exe later)
pnpm tauri build --target x86_64-pc-windows-msvc

if errorlevel 1 (
    echo.
    echo [ERROR] Build failed!
    popd
    pause
    exit /b 1
)

:: Set output paths
set "BUILD_OUTPUT=%CARGO_TARGET_DIR%\x86_64-pc-windows-msvc\release"
set "PORTABLE_DIR=%PROJECT_ROOT%\portable-x64"

echo.
echo [INFO] Creating portable package...
echo.

:: Clean old portable directory
if exist "%PORTABLE_DIR%" (
    echo [INFO] Cleaning old portable directory...
    rmdir /s /q "%PORTABLE_DIR%"
)

:: Create portable directory
mkdir "%PORTABLE_DIR%"

:: Copy main executable
echo [INFO] Copying executable...
copy "%BUILD_OUTPUT%\cc-permission-manager.exe" "%PORTABLE_DIR%\" >nul
if errorlevel 1 (
    echo [ERROR] Failed to copy executable
    popd
    pause
    exit /b 1
)

:: Copy all DLL files (if exist)
if exist "%BUILD_OUTPUT%\*.dll" (
    echo [INFO] Copying DLL files...
    copy "%BUILD_OUTPUT%\*.dll" "%PORTABLE_DIR%\" >nul
)

:: Copy resources folder (templates, etc.)
echo [INFO] Copying resources folder...
if exist "%SRC_DIR%\public" (
    xcopy "%SRC_DIR%\public" "%PORTABLE_DIR%\resources\public\" /E /I /Y >nul
    if errorlevel 1 (
        echo [WARN] Failed to copy resources folder
    ) else (
        echo [INFO] Resources copied successfully
    )
) else (
    echo [WARN] Public folder not found at: %SRC_DIR%\public
)

:: Create README file
echo [INFO] Creating README...
(
echo CC Permission Manager - Portable Version
echo ========================================
echo.
echo This is the portable version of CC Permission Manager.
echo.
echo Usage:
echo   1. Run cc-permission-manager.exe directly
echo   2. All settings will be saved in your user directory
echo.
echo Version: 0.3.0
echo Target: x64 ^(Windows 10/11^)
echo.
echo For more information, visit:
echo https://github.com/Tonyhzk/cc-permission-manager
) > "%PORTABLE_DIR%\README.txt"

echo.
echo ================================================================
echo     Portable build completed successfully!
echo ================================================================
echo.
echo Output location:
echo   %PORTABLE_DIR%
echo.
echo Files:
dir /b "%PORTABLE_DIR%"
echo.

popd
pause
