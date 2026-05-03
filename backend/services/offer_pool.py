"""
Service for managing the pool of job offers fetched from France Travail.
Handles background refilling, offer selection, and deduplication.
"""

import random
import threading
import time
from collections import deque
from ..config import POOL_TARGET_SIZE, POOL_MIN_SIZE
from ..utils.memory import is_played, add_played_offer, get_played_count
from .france_travail import fetch_offers_from_page
from .salary_parser import parse_salary
from .text_cleaner import clean_html

# Global pool of job offers
OFFER_POOL = deque(maxlen=POOL_TARGET_SIZE)
pool_lock = threading.Lock()
refill_in_progress = False

def build_offer_pool(target_size=POOL_TARGET_SIZE):
    """
    Rebuild the job offer pool by fetching multiple pages from the API.
    Filters offers that don't have a valid salary or have already been played.
    
    Args:
        target_size (int): The number of offers to fetch.
        
    Returns:
        int: The number of unique offers successfully added to the pool.
    """
    global OFFER_POOL, refill_in_progress
    
    with pool_lock:
        if refill_in_progress:
            print("[POOL] Rebuilding already in progress...")
            return 0
        refill_in_progress = True
    
    try:
        print(f"[POOL] Building pool (target: {target_size})...")
        
        new_offers = []
        seen_ids = set()
        
        with pool_lock:
            for existing_job in OFFER_POOL:
                if existing_job.get("id"):
                    seen_ids.add(existing_job.get("id"))
        
        # Priority pages (fresh offers)
        primary_pages = list(range(0, 40))
        random.shuffle(primary_pages)
        # Fallback pages
        fallback_pages = list(range(40, 120))
        random.shuffle(fallback_pages)
        
        pages_to_fetch = primary_pages + fallback_pages
        success_count = 0
        
        for page in pages_to_fetch:
            if len(new_offers) >= target_size:
                break
                
            offers = fetch_offers_from_page(page)
            
            if not offers:
                continue
                
            success_count += 1
            print(f"[POOL] Page {page}: {len(offers)} offers (total: {len(new_offers)})")
            
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
            print("[POOL] ⚠️ No offers found, check your connection")
            return 0
        
        random.shuffle(new_offers)
        
        with pool_lock:
            OFFER_POOL.clear()
            OFFER_POOL.extend(new_offers)
        
        print(f"[POOL] ✅ Pool built with {len(OFFER_POOL)} unique offers")
        return len(OFFER_POOL)
        
    except Exception as e:
        print(f"[POOL] ERROR: {e}")
        return 0
    finally:
        with pool_lock:
            refill_in_progress = False

def refill_pool_if_needed():
    """
    Check if the pool size is below the minimum threshold and trigger a refill in the background.
    """
    with pool_lock:
        pool_size = len(OFFER_POOL)
        already_refilling = refill_in_progress
    
    if pool_size < POOL_MIN_SIZE and not already_refilling:
        print(f"[MAINTENANCE] Pool too small ({pool_size}), rebuilding in background...")
        thread = threading.Thread(target=build_offer_pool, args=(POOL_TARGET_SIZE,))
        thread.daemon = True
        thread.start()

def get_random_job():
    """
    Pick a random job from the pool, marking it as played.
    Wait for refill if the pool is empty.
    
    Returns:
        dict: A job offer dictionary.
        
    Raises:
        Exception: If the pool remains empty after several retries.
    """
    global OFFER_POOL
    
    refill_pool_if_needed()
    
    retries = 0
    while retries < 15:
        pool_empty = False
        with pool_lock:
            if OFFER_POOL:
                job = OFFER_POOL.popleft()
                offer_id = job.get("id")
                break
            else:
                pool_empty = True
        
        if pool_empty:
            print(f"[JOB] Pool empty, waiting... ({retries + 1}/15)")
            time.sleep(1)
            retries += 1
            refill_pool_if_needed()
    else:
        raise Exception("Offer pool empty after 15 seconds wait")
    
    add_played_offer(offer_id)
    
    with pool_lock:
        remaining = len(OFFER_POOL)
    
    print(f"[JOB] {job.get('intitule', 'N/A')[:50]} | Remaining: {remaining}")
    
    return job

def get_pool_size():
    """
    Get the current number of offers in the pool.
    
    Returns:
        int: The pool size.
    """
    with pool_lock:
        return len(OFFER_POOL)

def get_normalized_job():
    """
    Fetch a random job and return it with normalized fields for the frontend.
    Includes salary parsing and description cleaning.
    
    Returns:
        dict: Normalized job object.
    """
    from .salary_parser import parse_salary
    from .text_cleaner import clean_html
    from ..utils.memory import get_played_count
    
    job = get_random_job()
    
    salaire = job.get("salaire", {})
    salary_text = salaire.get("libelle", "") or salaire.get("commentaire", "")
    salary_value = parse_salary(salary_text)
    
    result = dict(job)
    result["description"] = clean_html(job.get("description", ""))
    result["salary_text"] = salary_text
    result["salary_real"] = salary_value
    result["already_played_pool_size"] = get_played_count()
    result["pool_remaining"] = get_pool_size()
    
    return result