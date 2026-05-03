"""
Main entry point for the SalaryGuessr API.
Configures FastAPI, Socket.IO, and initializes the offer pool.
"""

import sys
import os
import threading

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import socketio

from .config import ENVIRONMENT, DEBUG, BACKEND_PORT, CORS_ORIGINS, POOL_TARGET_SIZE
from .services.offer_pool import get_random_job, get_pool_size, build_offer_pool
from .services.salary_parser import parse_salary
from .utils.memory import get_played_count, clear_played
from .services.offer_pool import OFFER_POOL, refill_in_progress

# Import multiplayer system
from .multiplayer import get_room_manager, BattleRoyaleGame
from .multiplayer.socket_handlers import SocketHandlers

# ==========================================================
# INITIALIZATION
# ==========================================================

# Register game modes
room_manager = get_room_manager()
room_manager.register_game(BattleRoyaleGame())

# ==========================================================
# FASTAPI APP
# ==========================================================
app = FastAPI(
    title="SalaryGuessr API",
    description="Backend API for SalaryGuessr providing job offers and multiplayer features."
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

print(f"[CORS] Allowed origins: {CORS_ORIGINS}")
print(f"[CONFIG] Environment: {ENVIRONMENT}")

# ==========================================================
# SOCKET.IO
# ==========================================================
sio = socketio.AsyncServer(cors_allowed_origins='*', async_mode='asgi')
sio_app = socketio.ASGIApp(sio)
app.mount("/socket.io/", sio_app)

# Initialize Socket.IO handlers
socket_handlers = SocketHandlers(sio)

# ==========================================================
# REST ROUTES
# ==========================================================

@app.get("/")
def root():
    """
    Root endpoint to check API status.
    
    Returns:
        dict: Status message and current environment.
    """
    return {"message": "SalaryGuessr API running", "environment": ENVIRONMENT}

@app.get("/job")
def job():
    """
    Fetch a random job offer from the pool and parse its salary.
    
    Returns:
        dict: Job offer details with parsed real salary and pool statistics.
    
    Raises:
        HTTPException: If an error occurs during fetching or parsing.
    """
    try:
        job = get_random_job()
        salaire = job.get("salaire", {})
        salary_text = salaire.get("libelle", "") or salaire.get("commentaire", "")
        salary_value = parse_salary(salary_text)
        
        result = dict(job)
        result["description"] = job.get("description", "")
        result["salary_text"] = salary_text
        result["salary_real"] = salary_value
        result["already_played_pool_size"] = get_played_count()
        result["pool_remaining"] = get_pool_size()
        return result
    except Exception as e:
        print(f"[ERROR] {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/stats")
def stats():
    """
    Retrieve statistics about the offer pool and played jobs.
    
    Returns:
        dict: Played count, current pool size, and environment.
    """
    return {
        "played_count": get_played_count(),
        "pool_size": get_pool_size(),
        "environment": ENVIRONMENT
    }

@app.post("/reset")
def reset():
    """
    Reset the game state, clear the pool, and rebuild it.
    
    Returns:
        dict: Success message.
    """
    with threading.Lock():
        clear_played()
        OFFER_POOL.clear()
        refill_in_progress = False
    build_offer_pool(POOL_TARGET_SIZE)
    return {"message": "Full reset complete"}

# ==========================================================
# STARTUP LOGIC
# ==========================================================

@app.on_event("startup")
async def startup_event():
    """
    Execute startup tasks: build the initial offer pool.
    """
    print("SalaryGuessr API Starting...")
    print("Rate limiting: 9 req/sec")
    build_offer_pool(POOL_TARGET_SIZE)
    print("Server ready")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=BACKEND_PORT)