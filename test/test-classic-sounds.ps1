# Windows 经典声音测试脚本
# 只播放经典的 Windows 声音文件

$soundPath = "C:\Windows\Media"

# 经典声音列表
$classicSounds = [ordered]@{
    "Tada (完成音)"     = "tada.wav"
    "Chimes (铃声)"     = "chimes.wav"
    "Chord (和弦)"      = "chord.wav"
    "Ding (叮)"         = "ding.wav"
    "Notify (通知)"     = "notify.wav"
    "Recycle (回收站)"  = "recycle.wav"
    "Ringout (铃声)"    = "ringout.wav"
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Windows 经典声音测试" -ForegroundColor Cyan
Write-Host "路径: $soundPath" -ForegroundColor Gray
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

foreach ($item in $classicSounds.GetEnumerator()) {
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

        Start-Sleep -Milliseconds 800
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