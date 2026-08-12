@echo off
TITLE Hotel Management System Launcher

echo ====================================================
echo   HOTEL CHATURTHI - SYSTEM LAUNCHER (Robust)
echo ====================================================
echo.

:: 1. Clean up old processes
echo [Step 1] Cleaning up old server processes...
powershell -Command "Stop-Process -Id (Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue).OwningProcess -Force -ErrorAction SilentlyContinue"
powershell -Command "Stop-Process -Id (Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue).OwningProcess -Force -ErrorAction SilentlyContinue"

:: 2. Sync digital receipts to local container
echo [Step 2] Archiving latest bills to BILL_STORAGE...
cmd /c "cd backend && venv\Scripts\activate && python export_receipts.py"

:: 3. Start Backend
echo [Step 3] Starting Backend (Django)...
start "BACKEND - Django" cmd /k "cd backend && venv\Scripts\activate && python manage.py runserver 0.0.0.0:8000"

:: 4. Start Frontend
echo [Step 4] Starting Admin Panel (Vite)...
:: We use 'call' to ensure npm runs correctly in this environment
start "FRONTEND - Web Admin" cmd /k "cd web-admin && npm run dev"

echo.
echo Launching browser in 12 seconds...
echo (Please do not close the black windows that opened)
echo.

timeout /t 12 >nul

:: Automatically open the website using IP to avoid localhost resolution issues
echo Opening Hotel System...
start http://127.0.0.1:3000

echo.
echo ====================================================
echo   SUCCESS: Launch Sequence Complete!
echo   - If you see an error in the browser, wait 5
echo     seconds and press F5 to Refresh.
echo   - If the black windows show errors, please check
echo     your internet or dependencies.
echo ====================================================
echo.
pause
