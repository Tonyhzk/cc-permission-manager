#!/bin/bash

# macOS 系统提示音测试脚本
# 播放所有系统提示音，每个间隔 1 秒

sounds=(
    "Basso"
    "Blow"
    "Bottle"
    "Frog"
    "Funk"
    "Glass"
    "Hero"
    "Morse"
    "Ping"
    "Pop"
    "Purr"
    "Sosumi"
    "Submarine"
    "Tink"
)

echo "开始播放 macOS 系统提示音..."
echo ""

for sound in "${sounds[@]}"; do
    echo "▶ 正在播放: $sound"
    afplay "/System/Library/Sounds/${sound}.aiff"
    sleep 1
done

echo ""
echo "播放完成！"