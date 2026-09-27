from backend.app.services.incident_service import create_incident
from backend.app.core.websocket_manager import manager
from backend.app.services.correlation_service import correlate_failure


alerts = []


def get_alerts():
    return alerts


async def create_alert(
    alert_id: str,
    severity: str,
    title: str,
    device: str,
    message: str,
    timestamp: str
):
    # Deduplication: don't create duplicate alerts
    for alert in alerts:
        if alert["id"] == alert_id:
            return alert

    alert = {
        "id": alert_id,
        "severity": severity,
        "title": title,
        "device": device,
        "message": message,
        "timestamp": timestamp
    }

    alerts.append(alert)

    await manager.broadcast({
        "type": "alert_created",
        "alert": alert
    })

    # Create infrastructure incidents only for critical
    # device/link alerts, not cascaded endpoint warnings.
    if severity == "critical" and not device.startswith("endpoint-"):

        # Use the actual network state to determine
        # root cause and affected endpoints.
        failure_analysis = correlate_failure()

        if failure_analysis["root_cause"] == device:
            affected_endpoints = failure_analysis["affected_endpoints"]
        else:
            affected_endpoints = []

        if device.startswith("edge-"):
            incident_title = "Edge Switch Connectivity Failure"
        else:
            incident_title = "Network Infrastructure Failure"

        incident = create_incident(
            incident_id=f"INC-{device.upper()}",
            title=incident_title,
            severity="critical",
            affected_systems=affected_endpoints,
            root_cause=device,
            created_at=timestamp
        )

        await manager.broadcast({
            "type": "incident_created",
            "incident": incident
        })

    return alert