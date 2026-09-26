from fastapi import APIRouter

from backend.app.schemas.network import NetworkTopology
from backend.app.services.network_service import get_topology
from backend.network.failure_simulator import (
    simulate_device_failure,
    restore_device,
)
from backend.network.network_state import get_device_status


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
def simulate_failure(device_id: str):
    return simulate_device_failure(device_id)


@router.post("/restore")
def restore(device_id: str):
    return restore_device(device_id)