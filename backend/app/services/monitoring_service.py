from backend.network.network_state import network_state, get_edge_for_endpoint
from backend.app.services.alert_service import create_alert
from datetime import datetime


async def get_monitoring_data():
    monitoring_data = []

    # Monitor devices
    for device, status in network_state["devices"].items():

        if status == "down":
            monitoring_data.append(
                {
                    "device": device,
                    "cpu": 0,
                    "memory": 0,
                    "latency": 0,
                    "packet_loss": 100,
                    "status": "down"
                }
            )

            await create_alert(
                alert_id=f"ALT-{device.upper()}",
                severity="critical",
                title="Device Down",
                device=device,
                message=f"{device} is unreachable",
                timestamp=datetime.utcnow().isoformat()
            )

        else:
            monitoring_data.append(
                {
                    "device": device,
                    "cpu": 42,
                    "memory": 58,
                    "latency": 12,
                    "packet_loss": 0,
                    "status": "up"
                }
            )

    # Monitor links
    for link, status in network_state["links"].items():

        if status == "down":
            await create_alert(
                alert_id=f"ALT-LINK-{link.upper()}",
                severity="critical",
                title="Network Link Down",
                device=link,
                message=f"Network link {link} is down",
                timestamp=datetime.utcnow().isoformat()
            )

    # Monitor endpoints — only create warning-level alerts for endpoints
    # whose parent edge switch is down (cascaded failure), to avoid
    # creating 22+ separate critical incidents for infrastructure failures
    for endpoint, status in network_state["endpoints"].items():

        if status == "down":
            parent_edge = get_edge_for_endpoint(endpoint)
            parent_down = (
                parent_edge
                and network_state["devices"].get(parent_edge) == "down"
            )

            await create_alert(
                alert_id=f"ALT-ENDPOINT-{endpoint.upper()}",
                severity="warning" if parent_down else "critical",
                title="Endpoint Unreachable" if parent_down else "Endpoint Down",
                device=endpoint,
                message=(
                    f"Endpoint {endpoint} is unreachable due to {parent_edge} failure"
                    if parent_down
                    else f"Endpoint {endpoint} is unreachable"
                ),
                timestamp=datetime.utcnow().isoformat()
            )

    return monitoring_data