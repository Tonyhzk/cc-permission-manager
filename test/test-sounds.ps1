# Windows 系统提示音测试脚本
# 播放所有可用的系统声音，每个间隔 1 秒

# ============================================
# 第一部分：.NET SystemSounds 内置声音
# ============================================
$systemSounds = @(
    "Asterisk",
    "Beep",
    "Exclamation",
    "Hand",
    "Question"
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "第一部分：.NET SystemSounds 内置声音" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

foreach ($sound in $systemSounds) {
    Write-Host "▶ 正在播放: $sound" -ForegroundColor Green
    [System.Media.SystemSounds]::$sound.Play()
    Start-Sleep -Seconds 1
}

# ============================================
# 第二部分：Windows 11 Media 文件夹声音
# ============================================
$soundPath = "C:\Windows\Media"

# Windows 11 系统声音文件映射
$win11Sounds = [ordered]@{
    # 核心系统声音
    "登录音 (Logon)"              = "Windows Logon.wav"
    "注销音 (Logoff)"             = "Windows Logoff Sound.wav"
    "解锁音 (Unlock)"             = "Windows Unlock.wav"
    "背景音 (Background)"         = "Windows Background.wav"
    "前台音 (Foreground)"         = "Windows Foreground.wav"

    # 通知类声音
    "系统通知 (Notify Generic)"   = "Windows Notify System Generic.wav"
    "邮件通知 (Email)"            = "Windows Notify Email.wav"
    "日历通知 (Calendar)"         = "Windows Notify Calendar.wav"
    "消息通知 (Messaging)"        = "Windows Notify Messaging.wav"
    "气泡通知 (Balloon)"          = "Windows Balloon.wav"

    # 系统事件声音
    "严重错误 (Critical Stop)"    = "Windows Critical Stop.wav"
    "错误 (Error)"                = "Windows Error.wav"
    "警告 (Exclamation)"          = "Windows Exclamation.wav"
    "默认声音 (Default)"          = "Windows Default.wav"
    "叮声 (Ding)"                 = "Windows Ding.wav"
    "UAC 提示音"                  = "Windows User Account Control.wav"

    # 硬件相关
    "硬件插入 (Hardware Insert)"  = "Windows Hardware Insert.wav"
    "硬件移除 (Hardware Remove)"  = "Windows Hardware Remove.wav"
    "硬件故障 (Hardware Fail)"    = "Windows Hardware Fail.wav"

    # 窗口操作
    "最小化 (Minimize)"           = "Windows Minimize.wav"
    "还原 (Restore)"              = "Windows Restore.wav"
    "打印完成 (Print Complete)"   = "Windows Print complete.wav"

    # 经典声音
    "Tada (完成音)"               = "tada.wav"
    "Chimes (铃声)"               = "chimes.wav"
    "Chord (和弦)"                = "chord.wav"
    "Ding (叮)"                   = "ding.wav"
    "Notify (通知)"               = "notify.wav"
    "Recycle (回收站)"            = "recycle.wav"
    "Ringout (铃声)"              = "ringout.wav"

    # 闹钟声音 (选几个代表)
    "闹钟 01"                     = "Alarm01.wav"
    "闹钟 05"                     = "Alarm05.wav"
    "闹钟 10"                     = "Alarm10.wav"

    # 铃声 (选几个代表)
    "铃声 01"                     = "Ring01.wav"
    "铃声 05"                     = "Ring05.wav"
    "铃声 10"                     = "Ring10.wav"
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "第二部分：Windows 11 Media 声音文件" -ForegroundColor Cyan
Write-Host "路径: $soundPath" -ForegroundColor Gray
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 创建 SoundPlayer 对象
Add-Type -AssemblyName PresentationCore

foreach ($item in $win11Sounds.GetEnumerator()) {
    $displayName = $item.Key
    $fileName = $item.Value
    $filePath = Join-Path $soundPath $fileName

    if (Test-Path $filePath) {
        Write-Host "▶ 正在播放: $displayName" -ForegroundColor Green
        Write-Host "  文件: $fileName" -ForegroundColor DarkGray

        try {
            $player = New-Object System.Media.SoundPlayer $filePath
            $player.PlaySync()
        }
        catch {
            Write-Host "  播放失败: $_" -ForegroundColor Red
        }

        Start-Sleep -Milliseconds 500
    }
    else {
        Write-Host "✗ 文件不存在: $displayName" -ForegroundColor Yellow
        Write-Host "  路径: $filePath" -ForegroundColor DarkGray
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "播放完成！" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan