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
        if isinstance(payload, list):
            return payload
        if isinstance(payload, dict):
            data = payload.get("data") or payload.get("records") or payload.get("result") or []
            return data if isinstance(data, list) else [data]
        return []

    def heal_scraper(self, collector_id: str, prompt: str, url: str) -> dict[str, Any]:
        return self._run(["scraper", "heal", collector_id, prompt, "--url", url, "--pretty"])

    def approve_scraper(self, collector_id: str, url: str) -> dict[str, Any]:
        return self._run(["scraper", "approve", collector_id, "--url", url, "--pretty"])

    def _run(self, args: list[str]) -> dict[str, Any] | list[Any]:
        env = os.environ.copy()
        if self.api_key:
            env["BRIGHTDATA_API_KEY"] = self.api_key
        completed = subprocess.run(
            [self.command, *args],
            check=False,
            capture_output=True,
            text=True,
            env=env,
        )
        if completed.returncode != 0:
            raise RuntimeError(completed.stderr.strip() or completed.stdout.strip())
        output = completed.stdout.strip()
        if not output:
            return {}
        try:
            return json.loads(output)
        except json.JSONDecodeError:
            return {"raw": output}

