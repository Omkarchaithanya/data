from __future__ import annotations

import json
import sqlite3
from dataclasses import asdict, is_dataclass
from pathlib import Path
from typing import Any

from backend.app.core.config import ROOT_DIR


def _json_default(value: Any) -> Any:
    if is_dataclass(value):
        return asdict(value)
    raise TypeError(f"Cannot serialize {type(value)!r}")


class EventStore:
    def __init__(self, database_url: str = "data/demo.db") -> None:
        self.path = database_url
        if database_url != ":memory:":
            db_path = Path(database_url)
            if not db_path.is_absolute():
                db_path = ROOT_DIR / db_path
            db_path.parent.mkdir(parents=True, exist_ok=True)
            self.path = str(db_path)
        self._init()

    def _init(self) -> None:
        with sqlite3.connect(self.path) as conn:
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS events (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    source_id TEXT NOT NULL,
                    kind TEXT NOT NULL,
                    timestamp TEXT NOT NULL,
                    payload TEXT NOT NULL
                )
                """
            )

    def append(self, source_id: str, kind: str, timestamp: str, payload: Any) -> None:
        serialized = json.dumps(payload, default=_json_default, ensure_ascii=True)
        with sqlite3.connect(self.path) as conn:
            conn.execute(
                "INSERT INTO events (source_id, kind, timestamp, payload) VALUES (?, ?, ?, ?)",
                (source_id, kind, timestamp, serialized),
            )

    def list_events(self, limit: int = 100) -> list[dict[str, Any]]:
        with sqlite3.connect(self.path) as conn:
            rows = conn.execute(
                "SELECT id, source_id, kind, timestamp, payload FROM events ORDER BY id DESC LIMIT ?",
                (limit,),
            ).fetchall()
        return [
            {
                "id": row[0],
                "source_id": row[1],
                "kind": row[2],
                "timestamp": row[3],
                "payload": json.loads(row[4]),
            }
            for row in rows
        ]

    def latest_records(self, source_id: str) -> list[dict[str, Any]] | None:
        with sqlite3.connect(self.path) as conn:
            row = conn.execute(
                """
                SELECT payload FROM events
                WHERE source_id = ? AND kind = 'run'
                ORDER BY id DESC LIMIT 1
                """,
                (source_id,),
            ).fetchone()
        if not row:
            return None
        payload = json.loads(row[0])
        return payload.get("records")
