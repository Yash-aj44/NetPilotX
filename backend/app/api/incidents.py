from fastapi import APIRouter
from backend.app.services.incident_service import (
    get_incidents,
    resolve_incident
)
from backend.app.core.websocket_manager import manager


router = APIRouter(
    prefix="/api/incidents",
    tags=["Incidents"]
)


@router.get("")
def get_all_incidents():
    return get_incidents()


@router.get("/{incident_id}")
def get_incident(incident_id: str):
    incidents = get_incidents()

    for incident in incidents:
        if incident["id"] == incident_id:
            return incident

    return {"error": "Incident not found"}


@router.post("/{incident_id}/resolve")
async def resolve_incident_api(incident_id: str):

    incident = resolve_incident(incident_id)

    if incident is None:
        return {"error": "Incident not found"}

    await manager.broadcast({
        "type": "incident_resolved",
        "incident": incident
    })

    return incident