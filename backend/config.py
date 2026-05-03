import os
from dotenv import load_dotenv

load_dotenv()

# ==========================================================
# APPLICATION CONFIGURATION
# ==========================================================
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")
DEBUG = os.getenv("DEBUG", "False").lower() == "true"
BACKEND_PORT = int(os.getenv("BACKEND_PORT", 8000))

# ==========================================================
# CORS CONFIGURATION
# ==========================================================
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")
CORS_ORIGINS = [origin.strip() for origin in CORS_ORIGINS]

# ==========================================================
# BATTLE ROYALE CONFIGURATION
# ==========================================================
BR_MIN_PLAYERS = 2
BR_MAX_PLAYERS = 50
BR_ROUND_DURATION = 30
BR_PAUSE_BETWEEN_ROUNDS = 10000

# ==========================================================
# FRANCE TRAVAIL API CONFIG
# ==========================================================
FRANCE_TRAVAIL_CLIENT_ID = os.getenv("FRANCE_TRAVAIL_CLIENT_ID")
FRANCE_TRAVAIL_CLIENT_SECRET = os.getenv("FRANCE_TRAVAIL_CLIENT_SECRET")
TOKEN_URL = "https://entreprise.francetravail.fr/connexion/oauth2/access_token?realm=/partenaire"
SEARCH_URL = "https://api.francetravail.io/partenaire/offresdemploi/v2/offres/search"

# ==========================================================
# POOL CONFIGURATION
# ==========================================================
POOL_TARGET_SIZE = 500
POOL_MIN_SIZE = 400
PLAYED_IDS_MAXLEN = 1000

if not FRANCE_TRAVAIL_CLIENT_ID or not FRANCE_TRAVAIL_CLIENT_SECRET:
    raise ValueError("FRANCE_TRAVAIL_CLIENT_ID et FRANCE_TRAVAIL_CLIENT_SECRET requis")