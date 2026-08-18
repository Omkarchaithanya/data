from backend.app.core.config import get_settings
from backend.app.services.brightdata_client import BrightDataClient
from backend.app.services.storage import EventStore
from backend.app.services.workflows import GroundTruthService
import os

settings = get_settings()
service = GroundTruthService(
    BrightDataClient("103c2c5f-66e6-4fdb-aa47-8691701f2305"),
    EventStore(settings.database_url),
    demo_mode=False,
)

try:
    print("Testing openai_pricing source...")
    res = service.run_source("openai_pricing", "healthy")
    print(res)
except Exception as e:
    print("Failed!", type(e), e)
