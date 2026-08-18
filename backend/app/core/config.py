from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path


ROOT_DIR = Path(__file__).resolve().parents[3]


def load_dotenv(path: Path | None = None) -> None:
    env_path = path or ROOT_DIR / ".env"
    if not env_path.exists():
        return
    for raw_line in env_path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        os.environ.setdefault(key.strip(), value.strip().strip('"'))


@dataclass(frozen=True)
class Settings:
    brightdata_api_key: str
    database_url: str
    demo_mode: bool
    root_dir: Path


def get_settings() -> Settings:
    load_dotenv()
    return Settings(
        brightdata_api_key=os.getenv("BRIGHTDATA_API_KEY", ""),
        database_url=os.getenv("DATABASE_URL", "data/demo.db"),
        demo_mode=os.getenv("DEMO_MODE", "true").lower() in {"1", "true", "yes"},
        root_dir=ROOT_DIR,
    )

