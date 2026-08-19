from fastapi import APIRouter

from services.copilot_service import handle_copilot_message
from simulation.models import CopilotRequest, CopilotResponse

router = APIRouter(tags=["copilot"])


@router.post("/copilot", response_model=CopilotResponse)
def copilot(request: CopilotRequest):
    return handle_copilot_message(request)
