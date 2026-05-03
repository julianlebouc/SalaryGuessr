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
pip install fastapi "uvicorn[standard]" requests beautifulsoup4 python-dotenv python-socketio==5.9.0 python-engineio==4.7.0 websockets wsproto sphinx sphinx-rtd-theme

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
npm install --legacy-peer-deps

echo ""
echo "Frontend installe avec succes !"
cd ..

echo ""
echo "========================================"
echo "Installation terminee !"
echo "========================================"
echo ""

# ========================================
# DOCUMENTATION GENERATION
# ========================================
echo "[EXTRA] Generation de la documentation..."
echo ""

# Backend Docs
echo "Generation de la documentation Backend (Sphinx)..."
mkdir -p backend/docs/_static
cp frontend/public/logo512.svg backend/docs/_static/logo512.svg
source venv/bin/activate
cd backend
../venv/bin/sphinx-build -b html docs docs/_build
cd ..

# Frontend Docs
echo "Generation de la documentation Frontend (JSDoc)..."
cd frontend
npm run docs
cd ..

echo ""
echo "Documentation generee avec succes !"
echo "- Backend: backend/docs/_build/index.html"
echo "- Frontend: frontend/docs/jsdoc/index.html"
echo ""
echo "========================================"
echo "Tout est pret !"
echo "========================================"
echo ""
echo "Pour demarrer le jeu, lancez ./start.sh"
echo ""