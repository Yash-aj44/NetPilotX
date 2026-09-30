from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from backend.app.api.alerts import router as alerts_router
from backend.app.api.monitoring import router as monitoring_router
from backend.app.api.network import router as network_router
from backend.app.api.incidents import router as incidents_router
from backend.app.api.ai import router as ai_router
from backend.app.api.traffic import router as traffic_router
from backend.app.core.websocket_manager import manager


app = FastAPI(
    title="NetPilot X API",
    description="AI-powered Network Operations Platform",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
        "http://127.0.0.1:5175",
        "http://127.0.0.1:3000",
    ],
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1)(:\d+)?",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(network_router)
app.include_router(monitoring_router)
app.include_router(alerts_router)
app.include_router(incidents_router)
app.include_router(traffic_router)
app.include_router(ai_router)


@app.get("/")
def root():
    return {
        "message": "NetPilot X Backend Running"
    }


@app.websocket("/ws/network")
async def network_websocket(websocket: WebSocket):
    await manager.connect(websocket)

    try:
        while True:
            await websocket.receive_text()

    except WebSocketDisconnect:
        manager.disconnect(websocket)