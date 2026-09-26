from fastapi import APIRouter
from backend.app.services.monitoring_service import get_monitoring_data

router = APIRouter(
    prefix="/api/monitoring",
    tags=["Monitoring"]
)


@router.get("")
def get_monitoring():
    return get_monitoring_data()