from __future__ import annotations

from dataclasses import asdict

from fastapi import APIRouter, HTTPException, Query

from backend.app.core.config import get_settings
from backend.app.services.brightdata_client import BrightDataClient
from backend.app.services.source_registry import get_source
from backend.app.services.storage import EventStore
from backend.app.services.workflows import GroundTruthService


settings = get_settings()
service = GroundTruthService(
    BrightDataClient(settings.brightdata_api_key),
    EventStore(settings.database_url),
    settings.demo_mode,
)

router = APIRouter()


@router.get("/health")
async def health() -> dict:
    return {"status": "ok", "demo_mode": settings.demo_mode}


@router.get("/sources")
async def sources() -> list[dict]:
    return service.list_sources()


@router.get("/sources/{source_id}")
async def source(source_id: str) -> dict:
    try:
        return asdict(get_source(source_id))
    except KeyError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.post("/sources/{source_id}/run")
async def run_source(source_id: str, mode: str = Query("healthy")) -> dict:
    try:
        return asdict(service.run_source(source_id, mode))
    except KeyError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/sources/{source_id}/detect-drift")
async def detect_drift(source_id: str, mode: str = Query("broken")) -> dict:
    try:
        return asdict(service.detect_source_drift(source_id, mode))
    except KeyError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/sources/{source_id}/heal")
async def heal(source_id: str) -> dict:
    try:
        return asdict(service.heal_source(source_id))
    except KeyError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/sources/{source_id}/approve-heal")
async def approve(source_id: str) -> dict:
    try:
        return service.approve_heal(source_id)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.get("/events")
async def events(limit: int = Query(100, ge=1, le=500)) -> list[dict]:
    return service.store.list_events(limit)
