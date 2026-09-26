from fastapi import APIRouter

from backend.app.services.monitoring_service import get_monitoring_data


router = APIRouter(
    prefix="/api/monitoring",
    tags=["Monitoring"]
)


@router.get("")
async def get_monitoring():
    return await get_monitoring_data()