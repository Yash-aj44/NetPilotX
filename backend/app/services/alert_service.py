from backend.app.services.incident_service import create_incident


alerts = []


def get_alerts():
    return alerts


def create_alert(
    alert_id: str,
    severity: str,
    title: str,
    device: str,
    message: str,
    timestamp: str
):
    # Don't create the same alert repeatedly
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

    # Critical device-down alert creates an incident
    if severity == "critical":
        create_incident(
            incident_id=f"INC-{device.upper()}",
            title="Device Connectivity Failure",
            severity="critical",
            affected_systems=22,
            root_cause=device,
            created_at=timestamp
        )

    return alert