from pydantic import BaseModel
from datetime import datetime


class Event(BaseModel):
    type: str
    device: str
    status: str
    timestamp: datetime