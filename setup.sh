#!/bin/bash

echo "========================================"
echo "SalaryGuessr - Installation Complete"
echo "========================================"
echo ""

# ========================================
# BACKEND INSTALLATION
# ========================================
echo "[1/2] Installation du Backend Python..."
echo ""

# Création de l'environnement virtuel
if [ -d "venv" ]; then
    echo "Suppression de l'ancien environnement..."
    rm -rf venv
fi

echo "Creation de l'environnement virtuel..."
python3 -m venv venv

# Activation et installation
echo "Installation des packages Python..."
source venv/bin/activate
pip install --upgrade pip
pip install fastapi uvicorn requests beautifulsoup4 python-dotenv

echo ""
echo "Backend installe avec succes !"
echo ""

# ========================================
# FRONTEND INSTALLATION
# ========================================
echo "[2/2] Installation du Frontend React..."
echo ""

if [ -d "frontend/node_modules" ]; then
    echo "Suppression des anciens modules..."
    rm -rf frontend/node_modules
fi

cd frontend
echo "Installation des packages Node..."
npm install
npm install framer-motion recharts

echo ""
echo "Frontend installe avec succes !"
cd ..

echo ""
echo "========================================"
echo "Installation terminee !"
echo "========================================"
echo ""
echo "Pour demarrer le jeu, lancez ./start.sh"
echo ""