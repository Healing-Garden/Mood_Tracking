from openai import AsyncOpenAI
from src.config import settings
from src.core.gemini_client import gemini_client
import logging

logger = logging.getLogger(__name__)

async def call_llm(messages: list, temperature: float = 0.7, max_tokens: int = 500) -> dict:
    """
    Điều phối gọi LLM:
    1. Thử OpenAI trước (Ưu tiên theo yêu cầu người dùng).
    2. Nếu OpenAI fail (hết tiền/429/timeout), thử Gemini (fallback).
    3. Nếu cả hai fail, trả về rỗng để dùng rule-based.
    """
    # 1. Thử OpenAI trước
    openai_key = settings.get_openai_api_key()
    if openai_key:
        try:
            client = AsyncOpenAI(api_key=openai_key, timeout=12.0)
            response = await client.chat.completions.create(
                model=settings.openai_model,
                messages=messages,
                temperature=temperature,
                max_tokens=max_tokens,
            )
            text = response.choices[0].message.content.strip() if response.choices and response.choices[0].message.content else ""
            if text:
                return {"text": text}
        except Exception as e:
            logger.warning(f"OpenAI primary call failed: {e}")

    # 2. Thử Gemini (Dự phòng)
    try:
        system_instruction = ""
        user_prompt = ""
        
        for msg in messages:
            if msg["role"] == "system":
                system_instruction += msg["content"] + "\n"
            elif msg["role"] == "user":
                user_prompt += msg["content"] + "\n"
            elif msg["role"] == "assistant":
                user_prompt += f"Assistant: {msg['content']}\n"
        
        gemini_text = await gemini_client.generate_response(
            prompt=user_prompt.strip(),
            system_instruction=system_instruction.strip() if system_instruction else None
        )
        
        if gemini_text:
            logger.info("Successfully used Gemini as fallback.")
            return {"text": gemini_text}
            
    except Exception as ge:
        logger.error(f"Gemini fallback also failed: {ge}")

    # 3. Nếu tất cả đều fail
    logger.error("All AI providers (OpenAI & Gemini) are currently unavailable.")
    return {"text": ""}