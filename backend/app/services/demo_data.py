from __future__ import annotations

from typing import Any


HEALTHY_CANARY = [
    {
        "model_name": "GroundTruth Mini",
        "input_price": "$0.25 / 1M tokens",
        "output_price": "$1.00 / 1M tokens",
        "effective_date": "2026-08-17",
    }
]

BROKEN_CANARY = [
    {
        "plan": "GroundTruth Mini",
        "in_cost": None,
        "out_cost": None,
        "effective_date": "2026-08-17",
    }
]

HEALED_CANARY = [
    {
        "model_name": "GroundTruth Mini",
        "input_price": "$0.29 / 1M tokens",
        "output_price": "$1.10 / 1M tokens",
        "effective_date": "2026-08-17",
    }
]

def demo_records(source_id: str, mode: str = "healthy") -> list[dict[str, Any]]:
    if source_id == "canary_vendor":
        if mode == "broken":
            return BROKEN_CANARY
        if mode == "healed":
            return HEALED_CANARY
        return HEALTHY_CANARY
    
    raise RuntimeError("this source requires DEMO_MODE=false and a real collector ID")
