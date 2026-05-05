#!/bin/bash

echo "========================================"
echo "SalaryGuessr - Demarrage (Production)"
echo "========================================"
echo ""

# Démarrer le backend
echo "[1/2] Demarrage du backend FastAPI..."
cd "$(dirname "$0")"
source venv/bin/activate
uvicorn backend.main:app --host 127.0.0.1 --port 8000 &
BACKEND_PID=$!

sleep 3

# Build et demarrer le frontend en production
echo "[2/2] Build et demarrage du frontend React..."
cd frontend
npm run build
npm run serve &
FRONTEND_PID=$!

echo ""
echo "========================================"
echo "SalaryGuessr est en cours de demarrage !"
echo "========================================"
echo ""
echo "Backend: http://localhost:8000"
echo "Frontend: http://localhost:3000"
echo ""
echo "Note: Frontend is running in production mode (minified/obfuscated)"
echo ""
echo "Appuyez sur Ctrl+C pour arreter les deux serveurs"

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT
wait