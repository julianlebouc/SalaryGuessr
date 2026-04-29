# SalaryGuessr 💰

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![React](https://img.shields.io/badge/React-18.2.0-61dafb)](https://reactjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.109.0-009688)](https://fastapi.tiangolo.com/)

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
