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

    def create_scraper(self, url: str, field_prompt: str, max_retries: int | None = None) -> dict[str, Any]:
        args = ["scraper", "create", url, field_prompt]
        if max_retries is not None:
            args.extend(["--max-retries", str(max_retries)])
        return self._run(args)

    def run_scraper(self, collector_id: str, url: str, max_retries: int | None = None, sync: bool = True) -> list[dict[str, Any]]:
        args = ["scraper", "run", collector_id, url]
        if sync:
            args.append("--sync")
        if max_retries is not None:
            args.extend(["--max-retries", str(max_retries)])
            
        try:
            payload = self._run(args)
        except Exception as e:
            error_msg = str(e)
            if sync and "timeout" in error_msg.lower():
                # Fallback to async
                args.remove("--sync")
                payload = self._run(args)
            else:
                raise e
                
        return self._flatten_payload(payload)

    def _flatten_payload(self, data: Any) -> list[dict[str, Any]]:
        if isinstance(data, dict):
            data = data.get("data") or data.get("records") or data.get("result") or data
            
        data = data if isinstance(data, list) else [data]
        
        flat_records = []
        for rec in data:
            if not isinstance(rec, dict):
                if isinstance(rec, str) and "more item" in rec.lower():
                    continue
                flat_records.append(rec)
                continue
                
            list_fields = [k for k, v in rec.items() if isinstance(v, list)]
            if len(list_fields) == 1 and list_fields[0] not in ("errors", "missing_fields"):
                parent_data = {k: v for k, v in rec.items() if k != list_fields[0]}
                for nested_item in rec[list_fields[0]]:
                    if isinstance(nested_item, dict):
                        flat_records.append({**parent_data, **nested_item})
                    else:
                        flat_records.append({**parent_data, list_fields[0]: nested_item})
            else:
                flat_records.append(rec)
                
        for i in range(len(flat_records)):
            if isinstance(flat_records[i], dict):
                for k, v in flat_records[i].items():
                    if isinstance(v, dict):
                        if "value" in v and "currency" in v:
                            if v["currency"] == "USD":
                                flat_records[i][k] = f"${v['value']}"
                            else:
                                flat_records[i][k] = f"{v['value']} {v['currency']}"
                        elif "value" in v:
                            flat_records[i][k] = str(v["value"])
                        elif len(v) == 1:
                            flat_records[i][k] = str(list(v.values())[0])
                            
        return flat_records

    def heal_scraper(self, collector_id: str, prompt: str, url: str, max_retries: int | None = None) -> dict[str, Any]:
        args = ["scraper", "heal", collector_id, prompt, "--url", url]
        if max_retries is not None:
            args.extend(["--max-retries", str(max_retries)])
        payload = self._run(args)
        if "preview_result" in payload and isinstance(payload["preview_result"], list):
            payload["preview_result"] = self._flatten_payload(payload["preview_result"])
        return payload

    def approve_scraper(self, collector_id: str, url: str) -> dict[str, Any]:
        return self._run(["scraper", "approve", collector_id, "--url", url])

    def reject_scraper(self, collector_id: str, url: str) -> dict[str, Any]:
        return self._run(["scraper", "approve", collector_id, "--reject", "--url", url])

    def get_budget(self, zone: str | None = None) -> dict[str, Any]:
        env = os.environ.copy()
        if self.api_key:
            env["BRIGHTDATA_API_KEY"] = self.api_key
        
        args = [self.command, "budget"]
        if zone:
            args.extend(["zone", zone])
        args.append("--json")
        
        completed = subprocess.run(
            args,
            check=False,
            capture_output=True,
            text=True,
            encoding="utf-8",
            env=env,
            shell=(os.name == 'nt')
        )

        output = completed.stdout.strip()
        err_output = completed.stderr.strip()

        if completed.returncode != 0:
            raise Exception(f"BrightData CLI failed: {err_output or output}")

        try:
            return json.loads(output)
        except json.JSONDecodeError:
            raise Exception(f"Failed to parse JSON from CLI output: {output}")

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
                    "Bright Data is finishing a previous heal job (rate-limited to 3 concurrent jobs per account) — this clears automatically, usually within 1-2 minutes."
                )
            if "Hit AI-Flow concurrent-job cap (429)" in err:
                raise RuntimeError(
                    "Hit AI-Flow concurrent-job cap (429). Bright Data is retrying, but you can force refresh if needed."
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

