def build_prompt(message: str, network_context: str) -> str:
    return f"""
You are NetPilot X AI Copilot.

Answer the user's question using ONLY the network information provided below.

NETWORK STATE:
{network_context}

USER QUESTION:
{message}

Rules:
- Use the failure_analysis section when explaining failures or root causes.
- Base affected-system information only on the provided network state and failure_analysis.
- Do not invent devices, metrics, alerts, incidents, connections, or affected systems.
- If the information is not available, clearly say that it is not available.
- Give a concise and useful answer.
"""