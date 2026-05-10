import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock
from backend.main import app

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

@patch("backend.main.build_offer_pool")
@patch("backend.main.clear_played")
def test_reset(mock_clear, mock_build):
    """Test the /reset endpoint."""
    response = client.post("/reset")
    assert response.status_code == 200
    assert response.json()["message"] == "Full reset complete"
    assert mock_clear.called
    assert mock_build.called
