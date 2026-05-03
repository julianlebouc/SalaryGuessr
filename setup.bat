@echo off
title SalaryGuessr - Setup

echo ========================================
echo SalaryGuessr - Installation Complete
echo ========================================
echo.

REM ========================================
REM BACKEND INSTALLATION
REM ========================================
echo [1/2] Installation du Backend Python...
echo.

REM Création de l'environnement virtuel
if exist "venv" (
    echo Suppression de l'ancien environnement...
    rmdir /s /q venv
)

echo Creation de l'environnement virtuel...
python -m venv venv

REM Activation et installation
echo Installation des packages Python...
call venv\Scripts\activate.bat
pip install --upgrade pip
pip install fastapi "uvicorn[standard]" requests beautifulsoup4 python-dotenv python-socketio==5.9.0 python-engineio==4.7.0 websockets wsproto sphinx sphinx-rtd-theme pytest pytest-asyncio httpx pytest-cov

echo.
echo Backend installe avec succes !
echo.

REM ========================================
REM FRONTEND INSTALLATION
REM ========================================
echo [2/2] Installation du Frontend React...
echo.

if exist "frontend\node_modules" (
    echo Suppression des anciens modules...
    rmdir /s /q frontend\node_modules
)

cd frontend
echo Installation des packages Node...
call npm install --legacy-peer-deps

echo.
echo Frontend installe avec succes !
cd ..

echo.
echo ========================================
echo Installation terminee !
echo ========================================
echo.

REM ========================================
REM DOCUMENTATION GENERATION
REM ========================================
echo [EXTRA] Generation de la documentation...
echo.

REM Backend Docs
echo Generation de la documentation Backend (Sphinx)...
if not exist "backend\docs\_static" mkdir backend\docs\_static
copy frontend\public\logo512.svg backend\docs\_static\logo512.svg >nul
call venv\Scripts\activate.bat
cd backend
..\venv\Scripts\sphinx-build -b html docs docs/_build
cd ..

REM Frontend Docs
echo Generation de la documentation Frontend (JSDoc)...
cd frontend
call npm run docs
cd ..

echo.
echo Documentation generee avec succes !
echo - Backend: backend\docs\_build\index.html
echo - Frontend: frontend\docs\jsdoc\index.html
echo.
echo ========================================
echo Tout est pret !
echo ========================================
echo.
echo Pour demarrer le jeu, lancez start.bat
echo.
pause