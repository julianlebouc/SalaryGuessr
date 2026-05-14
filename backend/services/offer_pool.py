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
import re

# Global pool of job offers
OFFER_POOL = deque(maxlen=POOL_TARGET_SIZE)
pool_lock = threading.Lock()
refill_in_progress = False

# SECURITY: Cache to store salaries of jobs sent to clients
# Allows verification without sending the answer to the browser
SALARY_CACHE = {} 
cache_lock = threading.Lock()
MAX_CACHE_SIZE = 2000

MONTHS_FR = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"]

def format_date_fr(date_str):
    """Format ISO date to '13 mai 2026' format."""
    if not date_str: return None
    try:
        # Expected format: 2026-05-13T...
        year = date_str[:4]
        month_idx = int(date_str[5:7]) - 1
        day = date_str[8:10].lstrip('0') or '0'
        return f"{day} {MONTHS_FR[month_idx]} {year}"
    except:
        return date_str

def normalize_job_for_client(job, salary_text, include_salary=False, salary_value=None):
    """
    Transforms a raw France Travail job into a flat, minimized model for the frontend.
    """
    # Base fields
    norm = {
        "id": job.get("id"),
        "title": job.get("intitule"),
        "description": clean_html(job.get("description", "")),
        "created": format_date_fr(job.get("dateCreation")),
        "contractType": job.get("typeContratLibelle") or job.get("typeContrat"),
        "contractHours": job.get("dureeTravailLibelle"),
        "experience": job.get("experienceLibelle"),
        "qualification": job.get("qualificationLibelle"),
        "alternance": job.get("alternance", False),
        "accessibleTH": job.get("accessibleTH", False),
        "employeurHandiEngage": job.get("employeurHandiEngage", False),
        "travailType": job.get("dureeTravailLibelleConverti"),
    }
    
    # Flatten Entreprise
    ent = job.get("entreprise", {})
    norm["company"] = ent.get("nom")
    if ent.get("description"):
        norm["companyDescription"] = clean_html(ent.get("description"))
        
    # Flatten LieuTravail
    lt = job.get("lieuTravail", {})
    norm["location"] = lt.get("libelle")
    
    # Flatten Permis
    permis_list = job.get("permis", [])
    if permis_list:
        norm["permis"] = ", ".join([p.get("libelle") for p in permis_list if p.get("libelle")])
        
    # Salary fields (Only numeric if included)
    if include_salary:
        norm["salary_real"] = salary_value
        
    return norm

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

def mask_salary_text(text):
    """Mask numbers in text to prevent salary leaks."""
    if not text:
        return text
    # Replace sequences of digits (with optional decimals/commas) with dots
    return re.sub(r'\d+(?:[.,\s]\d+)*', '•••', text)

def get_pool_size():
    """
    Get the current number of offers in the pool.
    
    Returns:
        int: The pool size.
    """
    with pool_lock:
        return len(OFFER_POOL)

def get_normalized_job(include_salary=True):
    """
    Fetch a random job and return it with normalized fields.
    
    Args:
        include_salary (bool): If True, salary_real is included in the dict.
        
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
    
    # Perform all normalization on the backend to minimize transmission
    result = normalize_job_for_client(
        job, 
        salary_text, 
        include_salary=include_salary, 
        salary_value=salary_value
    )
    
    # Store in cache for verification
    job_id = job.get("id")
    with cache_lock:
        SALARY_CACHE[job_id] = {
            "value": salary_value,
            "original_salaire": salaire
        }
        if len(SALARY_CACHE) > MAX_CACHE_SIZE:
            keys = list(SALARY_CACHE.keys())
            for k in keys[:500]:
                del SALARY_CACHE[k]
    
    return result

def get_job_salary_data(job_id):
    """Retrieve salary data (value and original object) for a job from cache."""
    with cache_lock:
        return SALARY_CACHE.get(job_id)

def get_job_salary(job_id):
    """Retrieve ONLY numeric salary for a job from cache."""
    data = get_job_salary_data(job_id)
    return data.get("value") if data else None

def strip_sensitive_info(job_dict):
    """Remove salary_real and mask salaire fields from a job dictionary for public transmission."""
    if not job_dict:
        return job_dict
    public_job = dict(job_dict)
    public_job.pop("salary_real", None)
    
    if "salaire" in public_job:
        masked_salaire = dict(public_job["salaire"])
        if "libelle" in masked_salaire:
            masked_salaire["libelle"] = mask_salary_text(masked_salaire["libelle"])
        if "commentaire" in masked_salaire:
            masked_salaire["commentaire"] = mask_salary_text(masked_salaire["commentaire"])
        public_job["salaire"] = masked_salaire
        
    return public_job