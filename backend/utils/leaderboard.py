"""
Leaderboard utility for SalaryGuessr.
Handles persistent storage of top 3 scores for Classic and High/Low game modes.
Provides thread-safe operations to read and update scores in a secure JSON file.
"""

import os
import json
import threading
import time
from typing import Dict, List, Any

# Resolve path for leaderboard file (stored in backend/data/leaderboard.json)
BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BACKEND_DIR, "data")
LEADERBOARD_PATH = os.path.join(DATA_DIR, "leaderboard.json")

# Ensure the data directory exists
os.makedirs(DATA_DIR, exist_ok=True)

# Lock to ensure thread safety for file operations
_leaderboard_lock = threading.Lock()


def load_leaderboard() -> Dict[str, List[Dict[str, Any]]]:
    """
    Load all-time leaderboards from the persistent JSON file.
    
    Returns:
        Dict[str, List[Dict]]: Dictionary mapping game modes ("classic", "highlow", "ordering") to lists of score entries.
    """
    default_structure = {"classic": [], "highlow": [], "ordering": []}
    
    with _leaderboard_lock:
        if not os.path.exists(LEADERBOARD_PATH):
            return default_structure
        
        try:
            with open(LEADERBOARD_PATH, "r", encoding="utf-8") as f:
                data = json.load(f)
                
            # Basic validation of structure
            if not isinstance(data, dict):
                return default_structure
            
            validated = {}
            for mode in ["classic", "highlow", "ordering"]:
                entries = data.get(mode, [])
                if not isinstance(entries, list):
                    entries = []
                
                # Validate and clean each entry structure
                valid_entries = []
                for item in entries:
                    if isinstance(item, dict) and "pseudo" in item and "score" in item:
                        valid_entries.append({
                            "pseudo": str(item["pseudo"])[:15],  # Enforce client limit
                            "score": float(item["score"]),
                            "date": str(item.get("date", ""))
                        })
                validated[mode] = valid_entries
                
            return validated
            
        except (json.JSONDecodeError, IOError, ValueError) as e:
            # If the file is corrupted or unreadable, return empty structures
            print(f"[LEADERBOARD] Error reading leaderboard file: {e}")
            return default_structure


def save_leaderboard(data: Dict[str, List[Dict[str, Any]]]) -> bool:
    """
    Save the leaderboard data atomically to prevent corruption.
    
    Args:
        data (Dict): The leaderboard data to serialize.
        
    Returns:
        bool: True if successful, False otherwise.
    """
    with _leaderboard_lock:
        try:
            # Write to a temp file in the same directory, then rename atomically
            temp_path = LEADERBOARD_PATH + ".tmp"
            with open(temp_path, "w", encoding="utf-8") as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            
            # Atomic swap on Windows requires replacing if exists
            if os.path.exists(LEADERBOARD_PATH):
                os.replace(temp_path, LEADERBOARD_PATH)
            else:
                os.rename(temp_path, LEADERBOARD_PATH)
            return True
        except IOError as e:
            print(f"[LEADERBOARD] Error writing leaderboard file: {e}")
            if os.path.exists(temp_path):
                try:
                    os.remove(temp_path)
                except Exception:
                    pass
            return False


def is_top_score(mode: str, score: float) -> bool:
    """
    Check if a score qualifies for the top 3 all-time of a given mode.
    
    Args:
        mode (str): "classic" | "highlow"
        score (float): The score to check.
        
    Returns:
        bool: True if the score is in the top 3 all-time, False otherwise.
    """
    if mode not in ["classic", "highlow", "ordering"]:
        return False
        
    leaderboard = load_leaderboard()
    entries = leaderboard.get(mode, [])
    
    # If we have less than 3 scores, any valid score fits in the top 3
    if len(entries) < 3:
        return score > 0
        
    # Otherwise, score must be strictly greater than the lowest score in the top 3
    lowest_top_score = min(item["score"] for item in entries)
    return score > lowest_top_score


def submit_score(mode: str, pseudo: str, score: float) -> List[Dict[str, Any]]:
    """
    Insert a score into the leaderboard, sort, truncate to top 3, and save to disk.
    
    Args:
        mode (str): "classic" | "highlow"
        pseudo (str): The display name of the player.
        score (float): The final score achieved.
        
    Returns:
        List[Dict]: The updated list of top 3 entries for that mode.
    """
    if mode not in ["classic", "highlow", "ordering"]:
        raise ValueError(f"Invalid game mode for leaderboard: {mode}")
        
    cleaned_pseudo = str(pseudo).strip()
    if not cleaned_pseudo:
        cleaned_pseudo = "Anonyme"
    cleaned_pseudo = cleaned_pseudo[:15]  # Strict length limit
    
    leaderboard = load_leaderboard()
    entries = leaderboard.get(mode, [])
    
    # Append the new entry
    new_entry = {
        "pseudo": cleaned_pseudo,
        "score": round(score, 2) if mode == "classic" else int(score),
        "date": time.strftime("%Y-%m-%d")
    }
    entries.append(new_entry)
    
    # Sort: primary key score (descending), secondary key date (ascending/older is higher rank)
    entries.sort(key=lambda x: (-x["score"], x["date"]))
    
    # Keep only the top 3
    truncated_entries = entries[:3]
    leaderboard[mode] = truncated_entries
    
    save_leaderboard(leaderboard)
    return truncated_entries
