"""
In-memory storage for tracking played job offers.
Ensures players don't see the same offer twice within a certain limit.
"""

from collections import deque
import threading
from ..config import PLAYED_IDS_MAXLEN

# Deque and Set for efficient lookups and LRU behavior
PLAYED_IDS = deque(maxlen=PLAYED_IDS_MAXLEN)
PLAYED_SET = set()
PLAYED_LOCK = threading.Lock()

def add_played_offer(offer_id):
    """
    Mark a job offer as played.
    
    Args:
        offer_id (str): Unique identifier of the job offer.
    """
    with PLAYED_LOCK:
        if len(PLAYED_IDS) >= PLAYED_IDS_MAXLEN:
            removed = PLAYED_IDS.popleft()
            PLAYED_SET.discard(removed)
        PLAYED_IDS.append(offer_id)
        PLAYED_SET.add(offer_id)

def is_played(offer_id):
    """
    Check if a job offer has already been played.
    
    Args:
        offer_id (str): Unique identifier of the job offer.
        
    Returns:
        bool: True if already played, False otherwise.
    """
    with PLAYED_LOCK:
        return offer_id in PLAYED_SET

def get_played_count():
    """
    Get the total number of unique job offers currently in the played history.
    
    Returns:
        int: Number of played offers.
    """
    with PLAYED_LOCK:
        return len(PLAYED_IDS)

def clear_played():
    """
    Clear the played history.
    """
    with PLAYED_LOCK:
        PLAYED_IDS.clear()
        PLAYED_SET.clear()