@echo off
chcp 65001 >nul
echo ========================================
echo Python 环境变量临时删除测试
echo ========================================
echo.

REM 备份当前 PATH
set "ORIGINAL_PATH=%PATH%"
echo [1/3] 已备份原始 PATH 环境变量
echo.

REM 从 PATH 中移除所有 Python 相关路径
echo [2/3] 正在从 PATH 中移除 Python...
set "NEW_PATH=%PATH%"
set "NEW_PATH=%NEW_PATH:C:\Program Files\Python311;=%"
set "NEW_PATH=%NEW_PATH:C:\Users\jjp\AppData\Roaming\Python\Python311;=%"
set "NEW_PATH=%NEW_PATH:C:\Users\jjp\AppData\Roaming\Python\Python311\Scripts;=%"
set "PATH=%NEW_PATH%"
echo    已移除 Python 相关路径
echo.

REM 验证 Python 是否已从 PATH 中移除
echo [3/3] 验证 Python 是否可用...
python --version >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo    ⚠ 警告: Python 仍然可用！
    python --version
) else (
    echo    ✓ Python 已成功从 PATH 中移除
)
echo.

echo ========================================
echo Python 已从当前会话的 PATH 中移除
echo ========================================
echo.
echo 现在可以在另一个终端窗口中测试 Python 检测功能：
echo   1. 打开新的 PowerShell 或 CMD 窗口
echo   2. 运行: python --version
echo   3. 应该会看到 "找不到命令" 的错误
echo.
echo 或者在应用中测试：
echo   - 启动应用并尝试安装 Global Hook
echo   - 应该会触发 Python 检测和安装提示
echo.
echo 按任意键恢复 Python 环境变量...
pause >nul

REM 恢复原始 PATH
set "PATH=%ORIGINAL_PATH%"
echo.
echo ========================================
echo ✓ PATH 已恢复，Python 环境变量已还原
echo ========================================
python --version 2>nul
echo.
echo 测试完成！
pause
