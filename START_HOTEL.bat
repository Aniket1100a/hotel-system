@echo off
TITLE Hotel Management System Launcher

echo ====================================================
echo   HOTEL CHATURTHI - SYSTEM LAUNCHER
echo ====================================================
echo.

:: Kill any existing processes on these ports to prevent "Address already in use"
echo Cleaning up existing processes...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8000') do taskkill /f /pid %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000') do taskkill /f /pid %%a >nul 2>&1

:: Start Django Backend
echo [1/2] Starting Backend Server...
start "BACKEND" /min cmd /k "cd backend && venv\Scripts\activate && python manage.py runserver 0.0.0.0:8000"

:: Sync Bills to Local Container
echo Archiving recent bills to BILL_STORAGE...
cmd /c "cd backend && venv\Scripts\activate && python export_receipts.py"

:: Start React Frontend
echo [2/2] Starting Admin Panel...
start "FRONTEND" /min cmd /k "cd web-admin && npm run dev"

:: Wait for servers to wake up
echo Launching website in 8 seconds...
timeout /t 8 >nul

:: Automatically open the website
echo Opening Hotel System...
start http://localhost:3000

echo.
echo ====================================================
echo   SUCCESS: Website is opening!
echo   If you see "Refused to Connect", please wait 5
echo   seconds and Refresh the page.
echo ====================================================
echo.
pause
