import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from .config import ENVIRONMENT, DEBUG, BACKEND_PORT, BACKEND_URL, FRONTEND_URL, CORS_ORIGINS, POOL_TARGET_SIZE
from .services.offer_pool import get_random_job, get_pool_size, build_offer_pool
from .services.salary_parser import parse_salary
from .utils.memory import get_played_count, clear_played
from .services.offer_pool import OFFER_POOL, refill_in_progress
import threading

# ==========================================================
# FASTAPI APP
# ==========================================================
app = FastAPI(title="SalaryGuessr API")

print(f"[CORS] Origines autorisées: {CORS_ORIGINS}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

print(f"[CONFIG] Environnement: {ENVIRONMENT}")
print(f"[CONFIG] Backend: {BACKEND_URL}")
print(f"[CONFIG] Frontend: {FRONTEND_URL}")

# ==========================================================
# ROUTES
# ==========================================================
@app.get("/")
def root():
    return {
        "message": "SalaryGuessr API running",
        "environment": ENVIRONMENT,
        "played_memory": get_played_count(),
        "pool_size": get_pool_size()
    }

@app.get("/job")
def job():
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
    return {
        "played_count": get_played_count(),
        "pool_size": get_pool_size(),
        "environment": ENVIRONMENT
    }

@app.post("/reset")
def reset():
    from backend.services.offer_pool import OFFER_POOL, refill_in_progress
    from backend.utils.memory import clear_played
    import threading
    
    with threading.Lock():
        clear_played()
        OFFER_POOL.clear()
        refill_in_progress = False
    
    build_offer_pool(POOL_TARGET_SIZE)
    return {"message": "Reset complet"}

# ==========================================================
# INITIAL POOL BUILD
# ==========================================================
print("🚀 SalaryGuessr API")
print("📊 Rate limiting: 9 req/sec")
build_offer_pool(POOL_TARGET_SIZE)
print("✅ Serveur prêt")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=BACKEND_PORT)