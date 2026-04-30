import time
import threading
from collections import deque

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