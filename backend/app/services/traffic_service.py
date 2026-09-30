from backend.network.network_state import network_state


async def get_traffic_data():
    traffic_data = []

    profiles = {
        "core-01": {
            "bandwidth_mbps": 40000,
            "throughput_mbps": 28400,
            "utilization_percent": 71,
            "pps": 340000,
            "ingress": 14200,
            "egress": 14200,
        },
        "dist-01": {
            "bandwidth_mbps": 10000,
            "throughput_mbps": 6200,
            "utilization_percent": 62,
            "pps": 74000,
            "ingress": 3500,
            "egress": 2700,
        },
        "dist-02": {
            "bandwidth_mbps": 10000,
            "throughput_mbps": 7300,
            "utilization_percent": 73,
            "pps": 84231,
            "ingress": 4100,
            "egress": 3200,
        },
        "dist-03": {
            "bandwidth_mbps": 10000,
            "throughput_mbps": 5800,
            "utilization_percent": 58,
            "pps": 69000,
            "ingress": 3100,
            "egress": 2700,
        },
        "edge-01": {
            "bandwidth_mbps": 1000,
            "throughput_mbps": 450,
            "utilization_percent": 45,
            "pps": 12000,
            "ingress": 250,
            "egress": 200,
        },
        "edge-02": {
            "bandwidth_mbps": 1000,
            "throughput_mbps": 380,
            "utilization_percent": 38,
            "pps": 10500,
            "ingress": 210,
            "egress": 170,
        },
        "edge-03": {
            "bandwidth_mbps": 1000,
            "throughput_mbps": 520,
            "utilization_percent": 52,
            "pps": 14200,
            "ingress": 290,
            "egress": 230,
        },
        "edge-04": {
            "bandwidth_mbps": 1000,
            "throughput_mbps": 610,
            "utilization_percent": 61,
            "pps": 16500,
            "ingress": 340,
            "egress": 270,
        },
        "edge-05": {
            "bandwidth_mbps": 1000,
            "throughput_mbps": 740,
            "utilization_percent": 74,
            "pps": 19800,
            "ingress": 410,
            "egress": 330,
        },
        "edge-06": {
            "bandwidth_mbps": 1000,
            "throughput_mbps": 480,
            "utilization_percent": 48,
            "pps": 13100,
            "ingress": 270,
            "egress": 210,
        },
        "edge-07": {
            "bandwidth_mbps": 1000,
            "throughput_mbps": 390,
            "utilization_percent": 39,
            "pps": 11000,
            "ingress": 220,
            "egress": 170,
        },
        "edge-08": {
            "bandwidth_mbps": 1000,
            "throughput_mbps": 420,
            "utilization_percent": 42,
            "pps": 11800,
            "ingress": 230,
            "egress": 190,
        },
        "edge-09": {
            "bandwidth_mbps": 1000,
            "throughput_mbps": 560,
            "utilization_percent": 56,
            "pps": 15400,
            "ingress": 310,
            "egress": 250,
        },
    }

    for device, status in network_state["devices"].items():
        base = profiles.get(
            device,
            {
                "bandwidth_mbps": 1000,
                "throughput_mbps": 400,
                "utilization_percent": 40,
                "pps": 10000,
                "ingress": 200,
                "egress": 200,
            },
        )

        if status == "down":
            traffic_data.append({
                "device": device,
                "bandwidth_mbps": base["bandwidth_mbps"],
                "throughput_mbps": 0,
                "utilization_percent": 0,
                "packets_per_second": 0,
                "ingress_mbps": 0,
                "egress_mbps": 0,
                "status": "down",
            })
        else:
            traffic_data.append({
                "device": device,
                "bandwidth_mbps": base["bandwidth_mbps"],
                "throughput_mbps": base["throughput_mbps"],
                "utilization_percent": base["utilization_percent"],
                "packets_per_second": base["pps"],
                "ingress_mbps": base["ingress"],
                "egress_mbps": base["egress"],
                "status": "up",
            })

    return traffic_data
