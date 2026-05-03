#!/bin/bash
echo "========================================"
echo "SalaryGuessr - Unified Testing Suite"
echo "========================================"
echo ""

echo "[1/2] Running Backend Tests (Pytest)..."
source venv/bin/activate
python3 -m pytest --cov=backend backend/tests/ --cov-report=html:backend/htmlcov
if [ $? -ne 0 ]; then
    echo ""
    echo "[ERROR] Backend tests failed!"
else
    echo "[SUCCESS] Backend tests passed."
fi
echo ""

echo "[2/2] Running Frontend Tests (Vitest)..."
cd frontend
npm run coverage
if [ $? -ne 0 ]; then
    echo ""
    echo "[ERROR] Frontend tests failed!"
else
    echo "[SUCCESS] Frontend tests passed."
fi
cd ..

echo ""
echo "========================================"
echo "Testing session finished."
echo "Backend Coverage: backend/htmlcov/index.html"
echo "Frontend Coverage: frontend/coverage/index.html"
echo "========================================"
echo ""
