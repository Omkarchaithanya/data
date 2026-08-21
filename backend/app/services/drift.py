from __future__ import annotations

import hashlib
import json
from difflib import SequenceMatcher
from typing import Any

from backend.app.core.models import DriftResult, Source, ValidationResult


def normalize_records(records: list[dict[str, Any]]) -> str:
    return json.dumps(records, sort_keys=True, ensure_ascii=True, separators=(",", ":"))


def content_hash(records: list[dict[str, Any]]) -> str:
    return hashlib.sha256(normalize_records(records).encode("utf-8")).hexdigest()


def detect_drift(
    source: Source,
    records: list[dict[str, Any]],
    validation: ValidationResult,
    previous_records: list[dict[str, Any]] | None = None,
) -> DriftResult:
    current_hash = content_hash(records)
    previous_hash = content_hash(previous_records) if previous_records is not None else None
    structural = not validation.valid
    semantic = False
    similarity = 1.0
    reasons: list[str] = []
    changed_fields: list[dict[str, Any]] = []

    if structural:
        reasons.extend(validation.errors)
        for missing in validation.missing_fields:
            changed_fields.append({"field": missing, "old": "Present", "new": "Missing"})

    if previous_records is not None:
        previous_text = normalize_records(previous_records)
        current_text = normalize_records(records)
        similarity = SequenceMatcher(None, previous_text, current_text).ratio()
        changed_fields = _changed_fields(previous_records, records, source.expected_fields)
        semantic = current_hash != previous_hash and (similarity < 0.995 or bool(changed_fields))
        if semantic:
            reasons.append(f"Content changed from prior snapshot; similarity {similarity:.2f}.")

    return DriftResult(
        drifted=structural or semantic,
        structural=structural,
        semantic=semantic,
        changed_fields=changed_fields,
        similarity=round(similarity, 4),
        content_hash=current_hash,
        previous_hash=previous_hash,
        reasons=reasons,
    )


def _changed_fields(
    previous_records: list[dict[str, Any]],
    current_records: list[dict[str, Any]],
    fields: list[str],
) -> list[dict[str, Any]]:
    changed: list[dict[str, Any]] = []
    previous_first = previous_records[0] if previous_records else {}
    current_first = current_records[0] if current_records else {}
    for field in fields:
        old_val = previous_first.get(field)
        new_val = current_first.get(field)
        if old_val != new_val:
            changed.append({"field": field, "old": old_val, "new": new_val})
    return changed
