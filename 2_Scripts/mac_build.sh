#!/bin/bash

echo ""
echo "================================================================"
echo "    Claude Code Permission Manager - macOS Build Script"
echo "    Support: ARM64 (Apple Silicon) & x64 (Intel)"
echo "================================================================"
echo ""

# 获取脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
SRC_DIR="$PROJECT_ROOT/src"

# 检查 src 目录
if [ ! -f "$SRC_DIR/package.json" ]; then
    echo "[ERROR] package.json not found in: $SRC_DIR"
    exit 1
fi

echo "[INFO] Project directory: $SRC_DIR"
echo ""

# 检查 pnpm
if ! command -v pnpm &> /dev/null; then
    echo "[ERROR] pnpm not found"
    echo "Please install: npm install -g pnpm"
    exit 1
fi

# 检查 Rust
if ! command -v cargo &> /dev/null; then
    echo "[ERROR] Rust/Cargo not found"
    echo "Please install: curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh"
    exit 1
fi

# 选择构建类型
echo "Select build type:"
echo "  1) ARM64 only (Apple Silicon)"
echo "  2) x64 only (Intel)"
echo "  3) Universal Binary (ARM64 + x64)"
echo ""
read -p "Enter your choice [1-3]: " choice

case $choice in
    1)
        BUILD_TYPE="arm64"
        TARGET="aarch64-apple-darwin"
        echo ""
        echo "[INFO] Building for ARM64 (Apple Silicon)..."
        ;;
    2)
        BUILD_TYPE="x64"
        TARGET="x86_64-apple-darwin"
        echo ""
        echo "[INFO] Building for x64 (Intel)..."
        ;;
    3)
        BUILD_TYPE="universal"
        echo ""
        echo "[INFO] Building Universal Binary (ARM64 + x64)..."
        ;;
    *)
        echo "[ERROR] Invalid choice"
        exit 1
        ;;
esac

echo ""

# 切换到 src 目录
cd "$SRC_DIR" || exit 1
echo "[INFO] Working directory: $(pwd)"
echo ""

# 安装 Rust 目标架构
if [ "$BUILD_TYPE" = "arm64" ]; then
    echo "[INFO] Adding ARM64 target..."
    rustup target add aarch64-apple-darwin
    echo ""
elif [ "$BUILD_TYPE" = "x64" ]; then
    echo "[INFO] Adding x64 target..."
    rustup target add x86_64-apple-darwin
    echo ""
elif [ "$BUILD_TYPE" = "universal" ]; then
    echo "[INFO] Adding both ARM64 and x64 targets..."
    rustup target add aarch64-apple-darwin
    rustup target add x86_64-apple-darwin
    echo ""
fi

# 开始构建
echo "[INFO] Starting build process..."
echo "[INFO] This may take several minutes..."
echo ""

if [ "$BUILD_TYPE" = "universal" ]; then
    # 构建通用二进制
    pnpm tauri build --target universal-apple-darwin
else
    # 构建单一架构
    pnpm tauri build --target "$TARGET"
fi

if [ $? -ne 0 ]; then
    echo ""
    echo "[ERROR] Build failed!"
    exit 1
fi

echo ""
echo "================================================================"
echo "    Build completed successfully!"
echo "================================================================"
echo ""

# 显示输出位置
if [ "$BUILD_TYPE" = "universal" ]; then
    OUTPUT_DIR="$SRC_DIR/src-tauri/target/universal-apple-darwin/release/bundle"
    echo "Output location:"
    echo "  $OUTPUT_DIR"
    echo ""
    echo "Files:"
    ls -lh "$OUTPUT_DIR/dmg/" 2>/dev/null || ls -lh "$OUTPUT_DIR/macos/" 2>/dev/null || echo "  Bundle created"
elif [ "$BUILD_TYPE" = "arm64" ]; then
    OUTPUT_DIR="$SRC_DIR/src-tauri/target/aarch64-apple-darwin/release/bundle"
    echo "Output location (ARM64):"
    echo "  $OUTPUT_DIR"
    echo ""
    echo "Files:"
    ls -lh "$OUTPUT_DIR/dmg/" 2>/dev/null || ls -lh "$OUTPUT_DIR/macos/" 2>/dev/null || echo "  Bundle created"
else
    OUTPUT_DIR="$SRC_DIR/src-tauri/target/x86_64-apple-darwin/release/bundle"
    echo "Output location (x64):"
    echo "  $OUTPUT_DIR"
    echo ""
    echo "Files:"
    ls -lh "$OUTPUT_DIR/dmg/" 2>/dev/null || ls -lh "$OUTPUT_DIR/macos/" 2>/dev/null || echo "  Bundle created"
fi

echo ""