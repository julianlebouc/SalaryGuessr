import pytest
import json
import os
from fastapi.testclient import TestClient
from backend.main import app
from backend.utils.stats_parser import get_global_stats

client = TestClient(app)

def test_stats_endpoint(tmp_path, monkeypatch):
    """
    Test that the stats endpoint returns a valid structure even with no logs.
    """
    # Mock LOG_DIR to an empty temp directory
    monkeypatch.setattr("backend.utils.stats_parser.LOG_DIR", str(tmp_path))
    
    response = client.get("/api/stats/global")
    assert response.status_code == 200
    data = response.json()
    
    assert "total_games_played" in data
    assert "modes" in data
    assert "classic" in data["modes"]
    assert "daily_activity" in data

def test_stats_parsing(tmp_path):
    """
    Test the log parser with sample JSON log lines.
    """
    log_file = tmp_path / "frontend.log"
    log_lines = [
        json.dumps({
            "timestamp": "2026-05-10 12:00:00",
            "message": "Classic game started",
            "sessionId": "s1", "maxRounds": 10
        }),
        json.dumps({
            "timestamp": "2026-05-10 12:10:00",
            "message": "Classic game finished",
            "sessionId": "s1", "score": 500, "maxRounds": 10
        }),
        json.dumps({
            "timestamp": "2026-05-10 12:15:00",
            "message": "High/Low game started",
            "sessionId": "s2"
        }),
        json.dumps({
            "timestamp": "2026-05-10 12:20:00",
            "message": "High/Low game over",
            "sessionId": "s2", "finalScore": 5
        })
    ]
    
    with open(log_file, "w") as f:
        for line in log_lines:
            f.write(line + "\n")
            
    # Mock LOG_DIR for the parser call
    import backend.utils.stats_parser as parser
    original_log_dir = parser.LOG_DIR
    parser.LOG_DIR = str(tmp_path)
    
    try:
        stats = get_global_stats()
        
        assert stats["total_games_played"] == 2
        assert stats["unique_sessions_count"] == 2
        assert stats["modes"]["classic"]["games"] == 1
        assert stats["modes"]["classic"]["avg_score"] == 500.0
        assert stats["modes"]["highlow"]["avg_score"] == 5.0
        assert len(stats["daily_activity"]) == 1
        assert stats["daily_activity"][0]["day"] == "2026-05-10"
    finally:
        parser.LOG_DIR = original_log_dir
