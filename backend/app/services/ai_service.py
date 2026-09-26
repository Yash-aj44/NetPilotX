import json

from backend.ai.groq_client import ask_groq
from backend.ai.prompt import build_prompt

from backend.app.services.network_service import get_topology
from backend.app.services.monitoring_service import get_monitoring_data
from backend.app.services.alert_service import get_alerts
from backend.app.services.incident_service import get_incidents


def ask_ai(message: str) -> str:
    topology = get_topology()
    monitoring = get_monitoring_data()
    alerts = get_alerts()
    incidents = get_incidents()

    network_context = json.dumps(
        {
            "topology": topology.model_dump(),
            "monitoring": monitoring,
            "alerts": alerts,
            "incidents": incidents
        },
        indent=2
    )

    prompt = build_prompt(message, network_context)

    return ask_groq(prompt)