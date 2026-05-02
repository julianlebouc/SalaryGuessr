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
pip install fastapi "uvicorn[standard]" requests beautifulsoup4 python-dotenv python-socketio==5.9.0 python-engineio==4.7.0 websockets wsproto

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
call npm install
call npm install framer-motion recharts socket.io-client@4.5.4

echo.
echo Frontend installe avec succes !
cd ..

echo.
echo ========================================
echo Installation terminee !
echo ========================================
echo.
echo Pour demarrer le jeu, lancez start.bat
echo.
pause