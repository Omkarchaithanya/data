from __future__ import annotations

import json
import os
from pathlib import Path

from backend.app.core.config import ROOT_DIR
from backend.app.core.models import Source


def load_sources(path: Path | None = None) -> list[Source]:
    registry_path = path or ROOT_DIR / "sources.yml"
    data = json.loads(registry_path.read_text(encoding="utf-8"))
    sources: list[Source] = []
    for item in data:
        collector_id = os.getenv(item.get("collector_id_env", "") or "")
        sources.append(Source(**item, collector_id=collector_id or None))
    return sources


def get_source(source_id: str, path: Path | None = None) -> Source:
    for source in load_sources(path):
        if source.id == source_id:
            return source
    raise KeyError(f"Unknown source: {source_id}")

