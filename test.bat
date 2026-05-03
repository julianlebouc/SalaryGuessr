@echo off
title SalaryGuessr - All Tests
echo ========================================
echo SalaryGuessr - Unified Testing Suite
echo ========================================
echo.

echo [1/2] Running Backend Tests (Pytest)...
call venv\Scripts\activate.bat
python -m pytest --cov=backend backend/tests/ --cov-report=html:backend/htmlcov
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Backend tests failed!
) else (
    echo [SUCCESS] Backend tests passed.
)
echo.

echo [2/2] Running Frontend Tests (Vitest)...
cd frontend
call npm run coverage
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Frontend tests failed!
) else (
    echo [SUCCESS] Frontend tests passed.
)
cd ..

echo.
echo ========================================
echo Testing session finished.
echo Backend Coverage: backend/htmlcov/index.html
echo Frontend Coverage: frontend/coverage/index.html
echo ========================================
echo.
pause
