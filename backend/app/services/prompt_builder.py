from __future__ import annotations

from backend.app.core.models import DriftResult, Source, ValidationResult


def build_heal_prompt(source: Source, validation: ValidationResult, drift: DriftResult) -> str:
    missing = ", ".join(validation.missing_fields) or "none"
    nulls = ", ".join(f"{field}={count}" for field, count in validation.null_fields.items()) or "none"
    reasons = " ".join(drift.reasons or validation.errors) or "Collector output failed validation."
    expected = ", ".join(source.expected_fields)
    prompt = (
        f"The scraper for {source.name} at {source.url} is returning invalid output. "
        f"Expected fields: {expected}. Missing fields: {missing}. Null counts: {nulls}. "
        f"Observed failure: {reasons} Preserve the current output schema and fix extraction "
        f"so every required field is populated from the current page."
    )
    return prompt[:1000]

