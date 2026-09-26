from backend.network.network_state import (
    get_device_status,
    set_device_status,
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