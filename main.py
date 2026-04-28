import os
import requests
import random
import re
from collections import deque
from bs4 import BeautifulSoup
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import time
import threading
from dotenv import load_dotenv

# Charger les variables d'environnement
load_dotenv()

# ==========================================================
# FASTAPI APP - CONFIGURATION DYNAMIQUE
# ==========================================================
app = FastAPI(title="SalaryGuessr API")

# Lire les origines CORS depuis .env
cors_origins = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")
cors_origins = [origin.strip() for origin in cors_origins]  # Nettoyer les espaces

print(f"[CORS] Origines autorisées: {cors_origins}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==========================================================
# CONFIGURATION DYNAMIQUE
# ==========================================================
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")
DEBUG = os.getenv("DEBUG", "False").lower() == "true"
BACKEND_PORT = int(os.getenv("BACKEND_PORT", 8000))
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")
BACKEND_URL = os.getenv("BACKEND_URL", f"http://localhost:{BACKEND_PORT}")

print(f"[CONFIG] Environnement: {ENVIRONMENT}")
print(f"[CONFIG] Backend: {BACKEND_URL}")
print(f"[CONFIG] Frontend: {FRONTEND_URL}")

# ==========================================================
# FRANCE TRAVAIL API CONFIG
# ==========================================================
CLIENT_ID = os.getenv("FRANCE_TRAVAIL_CLIENT_ID")
CLIENT_SECRET = os.getenv("FRANCE_TRAVAIL_CLIENT_SECRET")

if not CLIENT_ID or not CLIENT_SECRET:
    raise ValueError("Variables FRANCE_TRAVAIL_CLIENT_ID et FRANCE_TRAVAIL_CLIENT_SECRET requises")

TOKEN_URL = "https://entreprise.francetravail.fr/connexion/oauth2/access_token?realm=/partenaire"
SEARCH_URL = "https://api.francetravail.io/partenaire/offresdemploi/v2/offres/search"

# ==========================================================
# RATE LIMITER
# ==========================================================
class RateLimiter:
    def __init__(self, max_requests=9, time_window=1.0):
        self.max_requests = max_requests
        self.time_window = time_window
        self.requests = deque()
        self.lock = threading.Lock()
    
    def wait_if_needed(self):
        with self.lock:
            now = time.time()
            while self.requests and self.requests[0] < now - self.time_window:
                self.requests.popleft()
            if len(self.requests) >= self.max_requests:
                sleep_time = self.time_window - (now - self.requests[0])
                if sleep_time > 0:
                    print(f"[RATE LIMIT] Attente de {sleep_time:.2f}s...")
                    time.sleep(sleep_time)
                return self.wait_if_needed()
            self.requests.append(now)

rate_limiter = RateLimiter(max_requests=9, time_window=1.0)

# ==========================================================
# MEMORY SYSTEM
# ==========================================================
PLAYED_IDS = deque(maxlen=2000)
PLAYED_SET = set()
OFFER_POOL = deque(maxlen=200)
POOL_MIN_SIZE = 50
POOL_TARGET_SIZE = 100

pool_lock = threading.Lock()
refill_in_progress = False

# ==========================================================
# TOKEN MANAGEMENT AVEC AUTO-RENOUVELLEMENT
# ==========================================================
token_cache = None
token_expiry = 0
token_lock = threading.Lock()

def get_access_token(force_refresh=False):
    global token_cache, token_expiry
    
    with token_lock:
        if not force_refresh and token_cache and time.time() < token_expiry:
            return token_cache
        
        print("[TOKEN] Génération d'un nouveau token...")
        
        payload = {
            "grant_type": "client_credentials",
            "client_id": CLIENT_ID,
            "client_secret": CLIENT_SECRET,
            "scope": "api_offresdemploiv2 o2dsoffre"
        }

        try:
            r = requests.post(TOKEN_URL, data=payload, timeout=30)
            r.raise_for_status()
            
            token_data = r.json()
            token_cache = token_data["access_token"]
            token_expiry = time.time() + 3500
            
            print(f"[TOKEN] Token généré, expire dans 58 minutes")
            return token_cache
            
        except Exception as e:
            print(f"[TOKEN] Erreur: {e}")
            raise

# ==========================================================
# SALARY PARSER
# ==========================================================
def parse_salary(text):
    if not text:
        return None

    text_lower = text.lower()
    
    nums = re.findall(r"\d+(?:[.,]\d+)?", text.replace(" ", ""))
    vals = [float(n.replace(",", ".")) for n in nums]
    vals = [v for v in vals if 500 <= v <= 50000]
    
    if not vals:
        return None
    
    if len(vals) == 1:
        raw_value = vals[0]
    else:
        raw_value = sum(vals) / len(vals)
    
    is_annual = 'annuel' in text_lower or 'an' in text_lower or '/an' in text_lower
    is_monthly = 'mensuel' in text_lower or '/mois' in text_lower or 'par mois' in text_lower
    
    if is_annual and not is_monthly:
        if raw_value > 10000:
            return raw_value / 12
        return raw_value
    else:
        return raw_value

# ==========================================================
# CLEAN DESCRIPTION
# ==========================================================
def clean_html(text):
    if not text:
        return ""
    return BeautifulSoup(text, "html.parser").get_text(" ", strip=True)

# ==========================================================
# FETCH OFFERS AVEC GESTION 401
# ==========================================================
def fetch_offers_from_page(page_number, retry=0):
    """Récupère des offres avec gestion des erreurs 401"""
    if retry > 2:
        return []
    
    try:
        rate_limiter.wait_if_needed()
        
        token = get_access_token()
        headers = {"Authorization": f"Bearer {token}"}
        
        params = {
            "range": f"{page_number * 150}-{(page_number * 150) + 149}",
            "tri": random.choice(["DATE", "SCORE"])
        }
        
        r = requests.get(SEARCH_URL, headers=headers, params=params, timeout=15)
        
        # Si token expiré, renouveler et réessayer
        if r.status_code == 401:
            print(f"[401] Token expiré, renouvellement...")
            get_access_token(force_refresh=True)
            return fetch_offers_from_page(page_number, retry + 1)
        
        r.raise_for_status()
        data = r.json()
        return data.get("resultats", [])
        
    except requests.exceptions.Timeout:
        print(f"[TIMEOUT] Page {page_number} - timeout après 15s")
        return []
    except Exception as e:
        print(f"[ERROR] Page {page_number}: {str(e)[:100]}")
        return []

def build_offer_pool(target_size=100):
    global OFFER_POOL, refill_in_progress
    
    with pool_lock:
        if refill_in_progress:
            print("[POOL] Reconstruction déjà en cours...")
            return 0
        refill_in_progress = True
    
    try:
        print(f"[POOL] Construction (target: {target_size})...")
        
        new_offers = []
        seen_ids = set()
        
        with pool_lock:
            for existing_job in OFFER_POOL:
                if existing_job.get("id"):
                    seen_ids.add(existing_job.get("id"))
        
        # Moins de pages pour démarrer plus vite
        pages_to_fetch = random.sample(range(0, 300), min(30, 300))
        success_count = 0
        
        for page in pages_to_fetch:
            if len(new_offers) >= target_size:
                break
                
            offers = fetch_offers_from_page(page)
            
            if not offers:
                continue
                
            success_count += 1
            print(f"[POOL] Page {page}: {len(offers)} offres (total: {len(new_offers)})")
            
            for offer in offers:
                if len(new_offers) >= target_size:
                    break
                    
                offer_id = offer.get("id")
                
                salaire = offer.get("salaire", {})
                salary_text = salaire.get("libelle", "") or salaire.get("commentaire", "")
                salary_value = parse_salary(salary_text)
                
                if not salary_value or salary_value <= 0:
                    continue
                
                if offer_id in PLAYED_SET or offer_id in seen_ids:
                    continue
                
                seen_ids.add(offer_id)
                offer["description"] = clean_html(offer.get("description", ""))
                new_offers.append(offer)
        
        if success_count == 0:
            print("[POOL] ⚠️ Aucune offre trouvée, vérifiez votre connexion")
            return 0
        
        random.shuffle(new_offers)
        
        with pool_lock:
            OFFER_POOL.clear()
            OFFER_POOL.extend(new_offers)
        
        print(f"[POOL] ✅ Pool construit avec {len(OFFER_POOL)} offres uniques")
        return len(OFFER_POOL)
        
    except Exception as e:
        print(f"[POOL] ERREUR: {e}")
        return 0
    finally:
        with pool_lock:
            refill_in_progress = False

def refill_pool_if_needed():
    with pool_lock:
        pool_size = len(OFFER_POOL)
        already_refilling = refill_in_progress
    
    if pool_size < POOL_MIN_SIZE and not already_refilling:
        print(f"[MAINTENANCE] Pool trop petit ({pool_size}), reconstruction...")
        thread = threading.Thread(target=build_offer_pool, args=(POOL_TARGET_SIZE,))
        thread.daemon = True
        thread.start()

# ==========================================================
# GET RANDOM JOB FROM POOL
# ==========================================================
def get_random_job():
    global OFFER_POOL
    
    refill_pool_if_needed()
    
    retries = 0
    while retries < 15:
        with pool_lock:
            if OFFER_POOL:
                job = OFFER_POOL.popleft()
                offer_id = job.get("id")
                break
            else:
                pool_empty = True
        
        if pool_empty:
            print(f"[JOB] Pool vide, attente... ({retries + 1}/15)")
            time.sleep(1)
            retries += 1
            refill_pool_if_needed()
    else:
        raise Exception("Pool d'offres vide après 15 secondes")
    
    if len(PLAYED_IDS) >= 2000:
        removed = PLAYED_IDS.popleft()
        PLAYED_SET.discard(removed)
    
    PLAYED_IDS.append(offer_id)
    PLAYED_SET.add(offer_id)
    
    with pool_lock:
        remaining = len(OFFER_POOL)
    
    print(f"[JOB] {job.get('intitule', 'N/A')[:50]} | Reste: {remaining}")
    
    return job

def fetch_random_job():
    return get_random_job()

def get_game_round():
    job = fetch_random_job()

    salaire = job.get("salaire", {})
    salary_text = salaire.get("libelle", "") or salaire.get("commentaire", "")
    salary_value = parse_salary(salary_text)

    result = dict(job)
    result["description"] = job.get("description", "")
    result["salary_text"] = salary_text
    result["salary_real"] = salary_value
    result["already_played_pool_size"] = len(PLAYED_IDS)
    
    with pool_lock:
        result["pool_remaining"] = len(OFFER_POOL)

    return result

# ==========================================================
# ROUTES
# ==========================================================
@app.get("/")
def root():
    with pool_lock:
        pool_size = len(OFFER_POOL)
    return {
        "message": "SalaryGuessr API running",
        "played_memory": len(PLAYED_IDS),
        "pool_size": pool_size
    }

@app.get("/job")
def job():
    try:
        return get_game_round()
    except Exception as e:
        print(f"[ERROR] {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/stats")
def stats():
    with pool_lock:
        pool_size = len(OFFER_POOL)
    return {
        "played_count": len(PLAYED_IDS),
        "pool_size": pool_size
    }

@app.post("/reset")
def reset():
    global PLAYED_IDS, PLAYED_SET, OFFER_POOL, refill_in_progress
    with pool_lock:
        PLAYED_IDS.clear()
        PLAYED_SET.clear()
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
    uvicorn.run(app, host="0.0.0.0", port=8000)