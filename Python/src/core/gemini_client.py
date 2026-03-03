from google import genai
from google.genai import types
import asyncio
import re
from src.config import settings
import logging
from typing import Optional

logger = logging.getLogger(__name__)

class GeminiClient:
    def __init__(self):
        self.api_key = settings.get_gemini_api_key()
        if not self.api_key:
            logger.warning("Gemini API key not set. Gemini features disabled.")
            return
        self.client = genai.Client(api_key=self.api_key)
        self.primary_model = settings.gemini_model
        logger.info(f"Gemini client configured with primary model: {self.primary_model}")

    async def _call_model(
        self,
        model: str,
        prompt: str,
        system_instruction: Optional[str],
    ) -> Optional[str]:
        config_args = dict(
            temperature=settings.gemini_temperature,
            max_output_tokens=settings.gemini_max_tokens,
        )
        if system_instruction:
            config_args["system_instruction"] = system_instruction

        generate_config = types.GenerateContentConfig(**config_args)

        response = await asyncio.wait_for(
            self.client.aio.models.generate_content(
                model=model,
                contents=prompt,
                config=generate_config,
            ),
            timeout=15.0,
        )

        if response and response.text:
            return response.text.strip()
        return None

    @staticmethod
    def _parse_retry_delay(error_message: str) -> float:
        """Lấy thời gian retry từ message lỗi 429, mặc định 30s."""
        match = re.search(r"retry in (\d+(?:\.\d+)?)s", str(error_message), re.IGNORECASE)
        if match:
            return min(float(match.group(1)), 10.0)  # Tối đa chờ 10s
        return 5.0

    async def generate_response(
        self,
        prompt: str,
        system_instruction: Optional[str] = None,
    ) -> Optional[str]:
        """
        Gọi Gemini với fallback model chain:
        1. Thử primary model (từ settings)
        2. Nếu 429 → thử các fallback model lần lượt
        3. Nếu tất cả fail → trả về None (rule-based sẽ xử lý)
        """
        if not self.api_key:
            return None

        models_to_try = [self.primary_model] + settings.gemini_fallback_models

        for i, model in enumerate(models_to_try):
            try:
                logger.debug(f"Trying Gemini model: {model}")
                result = await self._call_model(model, prompt, system_instruction)
                if result:
                    if i > 0:
                        logger.info(f"Gemini responded via fallback model: {model}")
                    return result

            except asyncio.TimeoutError:
                logger.warning(f"Gemini timeout on model {model}")
                # timeout → thử model tiếp theo ngay
                continue

            except Exception as e:
                err_str = str(e)

                if "429" in err_str or "RESOURCE_EXHAUSTED" in err_str:
                    delay = self._parse_retry_delay(err_str)
                    logger.warning(
                        f"Rate limited on model {model}. "
                        f"Trying next fallback in {delay:.1f}s..."
                    )
                    await asyncio.sleep(delay)
                    continue  # thử model fallback tiếp theo

                elif "404" in err_str or "NOT_FOUND" in err_str:
                    logger.warning(f"Model {model} not found, skipping.")
                    continue

                else:
                    logger.error(f"Gemini generation failed on {model}: {e}")
                    continue  # thử model tiếp theo thay vì dừng hẳn

        logger.warning("All Gemini models exhausted. Falling back to rule-based.")
        return None


gemini_client = GeminiClient()
