from __future__ import annotations

from typing import Any

from backend.app.core.models import Source, ValidationResult


NULL_VALUES = {None, "", "undefined", "null", "N/A", "n/a"}


def validate_records(source: Source, records: list[dict[str, Any]]) -> ValidationResult:
    errors: list[str] = []
    if not records:
        return ValidationResult(
            valid=False,
            row_count=0,
            missing_fields=list(source.expected_fields),
            null_fields={field: 1 for field in source.expected_fields},
            null_rate=1.0,
            errors=["Collector returned no records."],
        )

    missing_fields: set[str] = set()
    null_fields = {field: 0 for field in source.expected_fields}
    total_checks = len(records) * len(source.expected_fields)
    null_checks = 0

    for record in records:
        for field in source.expected_fields:
            if field not in record:
                missing_fields.add(field)
                null_fields[field] += 1
                null_checks += 1
                continue
            value = record.get(field)
            if value in NULL_VALUES:
                null_fields[field] += 1
                null_checks += 1

    compact_nulls = {field: count for field, count in null_fields.items() if count > 0}
    null_rate = null_checks / total_checks if total_checks else 1.0

    if missing_fields:
        errors.append(f"Missing expected fields: {', '.join(sorted(missing_fields))}.")
    if null_rate > 0.25:
        errors.append(f"Null rate {null_rate:.0%} exceeds 25% threshold.")

    return ValidationResult(
        valid=not errors,
        row_count=len(records),
        missing_fields=sorted(missing_fields),
        null_fields=compact_nulls,
        null_rate=round(null_rate, 4),
        errors=errors,
    )

