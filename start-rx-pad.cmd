@echo off
setlocal EnableExtensions

cd /d "%~dp0"

set "NODE_DIR=C:\Program Files\nodejs"
if exist "%NODE_DIR%\node.exe" (
  set "PATH=%NODE_DIR%;%PATH%"
)

where node >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Node.js was not found.
  echo Install Node.js LTS and re-run this script.
  exit /b 1
)

where npm.cmd >nul 2>nul
if errorlevel 1 (
  echo [ERROR] npm.cmd was not found on PATH.
  echo Ensure Node.js is installed correctly and re-run this script.
  exit /b 1
)

if not exist ".env" (
  if exist ".env.example" (
    copy /y ".env.example" ".env" >nul
    echo [INFO] Created .env from .env.example
  )
)

echo [STEP] Installing dependencies...
call npm.cmd install
if errorlevel 1 exit /b 1

echo [STEP] Generating Prisma client...
call npm.cmd run prisma:generate
if errorlevel 1 exit /b 1

echo [STEP] Applying database migrations...
call npx.cmd prisma migrate deploy
if errorlevel 1 exit /b 1

echo [STEP] Seeding 10 test patients...
call npm.cmd run seed:test
if errorlevel 1 exit /b 1

if exist ".\prisma\dev.db" (
  echo [STEP] Running automatic database backup...
  powershell -ExecutionPolicy Bypass -File ".\scripts\backup-db.ps1"
  if errorlevel 1 (
    echo [WARN] Backup failed. Continuing startup.
  )
) else (
  echo [INFO] No database file found yet. Skipping backup.
)

echo [STEP] Building application...
call npm.cmd run build
if errorlevel 1 exit /b 1

echo [STEP] Starting application at http://localhost:3000 ...
call npm.cmd run start
if errorlevel 1 exit /b 1

endlocal
