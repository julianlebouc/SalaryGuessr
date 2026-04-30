from collections import deque
import threading
from ..config import PLAYED_IDS_MAXLEN

PLAYED_IDS = deque(maxlen=PLAYED_IDS_MAXLEN)
PLAYED_SET = set()
PLAYED_LOCK = threading.Lock()

def add_played_offer(offer_id):
    with PLAYED_LOCK:
        if len(PLAYED_IDS) >= PLAYED_IDS_MAXLEN:
            removed = PLAYED_IDS.popleft()
            PLAYED_SET.discard(removed)
        PLAYED_IDS.append(offer_id)
        PLAYED_SET.add(offer_id)

def is_played(offer_id):
    with PLAYED_LOCK:
        return offer_id in PLAYED_SET

def get_played_count():
    with PLAYED_LOCK:
        return len(PLAYED_IDS)

def clear_played():
    with PLAYED_LOCK:
        PLAYED_IDS.clear()
        PLAYED_SET.clear()