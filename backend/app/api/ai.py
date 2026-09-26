from fastapi import APIRouter
from backend.app.schemas.ai import AIRequest, AIResponse
from backend.app.services.ai_service import ask_ai

router = APIRouter(
    prefix="/api/ai",
    tags=["AI"]
)


@router.post("/chat", response_model=AIResponse)
def ai_chat(request: AIRequest):
    response = ask_ai(request.message)

    return AIResponse(
        response=response
    )