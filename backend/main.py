"""
Main entry point for the SalaryGuessr API.
Configures FastAPI, Socket.IO, rate limiting, and initializes the offer pool.
"""

import sys
import os
import threading

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi import FastAPI, HTTPException, Header, Request
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
import socketio

from .config import ENVIRONMENT, DEBUG, BACKEND_PORT, CORS_ORIGINS, POOL_TARGET_SIZE, ADMIN_SECRET_KEY
from .services.offer_pool import get_random_job, get_pool_size, build_offer_pool, get_job_salary_data, get_job_salary
from .services.salary_parser import parse_salary
from .utils.memory import get_played_count, clear_played
from .services.offer_pool import OFFER_POOL, refill_in_progress, get_normalized_job, strip_sensitive_info
from .utils.logger import logger, access_logger, frontend_logger
from .utils.stats_parser import get_global_stats
from .utils.sessions import (
    ALLOWED_LOG_MESSAGES,
    create_session,
    get_session,
    record_round_score,
    increment_streak,
    finalize_session,
    cleanup_old_sessions,
)
from .utils.leaderboard import is_top_score, submit_score, load_leaderboard
import time

# Import multiplayer system
from .multiplayer import get_room_manager, BattleRoyaleGame
from .multiplayer.socket_handlers import SocketHandlers

# ==========================================================
# RATE LIMITER
# ==========================================================
limiter = Limiter(key_func=get_remote_address)

# ==========================================================
# INITIALIZATION
# ==========================================================

# Register game modes
room_manager = get_room_manager()
room_manager.register_game(BattleRoyaleGame())

# ==========================================================
# LIFESPAN
# ==========================================================
@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Execute startup tasks: build the initial offer pool.
    """
    logger.info("SalaryGuessr API Starting...")
    logger.info("Rate limiting: 9 req/sec")
    build_offer_pool(POOL_TARGET_SIZE)
    logger.info("Server ready")
    yield

# ==========================================================
# FASTAPI APP
# ==========================================================
app = FastAPI(
    title="SalaryGuessr API",
    description="Backend API for SalaryGuessr providing job offers and multiplayer features.",
    lifespan=lifespan
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

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
# SOCKET.IO  — CORS locked to known origins
# ==========================================================
sio = socketio.AsyncServer(cors_allowed_origins=CORS_ORIGINS, async_mode='asgi')
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
@limiter.limit("60/minute")
def job(request: Request):
    """
    Fetch a random job offer without the real salary (Anti-Cheat).
    Rate limited to 60 requests/minute per IP.
    """
    try:
        # include_salary=False ensures salary_real is NOT sent to the browser
        return get_normalized_job(include_salary=False)
    except Exception as e:
        logger.error(f"Error fetching job: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal Server Error")


@app.post("/session/start")
@limiter.limit("30/minute")
def session_start(request: Request, data: dict):
    """
    Start a new anti-cheat game session. Returns a session_token that must be
    included in subsequent /validate and /game_over calls.

    Body:
        mode (str): "classic" | "highlow"
    """
    mode = data.get("mode", "classic")
    if mode not in ("classic", "highlow"):
        raise HTTPException(status_code=400, detail="Invalid game mode")
    token = create_session(mode)
    return {"session_token": token}


@app.post("/validate")
@limiter.limit("120/minute")
def validate(request: Request, data: dict):
    """
    Validate a user's guess (numeric or comparison) against server-side data.
    Optionally record per-round score into a session for anti-cheat.
    """
    job_id = data.get("job_id")
    guess = data.get("guess")
    other_job_id = data.get("other_job_id")  # For High/Low mode
    session_token = data.get("session_token")  # Anti-cheat session

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

        is_equal = abs(real_salary - other_salary) < 1
        is_higher = real_salary > other_salary

        correct = False
        if is_equal:
            correct = True
        elif guess == "higher":
            correct = is_higher
        elif guess == "lower":
            correct = not is_higher

        # Anti-cheat: record streak increment server-side
        if correct and session_token:
            increment_streak(session_token)

        return {
            "correct": correct,
            "real_salary": real_salary,
            "other_salary": other_salary,
            "comparison": "higher" if is_higher else ("equal" if is_equal else "lower")
        }

    # CASE 2: Just reveal salary (if guess is None)
    if guess is None:
        return {"real_salary": real_salary}

    # CASE 3: Numeric guess
    try:
        guess_val = float(guess)
        real_val = float(real_salary)

        error_ratio = abs(guess_val - real_val) / real_val
        score = 0
        if error_ratio <= 0.5:
            x = error_ratio / 0.5
            score = 100 * ((1 - x) ** 2)

        # Anti-cheat: record per-round score server-side
        if session_token:
            record_round_score(session_token, score)

        return {
            "job_id": job_id,
            "real_salary": real_val,
            "guess": guess_val,
            "score": score,
            "error_percent": error_ratio * 100
        }
    except Exception as e:
        logger.warning(f"Invalid guess attempt: {str(e)}")
        raise HTTPException(status_code=400, detail="Invalid guess or salary data")


@app.post("/game_over")
@limiter.limit("30/minute")
def game_over(request: Request, data: dict):
    """
    Finalize a game session. The server computes and logs the final score
    based on the accumulated round scores — the client never submits a score.

    Body:
        session_token (str): The token from /session/start.
    """
    session_token = data.get("session_token")
    if not session_token:
        raise HTTPException(status_code=400, detail="Missing session_token")

    result = finalize_session(session_token)
    if not result:
        raise HTTPException(status_code=404, detail="Session not found or already finalized")

    mode = result["mode"]
    score = result["score"]

    # Check if the authoritative score qualifies for the top 3 all-time
    is_top_3 = is_top_score(mode, score)

    # Write the authoritative log entry server-side
    if mode == "classic":
        frontend_logger.info("Classic game finished", extra={"extra_data": {"score": score, "rounds": result.get("rounds", 0)}})
    elif mode == "highlow":
        frontend_logger.info("High/Low game over", extra={"extra_data": {"finalScore": score}})

    logger.info(f"[ANTI-CHEAT] Game over logged server-side: mode={mode}, score={score}, is_top_3={is_top_3}")
    return {"mode": mode, "score": score, "is_top_3": is_top_3}


@app.get("/api/leaderboard")
def get_leaderboard():
    """
    Retrieve the all-time top 3 leaderboard for Classic and High/Low game modes.
    """
    return load_leaderboard()


@app.post("/api/leaderboard/submit")
@limiter.limit("30/minute")
def submit_leaderboard(request: Request, data: dict):
    """
    Submit a top 3 high score securely using the completed session token.
    """
    session_token = data.get("session_token")
    pseudo = data.get("pseudo")

    if not session_token:
        raise HTTPException(status_code=400, detail="Missing session_token")

    if not pseudo or not isinstance(pseudo, str) or not pseudo.strip():
        raise HTTPException(status_code=400, detail="Invalid or empty pseudo")

    cleaned_pseudo = pseudo.strip()
    if len(cleaned_pseudo) > 15:
        raise HTTPException(status_code=400, detail="Pseudo exceeds 15 characters limit")

    # Fetch the session
    session = get_session(session_token)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found or expired")

    # Ensure session is finalized
    if not session.get("finalized"):
        raise HTTPException(status_code=400, detail="Session is not completed yet")

    # Ensure score was not already submitted to prevent replay
    if session.get("score_submitted"):
        raise HTTPException(status_code=400, detail="Score has already been submitted for this session")

    mode = session.get("mode")
    score = session.get("final_score", 0.0)

    # Double check eligibility
    if not is_top_score(mode, score):
        raise HTTPException(status_code=400, detail="Score does not qualify for top 3 all-time")

    # Mark score as submitted to prevent replaying submission
    session["score_submitted"] = True

    # Submit score to leaderboard file
    updated_top_3 = submit_score(mode, cleaned_pseudo, score)
    return {"status": "success", "leaderboard": updated_top_3}


@app.post("/log")
@limiter.limit("60/minute")
async def client_log(request: Request, data: dict):
    """
    Endpoint for frontend logs. Only accepts allowlisted event messages.
    Score data is IGNORED — scores are written by /game_over server-side.
    """
    level = data.get("level", "info").lower()
    message = data.get("message", "No message")
    context = data.get("context", {})

    # SECURITY: Reject any message not in the explicit allowlist
    if message.lower() not in ALLOWED_LOG_MESSAGES:
        # Silently ignore — don't give attacker feedback
        return {"status": "ok"}

    # Strip any score fields to prevent injection
    safe_context = {
        k: v for k, v in context.items()
        if k not in ("score", "finalScore", "avgScore", "points")
    }

    log_data = {"extra_data": safe_context}

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
        stats_cache["expiry"] = now + 60  # 1 minute cache
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
def reset(x_admin_key: str = Header(None)):
    """
    Reset the game state, clear the pool, and rebuild it.
    PROTECTED: Requires X-Admin-Key header matching ADMIN_SECRET_KEY env var.

    Returns:
        dict: Success message.
    """
    if not ADMIN_SECRET_KEY or x_admin_key != ADMIN_SECRET_KEY:
        raise HTTPException(status_code=403, detail="Forbidden")

    with threading.Lock():
        clear_played()
        OFFER_POOL.clear()
    build_offer_pool(POOL_TARGET_SIZE)
    cleanup_old_sessions()
    return {"message": "Full reset complete"}


# Startup logic moved to lifespan

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=BACKEND_PORT)