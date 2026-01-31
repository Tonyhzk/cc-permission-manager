@echo off
chcp 65001 >nul

echo.
echo ================================================================
echo     Claude Code Permission Manager - Windows x64 Dev Launcher
echo     (Cross-compile from ARM64 to x64)
echo ================================================================
echo.

:: 获取脚本所在目录并转换为绝对路径
set "SCRIPT_DIR=%~dp0"
pushd "%SCRIPT_DIR%.."
set "PROJECT_ROOT=%CD%"
popd
set "SRC_DIR=%PROJECT_ROOT%\src"

:: 设置编译目标目录（避免网络驱动器问题）
set "CARGO_TARGET_DIR=C:\temp\cc-permission-target"

:: Rust/Cargo 路径
set "CARGO_BIN=%USERPROFILE%\.cargo\bin"

:: VS Build Tools 路径
set "VCVARS_PATH=C:\Program Files (x86)\Microsoft Visual Studio\2022\BuildTools\VC\Auxiliary\Build\vcvarsall.bat"

:: 检查 Rust 是否安装
if not exist "%CARGO_BIN%\cargo.exe" (
    echo [ERROR] Cargo not found at: %CARGO_BIN%
    echo Please install Rust:
    echo winget install Rustlang.Rustup
    echo.
    pause
    exit /b 1
)

:: 检查 VS Build Tools 是否存在
if not exist "%VCVARS_PATH%" (
    echo [ERROR] Visual Studio Build Tools not found
    echo Please run:
    echo winget install Microsoft.VisualStudio.2022.BuildTools --override "--wait --passive --add Microsoft.VisualStudio.Workload.VCTools --includeRecommended"
    echo.
    pause
    exit /b 1
)

:: 检查 src 目录是否存在
if not exist "%SRC_DIR%\package.json" (
    echo [ERROR] package.json not found in: %SRC_DIR%
    pause
    exit /b 1
)

:: 创建编译目标目录
if not exist "%CARGO_TARGET_DIR%" (
    echo [INFO] Creating build target directory: %CARGO_TARGET_DIR%
    mkdir "%CARGO_TARGET_DIR%"
)

echo [INFO] Project directory: %SRC_DIR%
echo [INFO] Build directory: %CARGO_TARGET_DIR%
echo [INFO] Target: x86_64-pc-windows-msvc (x64)
echo.

:: 初始化 ARM64 到 x64 的交叉编译环境
echo [INFO] Initializing ARM64 to x64 cross-compile environment...
echo.

call "%VCVARS_PATH%" arm64_amd64
if errorlevel 1 (
    echo [ERROR] Failed to initialize MSVC cross-compile environment
    pause
    exit /b 1
)

:: 添加 Cargo 到 PATH
set "PATH=%CARGO_BIN%;%PATH%"

echo.
echo [INFO] Starting Tauri dev server (x64 target)...
echo [TIP] Press Ctrl+C to stop
echo.

:: 使用 pushd 切换到 src 目录（支持网络驱动器）
pushd "%SRC_DIR%"
if errorlevel 1 (
    echo [ERROR] Failed to change directory to %SRC_DIR%
    pause
    exit /b 1
)

echo [INFO] Working directory: %CD%
echo.

:: 启动 x64 开发服务器
pnpm tauri dev --target x86_64-pc-windows-msvc

popd
pause
