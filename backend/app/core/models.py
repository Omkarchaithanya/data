from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any


def utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


@dataclass(frozen=True)
class Source:
    id: str
    name: str
    url: str
    type: str
    expected_fields: list[str]
    weight: float = 1.0
    sla_hours: int = 24
    collector_id_env: str | None = None
    collector_id: str | None = None


@dataclass
class ValidationResult:
    valid: bool
    row_count: int
    missing_fields: list[str] = field(default_factory=list)
    null_fields: dict[str, int] = field(default_factory=dict)
    null_rate: float = 0.0
    errors: list[str] = field(default_factory=list)


@dataclass
class DriftResult:
    drifted: bool
    structural: bool
    semantic: bool
    changed_fields: list[str] = field(default_factory=list)
    similarity: float = 1.0
    content_hash: str = ""
    previous_hash: str | None = None
    reasons: list[str] = field(default_factory=list)


@dataclass
class RunResult:
    source_id: str
    timestamp: str
    records: list[dict[str, Any]]
    validation: ValidationResult
    drift: DriftResult
    health_score: int
    raw_output_path: str | None = None


@dataclass
class HealResult:
    source_id: str
    timestamp: str
    prompt: str
    status: str
    preview_result: list[dict[str, Any]]
    validation: ValidationResult
    approval_status: str
    collector_id: str | None = None
    next_step: str | None = None

