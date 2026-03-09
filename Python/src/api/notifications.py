from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Union
from src.core.notification_generator import build_user_context, generate_notification_content, suggest_smart_times

router = APIRouter(tags=["notifications"])


class UserContextRequest(BaseModel):
    """Accepts payload from Node BE: mood/energy may be numbers from DB."""
    user_id: str
    name: Optional[str] = ""
    recent_mood: Optional[Union[str, int]] = None
    recent_energy: Optional[Union[int, str]] = None
    last_journal_snippet: Optional[str] = None

class NotificationRequest(BaseModel):
    user_context: UserContextRequest
    category: str
    time_of_day: str 

class NotificationResponse(BaseModel):
    title: str
    content: str

class SmartTimeRequest(BaseModel):
    user_id: str
    category: str
    days_of_data: int = 30

class SmartTimeResponse(BaseModel):
    suggested_times: List[str]

@router.post("/generate-content", response_model=NotificationResponse)
async def generate_content(request: NotificationRequest):
    try:
        result = await generate_notification_content(
            request.user_context.dict(),
            request.category,
            request.time_of_day
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/suggest-times", response_model=SmartTimeResponse)
async def suggest_times(request: SmartTimeRequest):
    try:
        times = await suggest_smart_times(request.user_id, request.category, request.days_of_data)
        return SmartTimeResponse(suggested_times=times)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))