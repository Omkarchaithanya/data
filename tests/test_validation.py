from backend.app.core.models import Source
from backend.app.services.validation import validate_records


SOURCE = Source(
    id="canary_vendor",
    name="Canary Vendor",
    url="http://localhost",
    type="pricing",
    expected_fields=["model_name", "input_price", "output_price", "effective_date"],
)


def test_schema_validation_passes_valid_output():
    result = validate_records(
        SOURCE,
        [
            {
                "model_name": "GroundTruth Mini",
                "input_price": "$0.25",
                "output_price": "$1.00",
                "effective_date": "2026-08-17",
            }
        ],
    )

    assert result.valid is True
    assert result.row_count == 1
    assert result.null_rate == 0


def test_missing_required_fields_lower_validity():
    result = validate_records(SOURCE, [{"plan": "GroundTruth Mini"}])

    assert result.valid is False
    assert "model_name" in result.missing_fields
    assert result.null_rate > 0.25

