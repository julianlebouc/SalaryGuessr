"""
Server-side session store for anti-cheat score tracking.
Sessions are short-lived in-memory dicts. They are created when a game starts
and finalized (deleted) when the game ends. The server computes all scores.
"""

import uuid
import time
import threading

SESSION_TTL_SECONDS = 3600  # 1 hour max per game session
_sessions = {}
_lock = threading.Lock()

# --- Allowed log event types from the frontend ---
ALLOWED_LOG_MESSAGES = {
    "landing page visit",
    "classic game started",
    "high/low game started",
    "salary order game started",
    "battle royale game started",
}


def create_session(mode: str) -> str:
    """Create a new game session and return a unique session_token."""
    token = uuid.uuid4().hex
    with _lock:
        _sessions[token] = {
            "mode": mode,
            "created_at": time.time(),
            "round_scores": [],  # list of per-round scores (Classic mode)
            "streak": 0,         # consecutive correct answers (High/Low mode)
            "ordering_current_count": 3,
            "ordering_best": 0,
            "finalized": False,
        }
    return token


def get_session(token: str) -> dict | None:
    """Retrieve a session by token, or None if not found / expired."""
    with _lock:
        s = _sessions.get(token)
        if s is None:
            return None
        if time.time() - s["created_at"] > SESSION_TTL_SECONDS:
            del _sessions[token]
            return None
        return s


def record_round_score(token: str, score: float):
    """Append a per-round score to the session (Classic mode)."""
    with _lock:
        s = _sessions.get(token)
        if s and not s["finalized"]:
            s["round_scores"].append(score)


def increment_streak(token: str):
    """Increment the streak counter for High/Low mode."""
    with _lock:
        s = _sessions.get(token)
        if s and not s["finalized"]:
            s["streak"] += 1


def finalize_session(token: str) -> dict | None:
    """
    Mark session as finalized and return computed results.
    Returns None if session not found.
    """
    with _lock:
        s = _sessions.get(token)
        if not s or s["finalized"]:
            return None
        s["finalized"] = True
        s["score_submitted"] = False

        mode = s["mode"]
        if mode == "classic":
            rounds = s["round_scores"]
            score = round(sum(rounds) / len(rounds), 2) if rounds else 0.0
            s["final_score"] = score
            return {"mode": mode, "score": score, "rounds": len(rounds)}
        elif mode == "highlow":
            score = s["streak"]
            s["final_score"] = score
            return {"mode": mode, "score": score}
        elif mode == "ordering":
            score = int(s.get("ordering_best", 0))
            s["final_score"] = score
            return {"mode": mode, "score": score}
        else:
            s["final_score"] = 0
            return {"mode": mode, "score": 0}


def cleanup_old_sessions():
    """Prune all expired sessions (call periodically or on demand)."""
    now = time.time()
    with _lock:
        expired = [t for t, s in _sessions.items() if now - s["created_at"] > SESSION_TTL_SECONDS]
        for t in expired:
            del _sessions[t]
