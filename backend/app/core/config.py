import os
from pathlib import Path
import yaml

BASE_DIR = Path(__file__).resolve().parent.parent.parent
CONFIG_PATH = BASE_DIR / "config.yaml"

def load_config():
    if CONFIG_PATH.exists():
        with open(CONFIG_PATH, "r") as f:
            return yaml.safe_load(f)
    return {}

CONFIG = load_config()

DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{BASE_DIR / 'skill_sutra.db'}")
SECRET_KEY = os.getenv("SECRET_KEY", "skill-sutra-hackathon-secret-key-2026")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24
