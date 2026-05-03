# SalaryGuessr 💰

[![License](https://img.shields.io/badge/license-GPLv3-blue.svg)](LICENSE)
[![React](https://img.shields.io/badge/React-19.2.5-61dafb?logo=react)](https://reactjs.org/)
[![Uvicorn](https://img.shields.io/badge/Uvicorn-0.46.0-00BFFF?logo=uvicorn)](https://www.uvicorn.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.136.1-009688?logo=fastapi)](https://fastapi.tiangolo.com/)
[![Socket.io](https://img.shields.io/badge/Socket.io-4.8.1-black?logo=socket.io)](https://socket.io/)
[![Recharts](https://img.shields.io/badge/Recharts-3.8.1-22b5bf)](https://recharts.org/)
[![Vitest](https://img.shields.io/badge/Vitest-4.1.5-6E9F18?logo=vitest)](https://vitest.dev/)
[![Pytest](https://img.shields.io/badge/Pytest-9.0.3-0A9EDC?logo=pytest)](https://docs.pytest.org/)
[![JSDoc](https://img.shields.io/badge/JSDoc-4.0.4-8DC63F?logo=jsdoc)](https://jsdoc.app/)
[![Sphinx](https://img.shields.io/badge/Sphinx-9.1.0-00123d?logo=sphinx)](https://www.sphinx-doc.org/)

SalaryGuessr is an interactive web game where you test your knowledge of salaries in the French job market. You'll be presented with real job offers from France Travail (formerly Pôle Emploi), and your mission is to estimate the monthly salary as accurately as possible. The closer you are, the more points you earn!

## 🎮 Game Modes

### Classic Mode
- Guess the exact salary of a single job offer
- Score up to 100 points per round based on precision
- Customizable number of rounds (5 to 50)

### High/Low Mode
- Compare two job offers side by side
- Guess which offer has the higher salary
- Endless chain of comparisons

### Battle Royale Mode
- Multiplayer game with 5 to 50 players
- All players guess the salary of the same job offer at the same time
- Every round, the player with the worst guess is eliminated
- The game ends when there is only one player left

## 📋 Prerequisites

- Node.js (v18 or higher)
- Python (v3.8 or higher)
- npm or yarn

## 🛠️ Installation

### 1. Clone the repository

```bash
git clone https://github.com/julianlebouc/SalaryGuessr.git
cd SalaryGuessr
```

### 2. Create a France Travail API Application

Go to https://www.francetravail.fr/partenaires  
Create an account → Create an app → Get CLIENT_ID and CLIENT_SECRET

### 3. Create `.env` in SalaryGuessr/

```
FRANCE_TRAVAIL_CLIENT_ID=your_id
FRANCE_TRAVAIL_CLIENT_SECRET=your_secret

BACKEND_URL=http://localhost:8000
FRONTEND_URL=http://localhost:3000

BACKEND_PORT=8000
FRONTEND_PORT=3000

CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000

ENVIRONMENT=development
DEBUG=True
```


### 4. Create `.env` in SalaryGuessr/frontend

```
REACT_APP_API_URL=http://localhost:8000
```

### 5. Install dependencies

- On Windows : Run setup.bat
- On Linux : Run setup.sh


## 🚀 Launch

- On Windows : Run start.bat
- On Linux : Run start.sh

Open http://localhost:3000

## 📚 Documentation

To generate the frontend JSDoc documentation, run:

```bash
cd frontend
npm run docs
```

The documentation will be generated in `frontend/docs/jsdoc/index.html`.

To generate the Python backend documentation, run:

```bash
cd backend
# Activate venv first (source venv/bin/activate or .\venv\Scripts\activate)
sphinx-build -b html docs docs/_build
```

The documentation will be generated in `backend/docs/_build/index.html`.

## 🧪 Testing & Coverage

A comprehensive testing suite for both the frontend and backend.

### Unified Testing
You can run all tests for the entire project with a single command:
- **Windows**: `test.bat`
- **Linux**: `./test.sh`

### Manual Execution

#### Backend (Pytest)
To run all backend tests manually:
```bash
# Activate venv first
python -m pytest backend/tests/
```

To generate a coverage report:
```bash
python -m pytest --cov=backend backend/tests/ --cov-report=html:backend/htmlcov
```
The report will be available in `backend/htmlcov/index.html`.

#### Frontend (Vitest)
To run all frontend tests manually:
```bash
cd frontend
npm test
```

To generate a coverage report:
```bash
cd frontend
npm run coverage
```
The report will be available in `frontend/coverage/index.html`.

