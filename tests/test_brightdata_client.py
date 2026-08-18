from backend.app.services.brightdata_client import BrightDataClient


class Completed:
    returncode = 0
    stdout = '{"status":"awaiting_approval","preview_result":[{"model_name":"A"}]}'
    stderr = ""


def test_heal_command_shape(monkeypatch):
    calls = []

    def fake_run(command, **kwargs):
        calls.append(command)
        return Completed()

    monkeypatch.setattr("subprocess.run", fake_run)
    client = BrightDataClient(api_key="test", command="brightdata")
    result = client.heal_scraper("c_123", "Fix selector issues", "https://example.com")

    assert calls[0][:3] == ["brightdata", "scraper", "heal"]
    assert "c_123" in calls[0]
    assert "--url" in calls[0]
    assert result["status"] == "awaiting_approval"

