from backend.app.core.models import Source
from backend.app.services.drift import detect_drift
from backend.app.services.prompt_builder import build_heal_prompt
from backend.app.services.validation import validate_records


def test_heal_prompt_includes_context():
    source = Source(
        id="canary_vendor",
        name="Canary Vendor",
        url="http://localhost/canary/v2",
        type="pricing",
        expected_fields=["model_name", "input_price", "output_price", "effective_date"],
    )
    records = [{"plan": "GroundTruth Mini", "in_cost": None}]
    validation = validate_records(source, records)
    drift = detect_drift(source, records, validation)
    prompt = build_heal_prompt(source, validation, drift)

    assert "http://localhost/canary/v2" in prompt
    assert "model_name" in prompt
    assert "input_price" in prompt
    assert "Preserve field names exactly" in prompt

