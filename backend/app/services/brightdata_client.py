from __future__ import annotations

import json
import os
import subprocess
from dataclasses import dataclass
from typing import Any


@dataclass
class BrightDataClient:
    api_key: str = ""
    command: str = "brightdata"

    def create_scraper(self, url: str, field_prompt: str) -> dict[str, Any]:
        return self._run(["scraper", "create", url, field_prompt, "--pretty"])

    def run_scraper(self, collector_id: str, url: str) -> list[dict[str, Any]]:
        payload = self._run(["scraper", "run", collector_id, url, "--pretty"])
        if isinstance(payload, dict):
            payload = payload.get("data") or payload.get("records") or payload.get("result") or payload
            
        data = payload if isinstance(payload, list) else [payload]
        
        flat_records = []
        for rec in data:
            if isinstance(rec, dict):
                list_fields = [k for k, v in rec.items() if isinstance(v, list)]
                if len(list_fields) == 1 and list_fields[0] not in ("errors", "missing_fields"):
                    flat_records.extend(rec[list_fields[0]])
                else:
                    flat_records.append(rec)
            else:
                flat_records.append(rec)
        return flat_records

    def heal_scraper(self, collector_id: str, prompt: str, url: str) -> dict[str, Any]:
        return self._run(["scraper", "heal", collector_id, prompt, "--url", url, "--pretty"])

    def approve_scraper(self, collector_id: str, url: str) -> dict[str, Any]:
        return self._run(["scraper", "approve", collector_id, "--url", url, "--pretty"])

    def reject_scraper(self, collector_id: str, url: str) -> dict[str, Any]:
        return self._run(["scraper", "approve", collector_id, "--reject", "--url", url, "--pretty"])

    def get_budget(self) -> dict[str, Any]:
        env = os.environ.copy()
        if self.api_key:
            env["BRIGHTDATA_API_KEY"] = self.api_key
        completed = subprocess.run(
            [self.command, "budget", "--json"],
            check=False,
            capture_output=True,
            text=True,
            encoding="utf-8",
            env=env,
            shell=(os.name == 'nt')
        )
        if completed.returncode != 0:
            return {"balance": "Unknown (API key lacks billing permission)"}
            
        output = completed.stdout.strip()
        try:
            return json.loads(output)
        except json.JSONDecodeError:
            return {"balance": "Unknown (Could not parse budget)"}

    def _run(self, args: list[str]) -> dict[str, Any] | list[Any]:
        env = os.environ.copy()
        if self.api_key:
            env["BRIGHTDATA_API_KEY"] = self.api_key
        completed = subprocess.run(
            [self.command, *args],
            check=False,
            capture_output=True,
            text=True,
            encoding="utf-8",
            env=env,
            shell=(os.name == 'nt')
        )
        if completed.returncode != 0:
            err = f"{completed.stdout}\n{completed.stderr}".strip()
            if "status: 409" in err.lower() or "another refactor job is still in progress" in err.lower():
                raise RuntimeError(
                    "A heal operation is already in progress on Bright Data for this collector. "
                    "Please wait a few minutes for it to complete."
                )
            if "Assertion failed:" in err:
                err = err.split("Assertion failed:")[0].strip()
            raise RuntimeError(err or "Bright Data CLI command failed unexpectedly.")
        output = completed.stdout.strip()
        if not output:
            return {}
        try:
            return json.loads(output)
        except json.JSONDecodeError:
            return {"raw": output}

