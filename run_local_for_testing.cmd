@echo off
setlocal

cd /d "%~dp0"

set "PORT=3000"
set "PORT_PID="

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js is not installed or is not on PATH.
  echo Install Node.js, then run this script again.
  exit /b 1
)

if not exist "node_modules" (
  echo Installing dependencies...
  call npm.cmd install
  if errorlevel 1 exit /b %errorlevel%
) else (
  echo Dependencies already installed.
)

for /f "tokens=5" %%P in ('netstat -ano ^| findstr /R /C:"127\.0\.0\.1:%PORT% .*LISTENING"') do (
  set "PORT_PID=%%P"
  goto :kill_port_process
)
goto :after_port_cleanup

:kill_port_process
if defined PORT_PID (
  echo Port %PORT% is in use by process ID %PORT_PID%.
  echo Stopping that process so Rx Pad can start on port %PORT%...
  taskkill /PID %PORT_PID% /F >nul 2>nul
  if errorlevel 1 (
    echo Could not stop process ID %PORT_PID%.
    echo Close that process manually and run this script again.
    exit /b 1
  )
  timeout /t 1 /nobreak >nul
)

:after_port_cleanup

echo Building the app for local Pages testing...
call npm.cmd run build
if errorlevel 1 exit /b %errorlevel%

echo Seeding the local D1 test database...
call npm.cmd run seed:local:test
if errorlevel 1 exit /b %errorlevel%

echo Starting Rx Pad locally at http://127.0.0.1:%PORT%
echo Press Ctrl+C in this window to stop the app.
call .\node_modules\.bin\wrangler.cmd pages dev out --ip 127.0.0.1 --port %PORT% --persist-to .wrangler\state
exit /b %errorlevel%
