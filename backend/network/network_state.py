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

    "endpoints": {
        f"endpoint-{i:03d}": "up"
        for i in range(1, 201)
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


# Deterministic endpoint-to-edge mapping (round-robin across 9 edge switches)
EDGE_SWITCHES = [f"edge-{i:02d}" for i in range(1, 10)]

ENDPOINT_EDGE_MAP = {}
for i in range(1, 201):
    edge_index = (i - 1) % 9
    ENDPOINT_EDGE_MAP[f"endpoint-{i:03d}"] = EDGE_SWITCHES[edge_index]


def get_device_status(device_id: str):
    return network_state["devices"].get(device_id)


def set_device_status(device_id: str, status: str):
    network_state["devices"][device_id] = status


def get_endpoints_for_edge(edge_id: str) -> list:
    """Return list of endpoint IDs connected to the given edge switch."""
    return [ep for ep, edge in ENDPOINT_EDGE_MAP.items() if edge == edge_id]


def get_edge_for_endpoint(endpoint_id: str) -> str:
    """Return the edge switch ID for a given endpoint."""
    return ENDPOINT_EDGE_MAP.get(endpoint_id)