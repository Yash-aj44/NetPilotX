network_state = {
    "devices": {
        "core-01": "up",
        "dist-01": "up",
        "dist-02": "up",
        "dist-03": "up",
        "edge-01": "up",
        "edge-02": "up",
        "edge-03": "up",
        "edge-04": "up",
        "edge-05": "up",
        "edge-06": "up",
        "edge-07": "up",
        "edge-08": "up",
        "edge-09": "up",
    },

    "links": {
        "core-01-dist-01": "up",
        "core-01-dist-02": "up",
        "core-01-dist-03": "up",

        "dist-01-edge-01": "up",
        "dist-01-edge-02": "up",
        "dist-01-edge-03": "up",

        "dist-02-edge-04": "up",
        "dist-02-edge-05": "up",
        "dist-02-edge-06": "up",

        "dist-03-edge-07": "up",
        "dist-03-edge-08": "up",
        "dist-03-edge-09": "up",
    }
}


def get_device_status(device_id: str):
    return network_state["devices"].get(device_id)


def set_device_status(device_id: str, status: str):
    network_state["devices"][device_id] = status