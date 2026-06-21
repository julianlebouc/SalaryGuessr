import os
import json
import pytest
from fastapi.testclient import TestClient
from backend.main import app
import backend.utils.leaderboard as leaderboard
from backend.utils.sessions import create_session, finalize_session, get_session, record_round_score, increment_streak

client = TestClient(app)


@pytest.fixture
def temp_leaderboard(tmp_path, monkeypatch):
    """Fixture to isolate the leaderboard JSON file in a temporary directory during tests."""
    temp_file = os.path.join(tmp_path, "leaderboard.json")
    monkeypatch.setattr(leaderboard, "LEADERBOARD_PATH", temp_file)
    return temp_file


def test_empty_leaderboard_load(temp_leaderboard):
    """Test loading from a non-existent file returns the default structure."""
    data = leaderboard.load_leaderboard()
    assert data == {"classic": [], "highlow": [], "ordering": []}


def test_leaderboard_save_and_load(temp_leaderboard):
    """Test saving and loading leaderboard data."""
    test_data = {
        "classic": [
            {"pseudo": "Alice", "score": 90.0, "date": "2026-05-20"},
            {"pseudo": "Bob", "score": 80.0, "date": "2026-05-20"}
        ],
        "highlow": [],
        "ordering": []
    }
    
    assert leaderboard.save_leaderboard(test_data) is True
    loaded = leaderboard.load_leaderboard()
    assert loaded["classic"] == test_data["classic"]
    assert loaded["highlow"] == []
    assert loaded["ordering"] == []


def test_corrupt_leaderboard_load(temp_leaderboard):
    """Test that a corrupt JSON file resolves gracefully without throwing exceptions."""
    with open(temp_leaderboard, "w", encoding="utf-8") as f:
        f.write("NOT JSON DATA")
        
    data = leaderboard.load_leaderboard()
    assert data == {"classic": [], "highlow": [], "ordering": []}


def test_is_top_score(temp_leaderboard):
    """Test is_top_score logic under empty and populated states."""
    # Under empty state, any positive score is a top score
    assert leaderboard.is_top_score("classic", 1.0) is True
    assert leaderboard.is_top_score("classic", 0.0) is False
    
    # Populate the top 3
    leaderboard.submit_score("classic", "P1", 90.0)
    leaderboard.submit_score("classic", "P2", 80.0)
    leaderboard.submit_score("classic", "P3", 70.0)
    
    # Check bounds
    assert leaderboard.is_top_score("classic", 71.0) is True  # Beats P3
    assert leaderboard.is_top_score("classic", 70.0) is False # Equal to P3 (must be strictly greater)
    assert leaderboard.is_top_score("classic", 69.0) is False # Below P3


def test_submit_score_truncates_and_sorts(temp_leaderboard):
    """Test that submit_score keeps only the top 3 and sorts them descending."""
    leaderboard.submit_score("classic", "PlayerA", 50.0)
    leaderboard.submit_score("classic", "PlayerB", 90.0)
    leaderboard.submit_score("classic", "PlayerC", 75.0)
    
    # Should sort: B (90), C (75), A (50)
    top_3 = leaderboard.load_leaderboard()["classic"]
    assert len(top_3) == 3
    assert top_3[0]["pseudo"] == "PlayerB"
    assert top_3[1]["pseudo"] == "PlayerC"
    assert top_3[2]["pseudo"] == "PlayerA"
    
    # Submit a fourth score
    leaderboard.submit_score("classic", "PlayerD", 80.0)
    
    # Should drop PlayerA (50) and be: B (90), D (80), C (75)
    top_3 = leaderboard.load_leaderboard()["classic"]
    assert len(top_3) == 3
    assert top_3[0]["pseudo"] == "PlayerB"
    assert top_3[1]["pseudo"] == "PlayerD"
    assert top_3[2]["pseudo"] == "PlayerC"
    assert "PlayerA" not in [entry["pseudo"] for entry in top_3]


def test_api_get_leaderboard(temp_leaderboard):
    """Test the GET /api/leaderboard endpoint."""
    leaderboard.submit_score("classic", "P1", 90.0)
    leaderboard.submit_score("highlow", "H1", 10)
    
    response = client.get("/api/leaderboard")
    assert response.status_code == 200
    res_data = response.json()
    assert len(res_data["classic"]) == 1
    assert res_data["classic"][0]["pseudo"] == "P1"
    assert len(res_data["highlow"]) == 1
    assert res_data["highlow"][0]["pseudo"] == "H1"


def test_api_submit_leaderboard_success(temp_leaderboard):
    """Test successful submission of a high score through the API using session validation."""
    # Ensure there are scores that can be beaten
    leaderboard.submit_score("classic", "Filler", 10.0)
    
    # 1. Start a session
    token = create_session("classic")
    
    # 2. Add round scores (authoritative final score: 95.0)
    record_round_score(token, 90.0)
    record_round_score(token, 100.0)
    
    # 3. Finalize session
    res_over = client.post("/game_over", json={"session_token": token})
    assert res_over.status_code == 200
    assert res_over.json()["score"] == 95.0
    assert res_over.json()["is_top_3"] is True
    
    # 4. Submit to leaderboard
    res_submit = client.post("/api/leaderboard/submit", json={
        "session_token": token,
        "pseudo": "Hero"
    })
    
    assert res_submit.status_code == 200
    assert res_submit.json()["status"] == "success"
    
    # Verify persistence
    top_3 = leaderboard.load_leaderboard()["classic"]
    assert top_3[0]["pseudo"] == "Hero"
    assert top_3[0]["score"] == 95.0


def test_api_submit_leaderboard_replay_prevention(temp_leaderboard):
    """Test that a player cannot submit a score multiple times for the same session (Replay Protection)."""
    token = create_session("classic")
    record_round_score(token, 80.0)
    client.post("/game_over", json={"session_token": token})
    
    # First submit succeeds
    res1 = client.post("/api/leaderboard/submit", json={"session_token": token, "pseudo": "Winner"})
    assert res1.status_code == 200
    
    # Second submit with the same token fails
    res2 = client.post("/api/leaderboard/submit", json={"session_token": token, "pseudo": "Winner"})
    assert res2.status_code == 400
    assert "already been submitted" in res2.json()["detail"]


def test_api_submit_leaderboard_input_validation(temp_leaderboard):
    """Test robust validation of inputs (pessimistic cases for pseudo length, empty values, session status)."""
    # 1. Empty pseudo
    token1 = create_session("classic")
    record_round_score(token1, 80.0)
    client.post("/game_over", json={"session_token": token1})
    
    res1 = client.post("/api/leaderboard/submit", json={"session_token": token1, "pseudo": "   "})
    assert res1.status_code == 400
    
    # 2. Too long pseudo
    token2 = create_session("classic")
    record_round_score(token2, 80.0)
    client.post("/game_over", json={"session_token": token2})
    
    res2 = client.post("/api/leaderboard/submit", json={"session_token": token2, "pseudo": "A" * 16})
    assert res2.status_code == 400
    assert "limit" in res2.json()["detail"].lower()
    
    # 3. Not finalized session
    token3 = create_session("classic")
    res3 = client.post("/api/leaderboard/submit", json={"session_token": token3, "pseudo": "ValidName"})
    assert res3.status_code == 400
    assert "not completed" in res3.json()["detail"].lower()
    
    # 4. Low score that does not qualify for top 3
    # Populate top 3 with high scores
    leaderboard.submit_score("classic", "P1", 99.0)
    leaderboard.submit_score("classic", "P2", 98.0)
    leaderboard.submit_score("classic", "P3", 97.0)
    
    token4 = create_session("classic")
    record_round_score(token4, 50.0)
    client.post("/game_over", json={"session_token": token4})
    
    res4 = client.post("/api/leaderboard/submit", json={"session_token": token4, "pseudo": "LowScorer"})
    assert res4.status_code == 400
    assert "does not qualify" in res4.json()["detail"]
