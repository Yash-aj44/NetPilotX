incidents = []


def get_incidents():
    return incidents


def create_incident(
    incident_id: str,
    title: str,
    severity: str,
    affected_systems: int,
    root_cause: str,
    created_at: str
):
    incident = {
        "id": incident_id,
        "title": title,
        "severity": severity,
        "status": "open",
        "affected_systems": affected_systems,
        "root_cause": root_cause,
        "created_at": created_at
    }

    incidents.append(incident)

    return incident


def resolve_incident(incident_id: str):
    for incident in incidents:
        if incident["id"] == incident_id:
            incident["status"] = "resolved"
            return incident

    return None