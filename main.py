import os
import requests
import random
import re
from collections import deque
from bs4 import BeautifulSoup
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import time
from dotenv import load_dotenv

# Charger les variables d'environnement
load_dotenv()

# ==========================================================
# FASTAPI APP
# ==========================================================
app = FastAPI(title="SalaryGuessr API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

# ==========================================================
# FRANCE TRAVAIL API CONFIG
# ==========================================================
CLIENT_ID = os.getenv("FRANCE_TRAVAIL_CLIENT_ID")
CLIENT_SECRET = os.getenv("FRANCE_TRAVAIL_CLIENT_SECRET")

TOKEN_URL = "https://entreprise.francetravail.fr/connexion/oauth2/access_token?realm=/partenaire"
SEARCH_URL = "https://api.francetravail.io/partenaire/offresdemploi/v2/offres/search"

# ==========================================================
# MEMORY SYSTEM - Garde trace des offres jouées
# ==========================================================
PLAYED_IDS = deque(maxlen=2000)
PLAYED_SET = set()
OFFER_POOL = []
POOL_SIZE = 100  # Pool plus grand pour plus de variété

# ==========================================================
# TOKEN MANAGEMENT
# ==========================================================
token_cache = None
token_expiry = 0

def get_access_token():
    global token_cache, token_expiry
    
    if token_cache and time.time() < token_expiry:
        return token_cache
    
    payload = {
        "grant_type": "client_credentials",
        "client_id": CLIENT_ID,
        "client_secret": CLIENT_SECRET,
        "scope": "api_offresdemploiv2 o2dsoffre"
    }

    r = requests.post(TOKEN_URL, data=payload, timeout=20)
    r.raise_for_status()
    
    token_data = r.json()
    token_cache = token_data["access_token"]
    token_expiry = time.time() + 3500
    
    return token_cache

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
# FETCH OFFETS SANS MOT-CLÉ (TOUTES LES OFFRES)
# ==========================================================
def fetch_offers_from_page(page_number):
    """Récupère des offres d'une page spécifique SANS mot-clé"""
    token = get_access_token()
    
    headers = {"Authorization": f"Bearer {token}"}
    
    # PAS de motsCles pour avoir TOUTES les offres
    params = {
        "range": f"{page_number * 150}-{(page_number * 150) + 149}",
        "tri": random.choice(["DATE", "SCORE"])
    }
    
    r = requests.get(SEARCH_URL, headers=headers, params=params, timeout=20)
    r.raise_for_status()
    
    data = r.json()
    return data.get("resultats", [])

def build_offer_pool(target_size=100):
    """Construit un pool d'offres de PAGES TOTALEMENT ALÉATOIRES"""
    global OFFER_POOL
    
    print(f"[POOL] Construction du pool avec des pages aléatoires...")
    
    new_offers = []
    seen_ids = set()
    
    # Parcourir beaucoup de pages différentes pour plus de variété
    pages_to_fetch = random.sample(range(0, 500), min(50, 500))  # 50 pages aléatoires
    
    for page in pages_to_fetch:
        if len(new_offers) >= target_size:
            break
            
        try:
            offers = fetch_offers_from_page(page)
            print(f"[POOL] Page {page}: {len(offers)} offres trouvées")
            
            for offer in offers:
                if len(new_offers) >= target_size:
                    break
                    
                offer_id = offer.get("id")
                
                # Vérifier salaire
                salaire = offer.get("salaire", {})
                salary_text = salaire.get("libelle", "") or salaire.get("commentaire", "")
                salary_value = parse_salary(salary_text)
                
                if not salary_value or salary_value <= 0:
                    continue
                
                # Vérifier si déjà jouée ou déjà dans le pool
                if offer_id in PLAYED_SET or offer_id in seen_ids:
                    continue
                
                seen_ids.add(offer_id)
                offer["description"] = clean_html(offer.get("description", ""))
                new_offers.append(offer)
                
        except Exception as e:
            print(f"[POOL] Erreur page {page}: {e}")
            continue
    
    # Mélanger le pool
    random.shuffle(new_offers)
    OFFER_POOL = new_offers
    
    print(f"[POOL] Pool construit avec {len(OFFER_POOL)} offres uniques")
    
    # Afficher les premiers titres pour debug
    if OFFER_POOL:
        print("[POOL] Exemples d'offres dans le pool:")
        for i, job in enumerate(OFFER_POOL[:10]):
            print(f"  {i+1}. {job.get('intitule', 'N/A')} - {job.get('entreprise', {}).get('nom', 'N/A')}")
    
    return len(OFFER_POOL)

# ==========================================================
# GET RANDOM JOB FROM POOL
# ==========================================================
def get_random_job():
    global OFFER_POOL
    
    # Reconstruire le pool si vide ou trop petit
    if len(OFFER_POOL) < 20:
        print("[JOB] Pool trop petit, reconstruction...")
        build_offer_pool(POOL_SIZE)
    
    if not OFFER_POOL:
        raise Exception("Impossible de construire le pool d'offres")
    
    # Prendre une offre aléatoire du pool
    job = random.choice(OFFER_POOL)
    OFFER_POOL.remove(job)
    offer_id = job.get("id")
    
    # Marquer comme jouée
    if len(PLAYED_IDS) >= 2000:
        removed = PLAYED_IDS.popleft()
        PLAYED_SET.discard(removed)
    
    PLAYED_IDS.append(offer_id)
    PLAYED_SET.add(offer_id)
    
    print(f"[JOB] Offre sélectionnée: {job.get('intitule')}")
    print(f"[JOB] Entreprise: {job.get('entreprise', {}).get('nom', 'N/A')}")
    print(f"[JOB] Reste {len(OFFER_POOL)} offres dans le pool")
    
    return job

# ==========================================================
# FETCH RANDOM JOB
# ==========================================================
def fetch_random_job():
    return get_random_job()

# ==========================================================
# RETURN FULL OFFER DATA
# ==========================================================
def get_game_round():
    job = fetch_random_job()

    salaire = job.get("salaire", {})
    salary_text = salaire.get("libelle", "") or salaire.get("commentaire", "")
    salary_value = parse_salary(salary_text)
    
    if salary_value:
        print(f"[INFO] Salaire: {salary_value:.2f}€/mois")

    result = dict(job)
    result["description"] = job.get("description", "")
    result["salary_text"] = salary_text
    result["salary_real"] = salary_value
    result["already_played_pool_size"] = len(PLAYED_IDS)
    result["pool_remaining"] = len(OFFER_POOL)

    return result

# ==========================================================
# ROUTES
# ==========================================================
@app.get("/")
def root():
    return {
        "message": "SalaryGuessr API running",
        "played_memory": len(PLAYED_IDS),
        "pool_size": len(OFFER_POOL)
    }

@app.get("/job")
def job():
    try:
        return get_game_round()
    except Exception as e:
        print(f"[ERROR] {str(e)}")
        build_offer_pool(POOL_SIZE)
        try:
            return get_game_round()
        except:
            raise HTTPException(status_code=500, detail=str(e))

@app.get("/stats")
def stats():
    return {
        "played_count": len(PLAYED_IDS),
        "memory_limit": 2000,
        "pool_size": len(OFFER_POOL)
    }

@app.post("/reset")
def reset():
    global PLAYED_IDS, PLAYED_SET, OFFER_POOL
    PLAYED_IDS.clear()
    PLAYED_SET.clear()
    OFFER_POOL = []
    build_offer_pool(POOL_SIZE)
    return {"message": "history cleared, new pool built"}

# ==========================================================
# INITIAL POOL BUILD
# ==========================================================
print("🚀 Démarrage du serveur SalaryGuessr API")
print("📊 Récupération d'offres de PAGE ALEATOIRES sans filtre...")
build_offer_pool(POOL_SIZE)
print("✅ Serveur prêt !")

# ==========================================================
# LOCAL TEST
# ==========================================================
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)