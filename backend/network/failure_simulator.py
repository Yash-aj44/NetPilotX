from backend.network.network_state import (
    get_device_status,
    set_device_status,
    get_endpoints_for_edge,
    network_state,
)


# Track endpoints that were taken down specifically by link failures
link_affected_endpoints = {}


def simulate_device_failure(device_id: str):
    current_status = get_device_status(device_id)

    if current_status is None:
        return {
            "success": False,
            "message": f"Device {device_id} not found"
        }

    if current_status == "down":
        return {
            "success": False,
            "message": f"Device {device_id} is already down"
        }

    set_device_status(device_id, "down")

    # Cascade failure to connected endpoints for edge switches
    affected_endpoints = []

    if device_id.startswith("edge-"):
        for ep_id in get_endpoints_for_edge(device_id):
            if network_state["endpoints"].get(ep_id) == "up":
                network_state["endpoints"][ep_id] = "down"
                affected_endpoints.append(ep_id)

    return {
        "success": True,
        "device": device_id,
        "status": "down",
        "message": f"Device {device_id} failure simulated",
        "affected_endpoints": affected_endpoints
    }


def restore_device(device_id: str):
    current_status = get_device_status(device_id)

    if current_status is None:
        return {
            "success": False,
            "message": f"Device {device_id} not found"
        }

    if current_status == "up":
        return {
            "success": False,
            "message": f"Device {device_id} is already up"
        }

    set_device_status(device_id, "up")

    # Restore cascaded endpoints for edge switches
    restored_endpoints = []

    if device_id.startswith("edge-"):
        for ep_id in get_endpoints_for_edge(device_id):
            if network_state["endpoints"].get(ep_id) == "down":
                network_state["endpoints"][ep_id] = "up"
                restored_endpoints.append(ep_id)

    return {
        "success": True,
        "device": device_id,
        "status": "up",
        "message": f"Device {device_id} restored",
        "restored_endpoints": restored_endpoints
    }


def simulate_link_failure(link_id: str):
    current_status = network_state["links"].get(link_id)

    if current_status is None:
        return {
            "success": False,
            "message": f"Link {link_id} not found"
        }

    if current_status == "down":
        return {
            "success": False,
            "message": f"Link {link_id} is already down"
        }

    network_state["links"][link_id] = "down"

    affected_endpoints = []

    # Example:
    # dist-02-edge-05 -> edge-05
    parts = link_id.split("-")

    if len(parts) == 4 and parts[2] == "edge":
        edge_id = f"{parts[2]}-{parts[3]}"

        for ep_id in get_endpoints_for_edge(edge_id):
            if network_state["endpoints"].get(ep_id) == "up":
                network_state["endpoints"][ep_id] = "down"
                affected_endpoints.append(ep_id)

    # Remember which endpoints were caused by this link failure
    link_affected_endpoints[link_id] = affected_endpoints

    return {
        "success": True,
        "link": link_id,
        "status": "down",
        "message": f"Network link {link_id} failure simulated",
        "affected_endpoints": affected_endpoints
    }


def restore_link(link_id: str):
    current_status = network_state["links"].get(link_id)

    if current_status is None:
        return {
            "success": False,
            "message": f"Link {link_id} not found"
        }

    if current_status == "up":
        return {
            "success": False,
            "message": f"Link {link_id} is already up"
        }

    network_state["links"][link_id] = "up"

    restored_endpoints = []

    # Restore only the endpoints that THIS link failure caused
    for ep_id in link_affected_endpoints.get(link_id, []):
        if network_state["endpoints"].get(ep_id) == "down":
            network_state["endpoints"][ep_id] = "up"
            restored_endpoints.append(ep_id)

    # Remove tracking after restoration
    link_affected_endpoints.pop(link_id, None)

    return {
        "success": True,
        "link": link_id,
        "status": "up",
        "message": f"Network link {link_id} restored",
        "restored_endpoints": restored_endpoints
    }


def simulate_endpoint_failure(endpoint_id: str):
    current_status = network_state["endpoints"].get(endpoint_id)

    if current_status is None:
        return {
            "success": False,
            "message": f"Endpoint {endpoint_id} not found"
        }

    if current_status == "down":
        return {
            "success": False,
            "message": f"Endpoint {endpoint_id} is already down"
        }

    network_state["endpoints"][endpoint_id] = "down"

    return {
        "success": True,
        "endpoint": endpoint_id,
        "status": "down",
        "message": f"Endpoint {endpoint_id} failure simulated"
    }


def restore_endpoint(endpoint_id: str):
    current_status = network_state["endpoints"].get(endpoint_id)

    if current_status is None:
        return {
            "success": False,
            "message": f"Endpoint {endpoint_id} not found"
        }

    if current_status == "up":
        return {
            "success": False,
            "message": f"Endpoint {endpoint_id} is already up"
        }

    network_state["endpoints"][endpoint_id] = "up"

    return {
        "success": True,
        "endpoint": endpoint_id,
        "status": "up",
        "message": f"Endpoint {endpoint_id} restored"
    }