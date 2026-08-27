@echo off
setlocal
cd /d "%~dp0"

set "CODEX_NODE=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin"
set "CODEX_PNPM=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\bin\fallback\pnpm.cmd"

if exist "%CODEX_NODE%\node.exe" if exist "%CODEX_PNPM%" (
  set "PATH=%CODEX_NODE%;%PATH%"
  set "PNPM_RUNNER=%CODEX_PNPM%"
) else (
  where pnpm >nul 2>nul
  if errorlevel 1 goto :missing_runtime
  set "PNPM_RUNNER=pnpm"
)

if not exist "node_modules" call "%PNPM_RUNNER%" install
if errorlevel 1 goto :failed

start "" /min powershell -NoProfile -WindowStyle Hidden -Command "Start-Sleep -Seconds 3; Start-Process 'http://localhost:3000'"
call "%PNPM_RUNNER%" dev
goto :eof

:missing_runtime
echo.
echo Khong tim thay Node.js / pnpm de chay ung dung.
echo Vui long cai Node.js LTS, sau do chay lai file nay.
pause
goto :eof

:failed
echo.
echo Khong the khoi dong ung dung. Vui long chup man hinh loi nay de duoc ho tro.
pause
