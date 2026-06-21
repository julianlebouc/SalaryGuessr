import os
import json
import glob
from ..config import LOG_DIR

def get_global_stats():
    """
    Parses frontend logs to aggregate game statistics.
    Scans all rotated log files (frontend.log, frontend.log.2023-...)
    """
    stats = {
        "unique_sessions": set(),
        "total_games": 0,
        "modes": {
            "classic": {"count": 0, "total_score": 0, "min_score": float('inf'), "max_score": 0},
            "highlow": {"count": 0, "total_score": 0, "min_score": float('inf'), "max_score": 0},
            "ordering": {"count": 0, "total_score": 0, "min_score": float('inf'), "max_score": 0},
            "battle_royale": {"count": 0}
        },
        "games_per_day": {} # { "YYYY-MM-DD": count }
    }

    # Find all frontend log files
    log_files = glob.glob(os.path.join(LOG_DIR, "frontend.log*"))

    for file_path in log_files:
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                for line in f:
                    try:
                        data = json.loads(line)
                        msg = data.get("message", "")
                        session_id = data.get("sessionId")
                        timestamp = data.get("timestamp", "")
                        # Extract YYYY-MM-DD from ISO format (e.g., 2026-05-10T14:22...)
                        day = timestamp[:10] if timestamp and len(timestamp) >= 10 else "Unknown"

                        if session_id:
                            stats["unique_sessions"].add(session_id)

                        # Track games per day
                        if "game started" in msg.lower():
                            stats["total_games"] += 1
                            stats["games_per_day"][day] = stats["games_per_day"].get(day, 0) + 1

                        # Mode specific stats
                        if "classic game finished" in msg.lower():
                            m = stats["modes"]["classic"]
                            score = data.get("score", 0)
                            m["count"] += 1
                            m["total_score"] += score
                            m["min_score"] = min(m["min_score"], score)
                            m["max_score"] = max(m["max_score"], score)

                        elif "high/low game over" in msg.lower():
                            m = stats["modes"]["highlow"]
                            score = data.get("finalScore", 0)
                            m["count"] += 1
                            m["total_score"] += score
                            m["min_score"] = min(m["min_score"], score)
                            m["max_score"] = max(m["max_score"], score)

                        elif "battle royale game started" in msg.lower():
                            stats["modes"]["battle_royale"]["count"] += 1

                        elif "salary order game over" in msg.lower():
                            m = stats["modes"]["ordering"]
                            score = data.get("finalScore", 0)
                            m["count"] += 1
                            m["total_score"] += score
                            m["min_score"] = min(m["min_score"], score)
                            m["max_score"] = max(m["max_score"], score)

                    except (json.JSONDecodeError, KeyError):
                        continue
        except Exception:
            continue

    # Cleanup min_score if no games played
    for mode in ["classic", "highlow", "ordering"]:
        if stats["modes"][mode]["count"] == 0:
            stats["modes"][mode]["min_score"] = 0
        
    # Final formatting
    result = {
        "unique_sessions_count": len(stats["unique_sessions"]),
        "total_games_played": stats["total_games"],
        "modes": {
            "classic": {
                "games": stats["modes"]["classic"]["count"],
                "avg_score": round(stats["modes"]["classic"]["total_score"] / stats["modes"]["classic"]["count"], 2) if stats["modes"]["classic"]["count"] > 0 else 0,
                "min_score": round(stats["modes"]["classic"]["min_score"], 2) if stats["modes"]["classic"]["min_score"] != float('inf') else 0,
                "max_score": round(stats["modes"]["classic"]["max_score"], 2)
            },
            "highlow": {
                "games": stats["modes"]["highlow"]["count"],
                "avg_score": round(stats["modes"]["highlow"]["total_score"] / stats["modes"]["highlow"]["count"], 2) if stats["modes"]["highlow"]["count"] > 0 else 0,
                "min_score": round(stats["modes"]["highlow"]["min_score"], 2) if stats["modes"]["highlow"]["min_score"] != float('inf') else 0,
                "max_score": round(stats["modes"]["highlow"]["max_score"], 2)
            },
            "ordering": {
                "games": stats["modes"]["ordering"]["count"],
                "avg_score": round(stats["modes"]["ordering"]["total_score"] / stats["modes"]["ordering"]["count"], 2) if stats["modes"]["ordering"]["count"] > 0 else 0,
                "min_score": round(stats["modes"]["ordering"]["min_score"], 2) if stats["modes"]["ordering"]["min_score"] != float('inf') else 0,
                "max_score": round(stats["modes"]["ordering"]["max_score"], 2)
            },
            "battle_royale": {
                "games": stats["modes"]["battle_royale"]["count"]
            }
        },
        "daily_activity": [{"day": day, "count": count} for day, count in sorted(stats["games_per_day"].items())][-15:] # Last 15 days
    }

    return result
