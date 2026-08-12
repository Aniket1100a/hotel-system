@echo off
TITLE Hotel System - Verification Tool
echo \u003d\u003d\u003d\u003d\u003d\u003d\u003d\u003d\u003d\u003d\u003d\u003d\u003d\u003d\u003d\u003d\u003d\u003d\u003d\u003d\u003d\u003d\u003d\u003d\u003d\u003d\u003d\u003d\u003d\u003d\u003d\u003d\u003d\u003d\u003d\u003d\u003d\u003d\u003d\u003d\u003d\u003d\u003d\u003d\u003d\u003d\u003d\u003d\u003d\u003d\u003d\u003d
echo   SYSTEM SETUP VERIFICATION (TEST ENVIRONMENT)
echo \u003d\u003d\u003d\u003d\u003d\u003d\u003d\u003d\u003d\u003d\u003d\u003d\u003d\u003d\u003d\u003d\u003d\u003d\u003d\u003d\u003d\u003d\u003d\u003d\u003d\u003d\u003d\u003d\u003d\u003d\u003d\u003d\u003d\u003d\u003d\u003d\u003d\u003d\u003d\u003d\u003d\u003d\u003d\u003d\u003d\u003d\u003d\u003d\u003d\u003d\u003d\u003d
echo.

:: 1. Create Test Database
echo [1/4] Preparing Clean Test Database...
if exist backend\\test_db.sqlite3 del backend\\test_db.sqlite3

:: 2. Setup Environment Variables
echo [2/4] Initializing Schema...
:: We temporarily move the real db to avoid accidental overwrites
if exist backend\\db.sqlite3 rename backend\\db.sqlite3 db_real.sqlite3.tmp

cmd /c \"cd backend \u0026\u0026 venv\\Scripts\\activate \u0026\u0026 python manage.py migrate \u0026\u0026 python seed.py\"

echo.
echo [3/4] Starting System Components...
echo (Check the new windows for errors)

start \"BACKEND TEST\" cmd /k \"cd backend \u0026\u0026 venv\\Scripts\\activate \u0026\u0026 python manage.py runserver 8000\"
start \"FRONTEND TEST\" cmd /k \"cd web-admin \u0026\u0026 npm run dev\"

echo.
echo [4/4] Verification Ready!
echo \u003d\u003d\u003d\u003d\u003d\u003d\u003d\u003d\u003d\u003d\u003d\u003d\u003d\u003d\u003d\u003d\u003d\u003d\u003d\u003d\u003d\u003d\u003d\u003d\u003d\u003d\u003d\u003d\u003d\u003d\u003d\u003d\u003d\u003d\u003d\u003d\u003d\u003d\u003d\u003d\u003d\u003d\u003d\u003d\u003d\u003d\u003d\u003d\u003d\u003d\u003d\u003d
echo   TEST PROTOCOL:
echo   1. Login as: owner1 / owner123
echo   2. Verify Menu is loaded (Menu Management)
echo   3. Create a test order and generate bill.
echo \u003d\u003d\u003d\u003d\u003d\u003d\u003d\u003d\u003d\u003d\u003d\u003d\u003d\u003d\u003d\u003d\u003d\u003d\u003d\u003d\u003d\u003d\u003d\u003d\u003d\u003d\u003d\u003d\u003d\u003d\u003d\u003d\u003d\u003d\u003d\u003d\u003d\u003d\u003d\u003d\u003d\u003d\u003d\u003d\u003d\u003d\u003d\u003d\u003d\u003d\u003d\u003d
echo.
echo Press any key AFTER your test to RESTORE your real database.
pause \u003e nul

:: Clean up and Restore
echo Restoring real database...
if exist backend\\db.sqlite3 del backend\\db.sqlite3
if exist backend\\db_real.sqlite3.tmp rename backend\\db_real.sqlite3.tmp db.sqlite3

echo Done. Verification Complete.
pause
