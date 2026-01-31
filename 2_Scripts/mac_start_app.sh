#!/bin/bash

# Claude Code 权限管理器启动脚本
# 此脚本用于启动 Claude Code 权限管理器应用程序

# 输出颜色代码
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # 无颜色

echo -e "${GREEN}=== Claude Code 权限管理器启动 ===${NC}"

# 获取脚本目录和项目根目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
SRC_DIR="$PROJECT_ROOT/src"

# 检查 src 目录是否存在
if [ ! -d "$SRC_DIR" ]; then
    echo -e "${RED}错误：未找到 src 目录 $SRC_DIR${NC}"
    exit 1
fi

# 切换到 src 目录
cd "$SRC_DIR" || exit 1
echo -e "${YELLOW}工作目录：$SRC_DIR${NC}"

# 检查 pnpm 是否已安装
if ! command -v pnpm &> /dev/null; then
    echo -e "${RED}错误：pnpm 未安装${NC}"
    echo "请先安装 pnpm：npm install -g pnpm"
    exit 1
fi

# 检查 node_modules 是否存在
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}未找到 node_modules，正在安装依赖...${NC}"
    pnpm install
    if [ $? -ne 0 ]; then
        echo -e "${RED}错误：依赖安装失败${NC}"
        exit 1
    fi
fi

# 启动应用程序
echo -e "${GREEN}正在启动 Claude Code 权限管理器...${NC}"
echo -e "${YELLOW}按 Ctrl+C 停止应用程序${NC}"
echo ""

pnpm tauri dev