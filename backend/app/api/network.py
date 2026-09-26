from fastapi import APIRouter
from datetime import datetime

from backend.app.schemas.network import NetworkTopology
from backend.app.services.network_service import get_topology
from backend.app.services.incident_service import resolve_incident

from backend.network.failure_simulator import (
    simulate_device_failure,
    restore_device,
    simulate_link_failure,
    restore_link,
)

from backend.network.network_state import network_state

from backend.app.core.websocket_manager import manager


router = APIRouter(
    prefix="/api/network",
    tags=["Network"]
)


@router.get("/topology", response_model=NetworkTopology)
def get_network_topology():
    return get_topology()


@router.get("/state")
def get_network_state():

    down_devices = [
        device
        for device, status in network_state["devices"].items()
        if status == "down"
    ]

    if down_devices:
        return {
            "status": "degraded",
            "message": "Network has down devices",
            "down_devices": down_devices
        }

    return {
        "status": "healthy",
        "message": "Network is operating normally",
        "down_devices": []
    }


@router.post("/simulate-failure")
async def simulate_failure(device_id: str):

    result = simulate_device_failure(device_id)

    if result["success"]:
        await manager.broadcast({
            "type": "device_status_changed",
            "device": device_id,
            "status": "down",
            "timestamp": datetime.utcnow().isoformat()
        })

    return result


@router.post("/simulate-link-failure")
async def simulate_link_failure_api(link_id: str):

    result = simulate_link_failure(link_id)

    if result["success"]:
        await manager.broadcast({
            "type": "link_status_changed",
            "link": link_id,
            "status": "down",
            "timestamp": datetime.utcnow().isoformat()
        })

    return result


@router.post("/restore-link")
async def restore_link_api(link_id: str):

    result = restore_link(link_id)

    if result["success"]:
        await manager.broadcast({
            "type": "link_restored",
            "link": link_id,
            "status": "up",
            "timestamp": datetime.utcnow().isoformat()
        })

        incident = resolve_incident(
            f"INC-{link_id.upper()}"
        )

        if incident:
            await manager.broadcast({
                "type": "incident_resolved",
                "incident": incident
            })

    return result


@router.post("/restore")
async def restore(device_id: str):

    result = restore_device(device_id)

    if result["success"]:

        await manager.broadcast({
            "type": "device_restored",
            "device": device_id,
            "status": "up",
            "timestamp": datetime.utcnow().isoformat()
        })

        incident = resolve_incident(
            f"INC-{device_id.upper()}"
        )

        if incident:
            await manager.broadcast({
                "type": "incident_resolved",
                "incident": incident
            })

    return result