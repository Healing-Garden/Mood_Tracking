from openai import AsyncOpenAI
from src.config import settings
import logging

logger = logging.getLogger(__name__)

async def call_llm(messages: list, temperature: float = 0.7, max_tokens: int = 500) -> dict:
    """
    Gọi OpenAI ChatCompletion với messages.
    Trả về dict chứa 'text' là nội dung response.
    """
    try:
        client = AsyncOpenAI(api_key=settings.get_openai_api_key(), timeout=10.0)
        response = await client.chat.completions.create(
            model=settings.openai_model,
            messages=messages,
            temperature=temperature,
            max_tokens=max_tokens,
        )
        text = response.choices[0].message.content.strip() if response.choices and response.choices[0].message.content else ""
        return {"text": text}
    except Exception as e:
        logger.error(f"OpenAI call failed: {e}")
        raise