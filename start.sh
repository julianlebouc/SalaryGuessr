#!/bin/bash

echo "========================================"
echo "SalaryGuessr - Demarrage"
echo "========================================"
echo ""

# Démarrer le backend
echo "[1/2] Demarrage du backend FastAPI..."
cd "$(dirname "$0")"
source venv/bin/activate
uvicorn main:app --reload --host 127.0.0.1 --port 8000 &
BACKEND_PID=$!

sleep 3

# Démarrer le frontend
echo "[2/2] Demarrage du frontend React..."
cd frontend
npm start &
FRONTEND_PID=$!

echo ""
echo "========================================"
echo "SalaryGuessr est en cours de demarrage !"
echo "========================================"
echo ""
echo "Backend: http://localhost:8000"
echo "Frontend: http://localhost:3000"
echo ""
echo "Appuyez sur Ctrl+C pour arreter les deux serveurs"
echo ""

# Attendre l'interruption utilisateur
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT

# Garder le script actif
wait