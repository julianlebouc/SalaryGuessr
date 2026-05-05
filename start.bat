@echo off
echo ========================================
echo SalaryGuessr - Demarrage (Production)
echo ========================================
echo.

REM Démarrer le backend
echo [1/2] Demarrage du backend FastAPI...
start "SalaryGuessr Backend" cmd /k "cd /d %~dp0 && venv\Scripts\activate && uvicorn backend.main:app --host 127.0.0.1 --port 8000"

timeout /t 3 /nobreak > nul

REM Build et demarrer le frontend en production
echo [2/2] Build et demarrage du frontend React...
cd frontend
call npm run build
start "SalaryGuessr Frontend" cmd /k "npm run serve"

echo.
echo ========================================
echo SalaryGuessr est en cours de demarrage !
echo ========================================
echo.
echo Backend: http://localhost:8000
echo Frontend: http://localhost:3000
echo.
echo Note: Frontend is running in production mode (minified/obfuscated)
echo.
pause