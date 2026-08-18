import asyncio
import json
from dataclasses import asdict
from backend.app.services.workflows import GroundTruthService
from backend.app.services.brightdata_client import BrightDataClient
from backend.app.services.storage import EventStore
from backend.app.core.config import get_settings

def main():
    settings = get_settings()
    if settings.demo_mode:
        print("DEMO_MODE is true in config, overriding to False for this test.")
        
    client = BrightDataClient(api_key=settings.brightdata_api_key)
    store = EventStore(settings.database_url)
    service = GroundTruthService(client, store, demo_mode=False)
    
    print("Running openai_pricing...")
    res1 = service.run_source("openai_pricing")
    print("\nOPENAI RESPONSE:")
    print(json.dumps(asdict(res1), indent=2))
    
    print("\nRunning anthropic_news...")
    res2 = service.run_source("anthropic_news")
    print("\nANTHROPIC RESPONSE:")
    print(json.dumps(asdict(res2), indent=2))

if __name__ == "__main__":
    main()
