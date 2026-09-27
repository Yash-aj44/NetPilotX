incidents = []


def get_incidents():
    return incidents


def create_incident(
    incident_id: str,
    title: str,
    severity: str,
    affected_systems,
    root_cause: str,
    created_at: str
):
    # Deduplication: don't create duplicate incidents for the same failure
    for existing in incidents:
        if existing["id"] == incident_id:
            return existing

    # Support both int and list for affected_systems
    if isinstance(affected_systems, list):
        affected_list = affected_systems
        affected_count = len(affected_systems)
    else:
        affected_list = []
        affected_count = affected_systems

    incident = {
        "id": incident_id,
        "title": title,
        "severity": severity,
        "status": "open",
        "affected_systems": affected_list,
        "affected_count": affected_count,
        "root_cause": root_cause,
        "created_at": created_at
    }

    incidents.append(incident)

    return incident


def resolve_incident(incident_id: str):
    from datetime import datetime

    for incident in incidents:
        if incident["id"] == incident_id:
            incident["status"] = "resolved"
            incident["resolved_at"] = datetime.utcnow().isoformat()
            return incident

    return None