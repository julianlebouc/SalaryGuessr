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
from .services.offer_pool import get_random_job, get_pool_size, build_offer_pool, get_job_salary_data, get_job_salary
from .services.salary_parser import parse_salary
from .utils.memory import get_played_count, clear_played
from .services.offer_pool import OFFER_POOL, refill_in_progress, get_normalized_job, strip_sensitive_info
from .utils.logger import logger, access_logger, frontend_logger
from .utils.stats_parser import get_global_stats
import time

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

@app.middleware("http")
async def log_requests(request, call_next):
    """Log every incoming request to access.log."""
    start_time = time.time()
    response = await call_next(request)
    process_time = (time.time() - start_time) * 1000
    
    # Don't log heartbeat/stats if you want even cleaner logs
    # if request.url.path in ["/stats", "/"]: return response

    log_data = {
        "extra_data": {
            "method": request.method,
            "path": request.url.path,
            "status": response.status_code,
            "ip": request.client.host,
            "duration_ms": round(process_time, 2),
            "user_agent": request.headers.get("user-agent"),
        }
    }
    access_logger.info(f"{request.method} {request.url.path} - {response.status_code}", extra=log_data)
    return response

logger.info(f"Allowed origins: {CORS_ORIGINS}")
logger.info(f"Environment: {ENVIRONMENT}")

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
    Fetch a random job offer without the real salary (Anti-Cheat).
    """
    try:
        # include_salary=False ensures salary_real is NOT sent to the browser
        return get_normalized_job(include_salary=False)
    except Exception as e:
        logger.error(f"Error fetching job: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal Server Error")

@app.post("/validate")
def validate(data: dict):
    """
    Validate a user's guess (numeric or comparison) against server-side data.
    """
    job_id = data.get("job_id")
    guess = data.get("guess")
    other_job_id = data.get("other_job_id") # For High/Low mode
    
    if not job_id:
        raise HTTPException(status_code=400, detail="Missing job_id")
        
    salary_data = get_job_salary_data(job_id)
    if not salary_data:
        raise HTTPException(status_code=404, detail="Job salary not found in cache")
        
    real_salary = salary_data.get("value")
    original_salaire = salary_data.get("original_salaire")

    # CASE 1: Higher/Lower comparison
    if other_job_id:
        other_data = get_job_salary_data(other_job_id)
        if not other_data:
            raise HTTPException(status_code=404, detail="Comparison job salary not found")
        
        other_salary = other_data.get("value")
        
        # Real comparison result
        is_equal = abs(real_salary - other_salary) < 1
        is_higher = real_salary > other_salary
        
        correct = False
        if is_equal:
            correct = True
        elif guess == "higher":
            correct = is_higher
        elif guess == "lower":
            correct = not is_higher
            
        return {
            "correct": correct,
            "real_salary": real_salary,
            "other_salary": other_salary,
            "comparison": "higher" if is_higher else ("equal" if is_equal else "lower"),
            "salaire": original_salaire # Reveal unmasked
        }

    # CASE 2: Just reveal salary (if guess is None)
    if guess is None:
        return {
            "real_salary": real_salary,
            "salaire": original_salaire # Reveal unmasked
        }

    # CASE 3: Numeric guess
    try:
        guess_val = float(guess)
        real_val = float(real_salary)
        
        error_ratio = abs(guess_val - real_val) / real_val
        score = 0
        if error_ratio <= 0.5:
            x = error_ratio / 0.5
            score = 100 * ((1 - x) ** 2)
            
        return {
            "job_id": job_id,
            "real_salary": real_val,
            "guess": guess_val,
            "score": score,
            "error_percent": error_ratio * 100,
            "salaire": original_salaire, # Reveal unmasked
            "salary_text": original_salaire.get("libelle") or original_salaire.get("commentaire") # Reveal unmasked text
        }
    except Exception as e:
        logger.warning(f"Invalid guess attempt: {str(e)}")
        raise HTTPException(status_code=400, detail="Invalid guess or salary data")

@app.post("/log")
async def client_log(data: dict):
    """
    Endpoint for frontend logs. Writes to frontend.log.
    """
    level = data.get("level", "info").lower()
    message = data.get("message", "No message")
    context = data.get("context", {})
    
    log_data = {"extra_data": context}
    
    if level == "error":
        frontend_logger.error(message, extra=log_data)
    elif level == "warning":
        frontend_logger.warning(message, extra=log_data)
    else:
        frontend_logger.info(message, extra=log_data)
        
    return {"status": "ok"}

# Simple in-memory cache for stats
stats_cache = {"data": None, "expiry": 0}

@app.get("/api/stats/global")
async def global_stats():
    """
    Retrieve aggregated global statistics from logs.
    """
    now = time.time()
    if stats_cache["data"] and now < stats_cache["expiry"]:
        return stats_cache["data"]
    
    try:
        data = get_global_stats()
        stats_cache["data"] = data
        stats_cache["expiry"] = now + 60 # 1 minute cache
        return data
    except Exception as e:
        logger.error(f"Error generating global stats: {str(e)}")
        raise HTTPException(status_code=500, detail="Could not generate stats")

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
    logger.info("SalaryGuessr API Starting...")
    logger.info("Rate limiting: 9 req/sec")
    build_offer_pool(POOL_TARGET_SIZE)
    logger.info("Server ready")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=BACKEND_PORT)