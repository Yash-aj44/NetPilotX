from backend.app.schemas.network import NetworkTopology
from backend.network.network_state import network_state


def get_topology() -> NetworkTopology:

    nodes = []

    for device_id, status in network_state["devices"].items():

        if device_id == "core-01":
            device_type = "core"
        elif device_id.startswith("dist"):
            device_type = "distribution"
        else:
            device_type = "edge"

        nodes.append({
            "id": device_id,
            "name": device_id.replace("-", " ").title(),
            "type": device_type,
            "status": status
        })

    edges = []

    for link_id, status in network_state["links"].items():

        parts = link_id.split("-")

        if len(parts) == 4:
            source = f"{parts[0]}-{parts[1]}"
            target = f"{parts[2]}-{parts[3]}"

            edges.append({
                "source": source,
                "target": target,
                "status": status
            })

    return NetworkTopology(
        nodes=nodes,
        edges=edges
    )