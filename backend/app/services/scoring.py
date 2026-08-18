from __future__ import annotations

from datetime import datetime, timezone

from backend.app.core.models import DriftResult, Source, ValidationResult


def grounding_health_score(
    source: Source,
    validation: ValidationResult,
    drift: DriftResult,
    last_run_at: str | None = None,
) -> int:
    score = 100.0
    if validation.row_count == 0:
        score -= 35
    score -= min(validation.null_rate * 45, 45)
    score -= len(validation.missing_fields) * 8
    if drift.structural:
        score -= 18
    if drift.semantic:
        score -= max(5, (1 - drift.similarity) * 30)
    if last_run_at and _is_stale(last_run_at, source.sla_hours):
        score -= 10
    score *= max(0.5, min(source.weight, 1.0))
    return max(0, min(100, round(score)))


def _is_stale(timestamp: str, sla_hours: int) -> bool:
    parsed = datetime.fromisoformat(timestamp.replace("Z", "+00:00"))
    age_hours = (datetime.now(timezone.utc) - parsed).total_seconds() / 3600
    return age_hours > sla_hours

