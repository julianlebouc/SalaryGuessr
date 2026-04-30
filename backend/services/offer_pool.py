import random
import threading
import time
from collections import deque
from ..config import POOL_TARGET_SIZE, POOL_MIN_SIZE
from ..utils.memory import is_played, add_played_offer, get_played_count
from .france_travail import fetch_offers_from_page
from .salary_parser import parse_salary
from .text_cleaner import clean_html

OFFER_POOL = deque(maxlen=200)
pool_lock = threading.Lock()
refill_in_progress = False

def build_offer_pool(target_size=POOL_TARGET_SIZE):
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
                
                if is_played(offer_id) or offer_id in seen_ids:
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
    
    add_played_offer(offer_id)
    
    with pool_lock:
        remaining = len(OFFER_POOL)
    
    print(f"[JOB] {job.get('intitule', 'N/A')[:50]} | Reste: {remaining}")
    
    return job

def get_pool_size():
    with pool_lock:
        return len(OFFER_POOL)