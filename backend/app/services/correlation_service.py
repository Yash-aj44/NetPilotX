from backend.network.network_state import (
    network_state,
    get_endpoints_for_edge,
    get_edge_for_endpoint,
)


def correlate_failure() -> dict:
    """
    Analyze current network state and determine the root cause of failures.
    Uses deterministic logic based on topology and device/endpoint/link status.
    """
    down_devices = [
        d for d, s in network_state["devices"].items() if s == "down"
    ]
    down_links = [
        l for l, s in network_state["links"].items() if s == "down"
    ]
    down_endpoints = [
        e for e, s in network_state["endpoints"].items() if s == "down"
    ]

    if not down_devices and not down_links and not down_endpoints:
        return {
            "failure_type": "none",
            "root_cause": None,
            "root_cause_description": "No failures detected",
            "affected_endpoints": [],
            "affected_count": 0,
            "is_infrastructure_failure": False,
        }

    # Check for device failures (infrastructure)
    for device_id in down_devices:
        if device_id.startswith("edge-"):
            connected_eps = get_endpoints_for_edge(device_id)
            affected = [
                ep for ep in connected_eps
                if network_state["endpoints"].get(ep) == "down"
            ]
            if affected:
                return {
                    "failure_type": "device",
                    "root_cause": device_id,
                    "root_cause_description": (
                        f"Edge switch {device_id} is down, "
                        f"causing {len(affected)} connected endpoints to be unreachable"
                    ),
                    "affected_endpoints": affected,
                    "affected_count": len(affected),
                    "is_infrastructure_failure": True,
                }

    # Check for link failures
    for link_id in down_links:
        parts = link_id.split("-")
        if len(parts) == 4:
            target = f"{parts[2]}-{parts[3]}"
            if target.startswith("edge-"):
                connected_eps = get_endpoints_for_edge(target)
                affected = [
                    ep for ep in connected_eps
                    if network_state["endpoints"].get(ep) == "down"
                ]
                if affected:
                    return {
                        "failure_type": "link",
                        "root_cause": link_id,
                        "root_cause_description": (
                            f"Network link {link_id} is down, "
                            f"affecting {len(affected)} endpoints behind {target}"
                        ),
                        "affected_endpoints": affected,
                        "affected_count": len(affected),
                        "is_infrastructure_failure": True,
                    }

    # Isolated endpoint failures (no upstream device/link issue)
    if down_endpoints:
        return {
            "failure_type": "endpoint",
            "root_cause": down_endpoints[0] if len(down_endpoints) == 1 else "multiple_endpoints",
            "root_cause_description": (
                f"{len(down_endpoints)} endpoint(s) down with no upstream infrastructure failure"
            ),
            "affected_endpoints": down_endpoints,
            "affected_count": len(down_endpoints),
            "is_infrastructure_failure": False,
        }

    # Fallback: device/link down but no affected endpoints
    if down_devices:
        return {
            "failure_type": "device",
            "root_cause": down_devices[0],
            "root_cause_description": f"Device {down_devices[0]} is down",
            "affected_endpoints": [],
            "affected_count": 0,
            "is_infrastructure_failure": True,
        }

    return {
        "failure_type": "link",
        "root_cause": down_links[0],
        "root_cause_description": f"Link {down_links[0]} is down",
        "affected_endpoints": [],
        "affected_count": 0,
        "is_infrastructure_failure": True,
    }
