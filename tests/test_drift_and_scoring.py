from backend.app.core.models import Source
from backend.app.services.drift import detect_drift
from backend.app.services.scoring import grounding_health_score
from backend.app.services.validation import validate_records


SOURCE = Source(
    id="canary_vendor",
    name="Canary Vendor",
    url="http://localhost",
    type="pricing",
    expected_fields=["model_name", "input_price", "output_price", "effective_date"],
)


def test_empty_output_triggers_structural_drift():
    validation = validate_records(SOURCE, [])
    drift = detect_drift(SOURCE, [], validation)
    score = grounding_health_score(SOURCE, validation, drift)

    assert drift.drifted is True
    assert drift.structural is True
    assert score < 50


def test_semantic_change_detected_against_prior_snapshot():
    previous = [{"model_name": "GroundTruth Mini", "input_price": "$0.25", "output_price": "$1.00", "effective_date": "2026-08-17"}]
    current = [{"model_name": "GroundTruth Mini", "input_price": "$0.29", "output_price": "$1.10", "effective_date": "2026-08-17"}]
    validation = validate_records(SOURCE, current)
    drift = detect_drift(SOURCE, current, validation, previous)

    assert drift.semantic is True
    assert any(f["field"] == "input_price" for f in drift.changed_fields)


def test_healthy_source_achieves_perfect_score_uncapped_by_weight():
    source_with_low_weight = Source(
        id="low_weight",
        name="Low Weight",
        url="http://localhost",
        type="pricing",
        expected_fields=["field1"],
        weight=0.6,
    )
    records = [{"field1": "value"}]
    validation = validate_records(source_with_low_weight, records)
    drift = detect_drift(source_with_low_weight, records, validation)
    score = grounding_health_score(source_with_low_weight, validation, drift)

    # Even with a 0.6 weight, a completely healthy payload should score 100 on its own metrics
    assert score == 100

