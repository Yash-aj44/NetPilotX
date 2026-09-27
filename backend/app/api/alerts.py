from fastapi import APIRouter
from backend.app.services.alert_service import get_alerts

router = APIRouter(
    prefix="/api/alerts",
    tags=["Alerts"]
)


@router.get("")
def get_all_alerts():
    return get_alerts()