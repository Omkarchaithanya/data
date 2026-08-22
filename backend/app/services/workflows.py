from __future__ import annotations

from dataclasses import asdict

from backend.app.core.models import HealResult, RunResult, utc_now_iso
from backend.app.services.brightdata_client import BrightDataClient
from backend.app.services.demo_data import demo_records
from backend.app.services.drift import detect_drift
from backend.app.services.prompt_builder import build_heal_prompt
from backend.app.services.scoring import grounding_health_score
from backend.app.services.source_registry import get_source, load_sources
from backend.app.services.storage import EventStore
from backend.app.services.validation import validate_records


class GroundTruthService:
    def __init__(self, brightdata: BrightDataClient, store: EventStore, demo_mode: bool = True) -> None:
        self.brightdata = brightdata
        self.store = store
        self.demo_mode = demo_mode

    def list_sources(self) -> list[dict]:
        return [asdict(source) for source in load_sources()]

    def run_source(self, source_id: str, mode: str = "healthy", max_retries: int | None = None) -> RunResult:
        source = get_source(source_id)
        previous = self.store.latest_records(source_id)
        if self.demo_mode or source_id == "canary_vendor":
            records = demo_records(source_id, mode)
        elif not source.collector_id:
            raise RuntimeError(
                f"Real mode is enabled, but {source.id} has no collector ID. "
                f"Set {source.collector_id_env} in .env."
            )
        else:
            records = self.brightdata.run_scraper(source.collector_id, source.url, max_retries=max_retries)
        validation = validate_records(source, records)
        drift = detect_drift(source, records, validation, previous)
        score = grounding_health_score(source, validation, drift)
        result = RunResult(source.id, utc_now_iso(), records, validation, drift, score)
        self.store.append(source.id, "run", result.timestamp, asdict(result))
        return result

    def detect_source_drift(self, source_id: str, mode: str = "broken", max_retries: int | None = None) -> RunResult:
        source = get_source(source_id)
        if self.demo_mode or source_id == "canary_vendor":
            return self.run_source(source_id, mode=mode, max_retries=max_retries)
        
        # Real mode drift simulation: fetch real data, then mutate it to trigger schema failure
        if not source.collector_id:
            raise RuntimeError(f"Real mode is enabled, but {source.id} has no collector ID. Set {source.collector_id_env} in .env.")
            
        real_records = self.brightdata.run_scraper(source.collector_id, source.url, max_retries=max_retries)
        broken_records = []
        for r in real_records:
            br = dict(r)
            if source.expected_fields:
                field_to_break = source.expected_fields[0]
                br.pop(field_to_break, None)
                br[f"broken_{field_to_break}"] = "drift_simulated"
            broken_records.append(br)
            
        previous = self.store.latest_records(source_id)
        validation = validate_records(source, broken_records)
        drift = detect_drift(source, broken_records, validation, previous)
        score = grounding_health_score(source, validation, drift)
        result = RunResult(source.id, utc_now_iso(), broken_records, validation, drift, score)
        self.store.append(source.id, "run", result.timestamp, asdict(result))
        return result

    def heal_source(self, source_id: str, max_retries: int | None = None) -> HealResult:
        source = get_source(source_id)
        records = self.store.latest_records(source_id) or []
        validation = validate_records(source, records)
        drift = detect_drift(source, records, validation)
        prompt = build_heal_prompt(source, validation, drift)

        if self.demo_mode or source_id == "canary_vendor":
            import time
            time.sleep(2)  # Simulate network latency
            preview = demo_records(source_id, "healed")
            status = "awaiting_approval"
            collector_id = source.collector_id or f"demo_{source.id}"
            next_step = "Run `bdata scraper approve` to accept changes."
        elif not source.collector_id:
            raise RuntimeError(
                f"Real mode is enabled, but {source.id} has no collector ID. "
                f"Set {source.collector_id_env} in .env."
            )
        else:
            payload = self.brightdata.heal_scraper(source.collector_id, prompt, source.url, max_retries=max_retries)
            preview = payload.get("preview_result", [])
            status = payload.get("status", "awaiting_approval")
            collector_id = payload.get("collector_id", source.collector_id)
            next_step = payload.get("next_step")

        preview_validation = validate_records(source, preview)
        approval_status = "ready" if preview_validation.valid else "blocked"
        result = HealResult(
            source.id,
            utc_now_iso(),
            prompt,
            status,
            preview,
            preview_validation,
            approval_status,
            collector_id,
            next_step,
        )
        self.store.append(source.id, "heal", result.timestamp, asdict(result))
        return result

    def scrape_source(self, source_id: str, max_retries: int | None = None) -> dict:
        source = get_source(source_id)
        if not source.collector_id:
            raise RuntimeError(f"Source {source_id} has no collector configured.")
        return self.brightdata.run_scraper(source.collector_id, source.url, max_retries=max_retries)

    def approve_heal(self, source_id: str) -> dict:
        source = get_source(source_id)
        timestamp = utc_now_iso()
        if self.demo_mode or source_id == "canary_vendor":
            payload = {"status": "approved", "collector_id": source.collector_id or f"demo_{source.id}"}
        elif not source.collector_id:
            raise RuntimeError(
                f"Real mode is enabled, but {source.id} has no collector ID. "
                f"Set {source.collector_id_env} in .env."
            )
        else:
            payload = self.brightdata.approve_scraper(source.collector_id, source.url)
        self.store.append(source.id, "approve", timestamp, payload)
        return {"timestamp": timestamp, **payload}

    def reject_heal(self, source_id: str) -> dict:
        source = get_source(source_id)
        timestamp = utc_now_iso()
        if self.demo_mode or source_id == "canary_vendor":
            payload = {"status": "rejected", "collector_id": source.collector_id or f"demo_{source.id}"}
        elif not source.collector_id:
            raise RuntimeError(
                f"Real mode is enabled, but {source.id} has no collector ID. "
                f"Set {source.collector_id_env} in .env."
            )
        else:
            payload = self.brightdata.reject_scraper(source.collector_id, source.url)
        self.store.append(source.id, "reject", timestamp, payload)
        return {"timestamp": timestamp, **payload}

    def get_budget(self, source_id: str | None = None) -> dict:
        return self.brightdata.get_budget(zone=source_id)

    def export_data(self) -> dict:
        sources = load_sources()
        export = []
        for s in sources:
            records = self.store.latest_records(s.id)
            if records:
                export.append({
                    "source_id": s.id,
                    "url": s.url,
                    "timestamp": utc_now_iso(),
                    "records": records
                })
        return {"evidence": export}

    def export_trust_ledger(self) -> dict:
        sources = load_sources()
        ledger = []
        for s in sources:
            run = self.store.latest_successful_run(s.id)
            if run:
                records = run.get("records", [])
                score = run.get("health_score", 100)
                validation = run.get("validation", {})
                status = "blocked" if not validation.get("valid") else ("at-risk" if score < 90 else "grounded")
                verified_at = run.get("timestamp")
                for r in records:
                    identity = r.get("model") or r.get("title") or r.get("name") or "Item"
                    for k, v in r.items():
                        if k in ("model", "title", "name", "link", "url", "date", "input"):
                            continue
                        if v is None or str(v).strip() == "":
                            continue
                        claim_str = f"{identity} {k.replace('_', ' ')}: {v}"
                        ledger.append({
                            "claim": claim_str,
                            "source_id": s.id,
                            "source_url": s.url,
                            "verified_at": verified_at,
                            "extractor_version": s.collector_id or "demo",
                            "confidence_score": score,
                            "status": status,
                            "content_hash": run.get("drift", {}).get("content_hash"),
                            "previous_hash": run.get("drift", {}).get("previous_hash"),
                            "verification_hash": str(run.get("drift", {}).get("content_hash", ""))[:12] if run.get("drift", {}).get("content_hash") else None
                        })
        return {"trust_ledger": ledger}
