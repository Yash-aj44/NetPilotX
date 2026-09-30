from fastapi import APIRouter
from backend.app.services.traffic_service import get_traffic_data

router = APIRouter(
    prefix="/api/traffic",
    tags=["Traffic"]
)


@router.get("")
async def get_traffic():
    return await get_traffic_data()
