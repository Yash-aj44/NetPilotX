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
    simulate_endpoint_failure,
    restore_endpoint,
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

    down_endpoints = [
        endpoint
        for endpoint, status in network_state["endpoints"].items()
        if status == "down"
    ]

    down_links = [
        link
        for link, status in network_state["links"].items()
        if status == "down"
    ]

    if down_devices or down_endpoints or down_links:
        return {
            "status": "degraded",
            "message": "Network has down devices or endpoints",
            "down_devices": down_devices,
            "down_endpoints": down_endpoints,
            "down_links": down_links,
            "total_endpoints": len(network_state["endpoints"]),
            "endpoints_up": sum(
                1 for s in network_state["endpoints"].values()
                if s == "up"
            ),
            "endpoints_down": len(down_endpoints),
        }

    return {
        "status": "healthy",
        "message": "Network is operating normally",
        "down_devices": [],
        "down_endpoints": [],
        "down_links": [],
        "total_endpoints": len(network_state["endpoints"]),
        "endpoints_up": len(network_state["endpoints"]),
        "endpoints_down": 0,
    }


@router.post("/simulate-failure")
async def simulate_failure(device_id: str):

    result = simulate_device_failure(device_id)

    if result["success"]:
        timestamp = datetime.utcnow().isoformat()

        await manager.broadcast({
            "type": "device_status_changed",
            "device": device_id,
            "status": "down",
            "timestamp": timestamp
        })

        # Broadcast endpoint cascade events
        for ep_id in result.get("affected_endpoints", []):
            await manager.broadcast({
                "type": "endpoint_status_changed",
                "endpoint": ep_id,
                "status": "down",
                "timestamp": timestamp
            })

    return result


@router.post("/simulate-link-failure")
async def simulate_link_failure_api(link_id: str):

    result = simulate_link_failure(link_id)

    if result["success"]:
        timestamp = datetime.utcnow().isoformat()

        await manager.broadcast({
            "type": "link_status_changed",
            "link": link_id,
            "status": "down",
            "timestamp": timestamp
        })

        # Broadcast endpoint cascade events
        for ep_id in result.get("affected_endpoints", []):
            await manager.broadcast({
                "type": "endpoint_status_changed",
                "endpoint": ep_id,
                "status": "down",
                "timestamp": timestamp
            })

    return result


@router.post("/simulate-endpoint-failure")
async def simulate_endpoint_failure_api(endpoint_id: str):

    result = simulate_endpoint_failure(endpoint_id)

    if result["success"]:
        await manager.broadcast({
            "type": "endpoint_status_changed",
            "endpoint": endpoint_id,
            "status": "down",
            "timestamp": datetime.utcnow().isoformat()
        })

    return result


@router.post("/restore-link")
async def restore_link_api(link_id: str):

    result = restore_link(link_id)

    if result["success"]:
        timestamp = datetime.utcnow().isoformat()

        await manager.broadcast({
            "type": "link_restored",
            "link": link_id,
            "status": "up",
            "timestamp": timestamp
        })

        # Broadcast endpoint restoration events
        for ep_id in result.get("restored_endpoints", []):
            await manager.broadcast({
                "type": "endpoint_restored",
                "endpoint": ep_id,
                "status": "up",
                "timestamp": timestamp
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


@router.post("/restore-endpoint")
async def restore_endpoint_api(endpoint_id: str):

    result = restore_endpoint(endpoint_id)

    if result["success"]:
        await manager.broadcast({
            "type": "endpoint_restored",
            "endpoint": endpoint_id,
            "status": "up",
            "timestamp": datetime.utcnow().isoformat()
        })

        incident = resolve_incident(
            f"INC-{endpoint_id.upper()}"
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
        timestamp = datetime.utcnow().isoformat()

        await manager.broadcast({
            "type": "device_restored",
            "device": device_id,
            "status": "up",
            "timestamp": timestamp
        })

        # Broadcast endpoint restoration events
        for ep_id in result.get("restored_endpoints", []):
            await manager.broadcast({
                "type": "endpoint_restored",
                "endpoint": ep_id,
                "status": "up",
                "timestamp": timestamp
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