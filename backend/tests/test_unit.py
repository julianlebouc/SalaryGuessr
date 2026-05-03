import pytest
from backend.services.salary_parser import parse_salary
from backend.services.text_cleaner import clean_html

def test_salary_parser_annual():
    """Test annual salary parsing."""
    assert parse_salary("36000 EUR par an") == 3000.0
    assert parse_salary("24000 - 36000") == 2500.0  # Average 30000 / 12

def test_salary_parser_monthly():
    """Test monthly salary parsing."""
    assert parse_salary("2000 EUR par mois") == 2000.0
    assert parse_salary("1500-2500 par mois") == 2000.0

def test_salary_parser_heuristic():
    """Test heuristic for cases where period is not specified."""
    # High value should be assumed annual
    assert parse_salary("48000") == 4000.0
    # Low value should be assumed monthly
    assert parse_salary("2500") == 2500.0

def test_salary_parser_invalid():
    """Test invalid or empty inputs."""
    assert parse_salary("") is None
    assert parse_salary("Negotiable") is None
    assert parse_salary("Salary: 100") is None # Below minimum filter (500)

def test_clean_html():
    """Test HTML cleaning utility."""
    assert clean_html("<p>Hello <b>World</b></p>") == "Hello World"
    assert clean_html("Simple text") == "Simple text"
    assert clean_html("") == ""
    assert clean_html(None) == ""
