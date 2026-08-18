import pytest
from backend.app.services.demo_data import demo_records

def test_demo_records_canary_vendor():
    healthy = demo_records("canary_vendor")
    assert len(healthy) > 0
    assert "model_name" in healthy[0]

def test_demo_records_non_canary_raises():
    with pytest.raises(RuntimeError, match="this source requires DEMO_MODE=false and a real collector ID"):
        demo_records("openai_pricing")
        
    with pytest.raises(RuntimeError, match="this source requires DEMO_MODE=false and a real collector ID"):
        demo_records("unknown_source_id")
