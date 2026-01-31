@echo off
chcp 65001 >nul

echo.
echo ================================================================
echo     Claude Code Permission Manager - Build ARM64 Release
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
echo [INFO] Target: aarch64-pc-windows-msvc (ARM64)
echo.

:: 初始化 ARM64 编译环境
echo [INFO] Initializing ARM64 build environment...
echo.

call "%VCVARS_PATH%" arm64
if errorlevel 1 (
    echo [ERROR] Failed to initialize MSVC environment
    pause
    exit /b 1
)

:: 添加 Cargo 到 PATH
set "PATH=%CARGO_BIN%;%PATH%"

echo.
echo [INFO] Building ARM64 release...
echo [INFO] This may take a few minutes...
echo.

:: 切换到 src 目录
pushd "%SRC_DIR%"
if errorlevel 1 (
    echo [ERROR] Failed to change directory to %SRC_DIR%
    pause
    exit /b 1
)

echo [INFO] Working directory: %CD%
echo.

:: 构建 ARM64 版本
pnpm tauri build

if errorlevel 1 (
    echo.
    echo [ERROR] Build failed!
    popd
    pause
    exit /b 1
)

echo.
echo ================================================================
echo     Build completed successfully!
echo ================================================================
echo.
echo Output location:
echo   %CARGO_TARGET_DIR%\release\bundle\
echo.

popd
pause
