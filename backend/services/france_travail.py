import requests
import random
import time
import threading
from ..config import TOKEN_URL, SEARCH_URL, FRANCE_TRAVAIL_CLIENT_ID, FRANCE_TRAVAIL_CLIENT_SECRET
from ..utils.rate_limiter import rate_limiter

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
            "client_id": FRANCE_TRAVAIL_CLIENT_ID,
            "client_secret": FRANCE_TRAVAIL_CLIENT_SECRET,
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

def fetch_offers_from_page(page_number, retry=0):
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