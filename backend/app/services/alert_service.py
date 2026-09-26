from backend.app.services.incident_service import create_incident
from backend.app.core.websocket_manager import manager

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

    if severity == "critical":
        incident = create_incident(
            incident_id=f"INC-{device.upper()}",
            title="Device Connectivity Failure",
            severity="critical",
            affected_systems=22,
            root_cause=device,
            created_at=timestamp
        )

        await manager.broadcast({
            "type": "incident_created",
            "incident": incident
        })

    return alert