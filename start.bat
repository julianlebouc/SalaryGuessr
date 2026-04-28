@echo off
echo ========================================
echo SalaryGuessr - Demarrage
echo ========================================
echo.

REM Démarrer le backend
echo [1/2] Demarrage du backend FastAPI...
start "SalaryGuessr Backend" cmd /k "cd /d %~dp0 && call venv\Scripts\activate.bat && uvicorn main:app --reload --host 127.0.0.1 --port 8000"

timeout /t 3 /nobreak > nul

REM Démarrer le frontend
echo [2/2] Demarrage du frontend React...
cd frontend
start "SalaryGuessr Frontend" cmd /k "npm start"

echo.
echo ========================================
echo SalaryGuessr est en cours de demarrage !
echo ========================================
echo.
echo Backend: http://localhost:8000
echo Frontend: http://localhost:3000
echo.
echo Les deux fenetres vont s'ouvrir automatiquement.
echo Ne fermez pas ces fenetres pendant que vous jouez.
echo.
pause