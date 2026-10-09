import os
from pathlib import Path


def _load_dotenv(path: Path) -> None:
    """Load simple KEY=VALUE entries without adding a runtime dependency."""
    if not path.exists():
        return
    for line in path.read_text(encoding="utf-8").splitlines():
        entry = line.strip()
        if not entry or entry.startswith("#") or "=" not in entry:
            continue
        key, value = entry.split("=", 1)
        key = key.strip()
        value = value.strip().strip("\"'")
        if key and key not in os.environ:
            os.environ[key] = value


_load_dotenv(Path(__file__).resolve().parent.parent.parent / ".env")

# Base Paths
BASE_DIR = Path(__file__).resolve().parent.parent.parent
ML_DIR = BASE_DIR.parent / "ML"

# ML Artifact Paths
MODEL_PATH = ML_DIR / "mule_xgb_model.json"
FEATURE_COLUMNS_PATH = ML_DIR / "feature_columns.json"
METADATA_PATH = ML_DIR / "model_metadata.json"

# Hybrid Weighting
DEFAULT_ALPHA = 0.50  # 50% Rule Engine, 50% ML Model

# Operational Heuristics
RAPID_FORWARD_WINDOW_HOURS = 1.0  # 60 minutes
RAPID_FORWARD_BURST_SECONDS = 300  # 5 minutes for critical tier
DEFAULT_HOLDING_TIME_HOURS = 168.0  # 7 days baseline
MAX_LAYERING_DEPTH_CAP = 6

# Scoring Thresholds
CRITICAL_THRESHOLD = 75.0
HIGH_THRESHOLD = 50.0
MEDIUM_THRESHOLD = 25.0

# CORS Allowed Origins
CORS_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "*"
]

# OpenRouter is used only by the optional grounded investigation summarizer.
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "").strip()
OPENROUTER_MODEL = os.getenv(
    "OPENROUTER_MODEL",
    "meta-llama/llama-3.1-8b-instruct:free",
).strip()
OPENROUTER_BASE_URL = os.getenv(
    "OPENROUTER_BASE_URL",
    "https://openrouter.ai/api/v1",
).rstrip("/")
