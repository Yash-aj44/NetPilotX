from backend.network.network_state import (
    get_device_status,
    set_device_status,
    network_state,
)


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

    return {
        "success": True,
        "device": device_id,
        "status": "down",
        "message": f"Device {device_id} failure simulated"
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

    return {
        "success": True,
        "device": device_id,
        "status": "up",
        "message": f"Device {device_id} restored"
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

    return {
        "success": True,
        "link": link_id,
        "status": "down",
        "message": f"Link {link_id} failure simulated"
    }