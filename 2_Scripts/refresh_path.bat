@echo off
:: Refresh PATH environment variable in current session
:: Run this if you just installed Node.js/npm/pnpm

echo Refreshing PATH environment variable...
echo.

for /f "tokens=2*" %%a in ('reg query "HKLM\SYSTEM\CurrentControlSet\Control\Session Manager\Environment" /v Path 2^>nul') do set "SYS_PATH=%%b"
for /f "tokens=2*" %%a in ('reg query "HKCU\Environment" /v Path 2^>nul') do set "USER_PATH=%%b"
set "PATH=%SYS_PATH%;%USER_PATH%"

echo PATH refreshed successfully!
echo.
echo Testing installed tools:
echo.

where node >nul 2>&1 && (
    node --version
    echo Node.js: OK
) || (
    echo Node.js: NOT FOUND
)

where npm >nul 2>&1 && (
    npm --version
    echo npm: OK
) || (
    echo npm: NOT FOUND
)

where pnpm >nul 2>&1 && (
    pnpm --version
    echo pnpm: OK
) || (
    echo pnpm: NOT FOUND
)

echo.
echo You can now use node/npm/pnpm in this window!
pause
