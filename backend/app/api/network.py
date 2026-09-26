from fastapi import APIRouter
from datetime import datetime

from backend.app.schemas.network import NetworkTopology
from backend.app.services.network_service import get_topology
from backend.network.failure_simulator import (
    simulate_device_failure,
    restore_device,
)
from backend.network.network_state import get_device_status
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
    edge_05_status = get_device_status("edge-05")

    if edge_05_status == "down":
        return {
            "status": "degraded",
            "message": "Edge-05 is down"
        }

    return {
        "status": "healthy",
        "message": "Network is operating normally"
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


@router.post("/restore")
async def restore(device_id: str):
    result = restore_device(device_id)

    if result["success"]:
        await manager.broadcast({
            "type": "device_status_changed",
            "device": device_id,
            "status": "up",
            "timestamp": datetime.utcnow().isoformat()
        })

    return result