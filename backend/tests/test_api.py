import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock
from backend.main import app
from backend.utils.sessions import create_session

client = TestClient(app)

def test_read_root():
    """Test the root endpoint."""
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["message"] == "SalaryGuessr API running"

@patch("backend.main.get_normalized_job")
@patch("backend.main.get_pool_size")
@patch("backend.main.get_played_count")
def test_get_job(mock_get_played, mock_get_pool, mock_get_job):
    """Test the /job endpoint with mocked data."""
    # Setup mocks
    mock_get_job.return_value = {
        "id": "123",
        "title": "Développeur Python",
        "salary_real": 3500.0,
        "description": "Job description",
        "pool_remaining": 10,
        "already_played_pool_size": 5
    }
    mock_get_pool.return_value = 10
    mock_get_played.return_value = 5
    
    response = client.get("/job")
    
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == "123"
    assert data["salary_real"] == 3500.0
    assert data["pool_remaining"] == 10
    assert data["already_played_pool_size"] == 5

def test_stats():
    """Test the /stats endpoint."""
    with patch("backend.main.get_played_count", return_value=10), \
         patch("backend.main.get_pool_size", return_value=50):
        response = client.get("/stats")
        assert response.status_code == 200
        assert response.json()["played_count"] == 10
        assert response.json()["pool_size"] == 50


def test_session_start_ordering_mode():
    """Ordering mode should be accepted when creating a session."""
    response = client.post("/session/start", json={"mode": "ordering"})
    assert response.status_code == 200
    assert response.json().get("session_token")


@patch("backend.main.get_job_salary_data")
def test_validate_ordering_success(mock_get_salary):
    """Test successful validation for ordered salaries."""
    token = create_session("ordering")

    salary_map = {
        "a": {"value": 1800},
        "b": {"value": 2400},
        "c": {"value": 3200},
    }
    mock_get_salary.side_effect = lambda job_id: salary_map.get(job_id)

    response = client.post(
        "/validate/ordering",
        json={"session_token": token, "ordered_job_ids": ["a", "b", "c"]},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["correct"] is True
    assert data["round_size"] == 3
    assert data["next_round_size"] == 4
    assert data["best_score"] == 3


@patch("backend.main.get_job_salary_data")
def test_validate_ordering_wrong_order(mock_get_salary):
    """Test wrong ordering keeps best score unchanged and does not increment round size."""
    token = create_session("ordering")

    salary_map = {
        "a": {"value": 1800},
        "b": {"value": 2400},
        "c": {"value": 3200},
    }
    mock_get_salary.side_effect = lambda job_id: salary_map.get(job_id)

    response = client.post(
        "/validate/ordering",
        json={"session_token": token, "ordered_job_ids": ["c", "b", "a"]},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["correct"] is False
    assert data["round_size"] == 3
    assert data["next_round_size"] == 3
    assert data["best_score"] == 0

@patch("backend.main.ADMIN_SECRET_KEY", "test-secret-key")
@patch("backend.main.build_offer_pool")
@patch("backend.main.clear_played")
def test_reset(mock_clear, mock_build):
    """Test the /reset endpoint."""
    response = client.post("/reset", headers={"x-admin-key": "test-secret-key"})
    assert response.status_code == 200
    assert response.json()["message"] == "Full reset complete"
    assert mock_clear.called
    assert mock_build.called
