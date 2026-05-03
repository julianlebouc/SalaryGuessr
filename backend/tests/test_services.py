import pytest
from unittest.mock import patch, MagicMock
from backend.services.france_travail import get_access_token, fetch_offers_from_page
from backend.services.offer_pool import build_offer_pool, get_random_job, get_pool_size

@patch("requests.post")
def test_get_access_token_success(mock_post):
    """Test successful token retrieval."""
    mock_post.return_value.status_code = 200
    mock_post.return_value.json.return_value = {
        "access_token": "mock_token_123",
        "expires_in": 3600
    }
    
    # Force refresh to ignore any existing cache
    token = get_access_token(force_refresh=True)
    assert token == "mock_token_123"
    assert mock_post.called

@patch("requests.post")
def test_get_access_token_failure(mock_post):
    """Test token retrieval failure."""
    mock_post.side_effect = Exception("Network error")
    with pytest.raises(Exception):
        get_access_token(force_refresh=True)

@patch("backend.services.france_travail.get_access_token")
@patch("requests.get")
def test_fetch_offers_success(mock_get, mock_token):
    """Test successful offers fetching."""
    mock_token.return_value = "fake_token"
    mock_get.return_value.status_code = 200
    mock_get.return_value.json.return_value = {
        "resultats": [{"id": "job1"}, {"id": "job2"}]
    }
    
    offers = fetch_offers_from_page(0)
    assert len(offers) == 2
    assert offers[0]["id"] == "job1"

@patch("backend.services.france_travail.get_access_token")
@patch("requests.get")
def test_fetch_offers_401_retry(mock_get, mock_token):
    """Test automatic token refresh on 401 Unauthorized."""
    mock_token.return_value = "expired_token"
    
    # First call returns 401, second returns 200
    mock_get.side_effect = [
        MagicMock(status_code=401),
        MagicMock(status_code=200, json=lambda: {"resultats": [{"id": "new_job"}]})
    ]
    
    offers = fetch_offers_from_page(0)
    assert len(offers) == 1
    assert offers[0]["id"] == "new_job"
    assert mock_token.call_count >= 2

@patch("backend.services.offer_pool.fetch_offers_from_page")
@patch("backend.services.offer_pool.parse_salary")
def test_build_offer_pool(mock_parse, mock_fetch):
    """Test building the offer pool with valid and invalid salaries."""
    mock_fetch.return_value = [
        {"id": "j1", "salaire": {"libelle": "3000"}},
        {"id": "j2", "salaire": {"libelle": "None"}},
    ]
    # Mock parse_salary to return 3000 for the first, None for the second
    mock_parse.side_effect = [3000.0, None]
    
    from backend.services.offer_pool import OFFER_POOL
    OFFER_POOL.clear()
    
    build_offer_pool(target_size=1)
    
    assert get_pool_size() == 1
    from backend.services.offer_pool import get_normalized_job
    job = get_normalized_job()
    assert job["id"] == "j1"
    assert job["salary_real"] == 3000.0
