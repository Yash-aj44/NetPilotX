from backend.app.schemas.network import NetworkTopology


def get_topology() -> NetworkTopology:
    nodes = [
        {
            "id": "core-01",
            "name": "Core Switch",
            "type": "switch",
            "status": "up"
        },
        {
            "id": "dist-01",
            "name": "Distribution Switch 01",
            "type": "switch",
            "status": "up"
        },
        {
            "id": "edge-01",
            "name": "Edge Switch 01",
            "type": "switch",
            "status": "up"
        }
    ]

    edges = [
        {
            "source": "core-01",
            "target": "dist-01",
            "status": "up"
        },
        {
            "source": "dist-01",
            "target": "edge-01",
            "status": "up"
        }
    ]

    return NetworkTopology(
        nodes=nodes,
        edges=edges
    )