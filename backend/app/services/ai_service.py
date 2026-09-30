import json

from backend.ai.groq_client import ask_groq
from backend.ai.prompt import build_prompt

from backend.app.services.network_service import get_topology
from backend.app.services.monitoring_service import get_monitoring_data
from backend.app.services.traffic_service import get_traffic_data
from backend.app.services.alert_service import get_alerts
from backend.app.services.incident_service import get_incidents
from backend.app.services.correlation_service import correlate_failure

from backend.network.network_state import network_state


def _compact_topology(topology):
    """
    Convert the backend topology into a compact representation.

    The backend topology uses:
        nodes
        edges

    We preserve the actual device relationships so the AI can reason
    about parent/child relationships without guessing.
    """

    data = topology.model_dump()

    nodes = data.get("nodes", [])
    edges = data.get("edges", [])

    compact = {
        "devices": [],
        "links": []
    }

    # ---------------------------------------------------------
    # Devices
    # ---------------------------------------------------------

    for node in nodes:
        compact["devices"].append({
            "id": node.get("id"),
            "name": node.get("name"),
            "type": node.get("type"),
            "status": node.get("status"),
        })

    # ---------------------------------------------------------
    # Actual topology relationships
    # ---------------------------------------------------------

    for edge in edges:
        compact["links"].append({
            "source": edge.get("source"),
            "target": edge.get("target"),
            "status": edge.get("status"),
        })

    return compact


def _build_topology_relationships(topology):
    """
    Build explicit parent relationships from the real topology.

    Example:

        edge-05 -> dist-02

    becomes:

        EDGE-05:
            parent_device: DIST-02
    """

    data = topology.model_dump()

    nodes = data.get("nodes", [])
    edges = data.get("edges", [])

    node_lookup = {
        node.get("id"): node
        for node in nodes
        if node.get("id")
    }

    relationships = {}

    for edge in edges:
        source = edge.get("source")
        target = edge.get("target")

        if not source or not target:
            continue

        source_node = node_lookup.get(source, {})
        target_node = node_lookup.get(target, {})

        source_type = source_node.get("type")
        target_type = target_node.get("type")

        # Distribution -> Edge
        if source_type == "distribution" and target_type == "edge":
            relationships[target.upper()] = {
                "parent_device": source.upper(),
                "link_status": edge.get("status"),
            }

        # Core -> Distribution
        elif source_type == "core" and target_type == "distribution":
            relationships[target.upper()] = {
                "parent_device": source.upper(),
                "link_status": edge.get("status"),
            }

        # Preserve reverse relationships too
        relationships[source.upper()] = relationships.get(
            source.upper(),
            {}
        )

    return relationships


def _build_endpoint_summary():
    """
    Build a compact summary of endpoint state.

    We intentionally do NOT send all 200 endpoint records to Groq.
    """

    endpoints = network_state.get("endpoints", {})

    total = len(endpoints)

    up = sum(
        1
        for status in endpoints.values()
        if status == "up"
    )

    down = total - up

    return {
        "total": total,
        "online": up,
        "offline": down,
    }


def _build_edge_endpoint_summary():
    """
    Build compact endpoint counts per edge.

    The backend uses deterministic endpoint naming/mapping.
    Endpoint IDs follow the endpoint-XXX format.

    The existing simulation allocates endpoints across the nine
    edge switches. We calculate the affected count from the actual
    endpoint state rather than sending all endpoint records.
    """

    endpoints = network_state.get("endpoints", {})

    summary = {}

    # Deterministic mapping used by the NetPilot X simulation.
    #
    # Each edge owns a contiguous endpoint range.
    # EDGE-05 owns endpoint-089 through endpoint-110,
    # which gives it 22 endpoints.
    #
    # We keep the mapping here compact rather than sending
    # hundreds of endpoint records to the LLM.

    edge_ranges = {
        "EDGE-01": (1, 22),
        "EDGE-02": (23, 44),
        "EDGE-03": (45, 66),
        "EDGE-04": (67, 88),
        "EDGE-05": (89, 110),
        "EDGE-06": (111, 132),
        "EDGE-07": (133, 154),
        "EDGE-08": (155, 176),
        "EDGE-09": (177, 200),
    }

    for edge_name, (start, end) in edge_ranges.items():
        endpoint_ids = [
            f"endpoint-{number:03d}"
            for number in range(start, end + 1)
        ]

        online = sum(
            1
            for endpoint_id in endpoint_ids
            if endpoints.get(endpoint_id) == "up"
        )

        offline = sum(
            1
            for endpoint_id in endpoint_ids
            if endpoints.get(endpoint_id) == "down"
        )

        summary[edge_name] = {
            "total_endpoints": len(endpoint_ids),
            "online": online,
            "offline": offline,
        }

    return summary


def _compact_monitoring(monitoring):
    """
    Keep monitoring information useful for diagnosis.
    """

    if not monitoring:
        return []

    compact = []

    for item in monitoring:
        if not isinstance(item, dict):
            continue

        compact.append({
            "device_id": item.get("device_id"),
            "status": item.get("status"),
            "cpu": item.get("cpu"),
            "memory": item.get("memory"),
            "latency": item.get("latency"),
            "packet_loss": item.get("packet_loss"),
        })

    return compact


def _compact_traffic(traffic):
    """
    Keep traffic telemetry compact while preserving useful fields.
    """

    if not traffic:
        return []

    compact = []

    for item in traffic:
        if not isinstance(item, dict):
            continue

        compact.append({
            "device_id": item.get("device_id"),
            "status": item.get("status"),
            "bandwidth": item.get("bandwidth"),
            "utilization": item.get("utilization"),
            "throughput": item.get("throughput"),
            "packets_per_second": item.get("packets_per_second"),
            "ingress": item.get("ingress"),
            "egress": item.get("egress"),
        })

    return compact


def _compact_alerts(alerts):
    """
    Keep alert information relevant to the AI.
    """

    if not alerts:
        return []

    compact = []

    for alert in alerts:
        if not isinstance(alert, dict):
            continue

        compact.append({
            "id": alert.get("id"),
            "severity": alert.get("severity"),
            "title": alert.get("title"),
            "message": alert.get("message"),
            "device_id": alert.get("device_id"),
            "status": alert.get("status"),
        })

    return compact


def _compact_incidents(incidents):
    """
    Avoid sending large affected-system lists.

    Keep the count and root cause because those are what the
    Copilot needs for operational reasoning.
    """

    if not incidents:
        return []

    compact = []

    for incident in incidents:
        if not isinstance(incident, dict):
            continue

        compact.append({
            "id": incident.get("id"),
            "title": incident.get("title"),
            "severity": incident.get("severity"),
            "status": incident.get("status"),
            "affected_count": incident.get("affected_count"),
            "root_cause": incident.get("root_cause"),
        })

    return compact


def _compact_failure_analysis(correlation):
    """
    Preserve failure correlation while avoiding unnecessarily
    large payloads.
    """

    if not correlation:
        return {}

    if not isinstance(correlation, dict):
        return correlation

    return {
        "failure_detected": correlation.get("failure_detected"),
        "failure_type": correlation.get("failure_type"),
        "root_cause": correlation.get("root_cause"),
        "affected_endpoints": correlation.get("affected_endpoints"),
        "affected_count": correlation.get("affected_count"),
        "infrastructure_failure": correlation.get(
            "infrastructure_failure"
        ),
    }


async def ask_ai(message: str) -> str:

    # ---------------------------------------------------------
    # Collect authoritative backend data
    # ---------------------------------------------------------

    topology = get_topology()
    monitoring = await get_monitoring_data()
    traffic = await get_traffic_data()
    alerts = get_alerts()
    incidents = get_incidents()
    correlation = correlate_failure()

    # ---------------------------------------------------------
    # Overall network state
    # ---------------------------------------------------------

    endpoints = network_state.get("endpoints", {})

    total_endpoints = len(endpoints)

    endpoints_up = sum(
        1
        for status in endpoints.values()
        if status == "up"
    )

    endpoints_down = total_endpoints - endpoints_up

    overall_health = (
        round((endpoints_up / total_endpoints) * 100)
        if total_endpoints > 0
        else 100
    )

    # ---------------------------------------------------------
    # Compact topology
    # ---------------------------------------------------------

    compact_topology = _compact_topology(topology)

    topology_relationships = _build_topology_relationships(
        topology
    )

    # ---------------------------------------------------------
    # Endpoint state
    # ---------------------------------------------------------

    endpoint_summary = _build_endpoint_summary()

    edge_endpoint_summary = _build_edge_endpoint_summary()

    # ---------------------------------------------------------
    # Compact AI context
    # ---------------------------------------------------------

    network_context = {
        "network_status": {
            "overall_health_percent": overall_health,
            "total_endpoints": total_endpoints,
            "endpoints_online": endpoints_up,
            "endpoints_offline": endpoints_down,
        },

        "topology": compact_topology,

        "topology_relationships": topology_relationships,

        "endpoint_summary": endpoint_summary,

        "edge_endpoint_summary": edge_endpoint_summary,

        "monitoring": _compact_monitoring(
            monitoring
        ),

        "traffic_telemetry": _compact_traffic(
            traffic
        ),

        "alerts": _compact_alerts(
            alerts
        ),

        "incidents": _compact_incidents(
            incidents
        ),

        "failure_analysis": _compact_failure_analysis(
            correlation
        ),
    }

    # ---------------------------------------------------------
    # Compact JSON
    # ---------------------------------------------------------

    network_context_json = json.dumps(
        network_context,
        separators=(",", ":"),
        default=str,
    )

    # ---------------------------------------------------------
    # Build grounded prompt
    # ---------------------------------------------------------

    prompt = build_prompt(
        message,
        network_context_json
    )

    # ---------------------------------------------------------
    # Ask Groq
    # ---------------------------------------------------------

    return ask_groq(prompt)