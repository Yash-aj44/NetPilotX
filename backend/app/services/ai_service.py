import json

from backend.ai.groq_client import ask_groq
from backend.ai.prompt import build_prompt

from backend.app.services.network_service import get_topology
from backend.app.services.monitoring_service import get_monitoring_data
from backend.app.services.alert_service import get_alerts
from backend.app.services.incident_service import get_incidents
from backend.app.services.correlation_service import correlate_failure

from backend.network.network_state import network_state


async def ask_ai(message: str) -> str:
    topology = get_topology()
    monitoring = await get_monitoring_data()
    alerts = get_alerts()
    incidents = get_incidents()
    correlation = correlate_failure()

    network_context = json.dumps(
        {
            "topology": topology.model_dump(),
            "endpoints": network_state["endpoints"],
            "monitoring": monitoring,
            "alerts": alerts,
            "incidents": incidents,
            "failure_analysis": correlation
        },
        indent=2,
        default=str
    )

    prompt = build_prompt(message, network_context)

    return ask_groq(prompt)