"""
Rate limiter utility to comply with France Travail API limits.
Uses a sliding window algorithm to throttle requests.
"""

import time
import threading
from collections import deque

class RateLimiter:
    """
    Throttles function execution to ensure a maximum number of requests per time window.
    """
    def __init__(self, max_requests=9, time_window=1.0):
        """
        Initialize the rate limiter.
        
        Args:
            max_requests (int): Maximum number of requests allowed in the window.
            time_window (float): The time window in seconds.
        """
        self.max_requests = max_requests
        self.time_window = time_window
        self.requests = deque()
        self.lock = threading.Lock()
    
    def wait_if_needed(self):
        """
        Check the current request count and sleep if the limit is reached.
        """
        with self.lock:
            now = time.time()
            # Remove expired timestamps
            while self.requests and self.requests[0] < now - self.time_window:
                self.requests.popleft()
            
            if len(self.requests) >= self.max_requests:
                sleep_time = self.time_window - (now - self.requests[0])
                if sleep_time > 0:
                    print(f"[RATE LIMIT] Waiting {sleep_time:.2f}s...")
                    time.sleep(sleep_time)
                # Recursively check after sleeping
                return self.wait_if_needed()
            
            self.requests.append(now)

# Global instance for the application
rate_limiter = RateLimiter(max_requests=9, time_window=1.0)