import logging
from typing import List, Dict, Any, Optional
from datetime import datetime
from src.core.gemini_client import gemini_client
from src.config import settings
from src.core.sentiment import sentiment_analyzer  # để phân tích sentiment nếu cần
from collections import Counter

logger = logging.getLogger(__name__)

class DailySummaryGenerator:
    def __init__(self):
        pass

    async def generate(
        self,
        user_id: str,
        date: str,
        entries: List[Dict],
        moods: List[Dict]
    ) -> Dict[str, Any]:
        """
        Tạo daily summary bằng Gemini.
        Trả về dict gồm summary và metadata chi tiết.
        """
        # 1. Kiểm tra dữ liệu đầu vào (exception 1-EF)
        if not entries and not moods:
            return {
                "summary": "You haven't recorded any data today. Every day is a new opportunity for growth and reflection.",
                "metadata": {
                    "entry_count": 0,
                    "mood_count": 0,
                    "avg_mood": 0,
                    "dominant_mood": "unknown",
                    "has_journal": False,
                    "has_mood": False,
                    "sentiment_summary": "neutral"
                },
                "type": "empty_day"
            }

        # 2. Chuẩn bị dữ liệu cho prompt
        journal_texts = [e.get('text', '') for e in entries if e.get('text')]
        mood_list = [m.get('mood', 'unknown') for m in moods]
        energy_list = [m.get('energy') for m in moods if m.get('energy') is not None]

        # Tóm tắt journal nếu quá dài (giới hạn 500 từ)
        journal_summary = self._prepare_journal_summary(journal_texts)

        # Tính các chỉ số metadata
        avg_mood = self._calculate_avg_mood(mood_list, energy_list)
        dominant_mood = self._dominant_mood(mood_list)
        sentiment = self._analyze_sentiment_from_texts(journal_texts) if journal_texts else "neutral"

        # 3. Xây dựng prompt cho Gemini
        prompt = self._build_prompt(journal_summary, mood_list, energy_list, avg_mood, dominant_mood)

        system_instruction = (
            "You are a compassionate mental health assistant. "
            "Always use positive, encouraging, supportive language. "
            "Do not judge the user. Focus on growth, reflection, and self-awareness."
        )

        # 4. Gọi Gemini (có fallback)
        try:
            ai_text = await gemini_client.generate_response(prompt, system_instruction=system_instruction)
            if not ai_text:
                raise RuntimeError("Gemini returned empty response")
            summary = ai_text.strip()
        except Exception as e:
            logger.error(f"Gemini generation failed: {e}, using rule-based fallback")
            summary = self._rule_based_fallback(len(entries), len(moods), avg_mood, dominant_mood)

        # 5. Hậu xử lý: đảm bảo độ dài và loại bỏ khoảng trắng thừa
        summary = self._post_process(summary)

        # 6. Trả về kết quả
        return {
            "summary": summary,
            "metadata": {
                "entry_count": len(entries),
                "mood_count": len(moods),
                "avg_mood": avg_mood,
                "dominant_mood": dominant_mood,
                "has_journal": len(entries) > 0,
                "has_mood": len(moods) > 0,
                "sentiment_summary": sentiment
            },
            "type": "full_summary" if (entries or moods) else "empty_day"
        }

    def _build_prompt(
        self,
        journal_summary: str,
        mood_list: List[str],
        energy_list: List[int],
        avg_mood: float,
        dominant_mood: str
    ) -> str:
        """Xây dựng prompt với ngôn ngữ tích cực, khích lệ."""
        mood_text = f"Recorded moods: {', '.join(mood_list) if mood_list else 'none'}. "
        energy_text = f"Average energy level: {sum(energy_list)/len(energy_list):.1f}/10. " if energy_list else ""

        prompt = f"""
You are a compassionate mental health assistant. Write a warm, encouraging daily summary (about 100 words) based on the user's data:

- Number of mood check-ins: {len(mood_list)}. {mood_text}
- {energy_text}
- Average mood score (1-5 scale): {avg_mood:.1f}. Most frequent mood: {dominant_mood}.
- Journal entries: {journal_summary if journal_summary else 'No journal entries today.'}

Requirements:
- Use positive, supportive language focused on growth and self-awareness.
- If moods were negative, acknowledge the courage to track feelings.
- If there are journal entries, highlight a key theme or insight.
- If only mood data exists, comment on the emotional trend of the day.
- Never use judgmental language; always be constructive.
- End with a short, encouraging sentence.
- Write in English.

Summary:
"""
        return prompt

    def _prepare_journal_summary(self, texts: List[str]) -> str:
        """Ghép các đoạn journal và cắt nếu quá dài."""
        if not texts:
            return ""
        combined = " ".join(texts)
        words = combined.split()
        if len(words) > 500:
            combined = " ".join(words[:500]) + "..."
        return combined

    def _rule_based_fallback(self, entry_count: int, mood_count: int, avg_mood: float, dominant_mood: str) -> str:
        """Fallback theo UC-19 Exception 2-EF: không dùng AI, vẫn tích cực."""
        base = f"Today's data: You recorded {mood_count} mood check-ins and {entry_count} journal entries."
        if mood_count > 0:
            base += f" Your average mood was {avg_mood:.1f}/5, with '{dominant_mood}' showing up most often."
        return base + " Thank you for checking in — small reflections like this can support meaningful growth."

    def _post_process(self, summary: str) -> str:
        """Đảm bảo summary không quá dài và loại bỏ khoảng trắng."""
        summary = summary.strip()
        if len(summary.split()) > 150:
            summary = " ".join(summary.split()[:150]) + "..."
        return summary

    def _calculate_avg_mood(self, mood_list: List[str], energy_list: List[int]) -> float:
        """Chuyển mood thành điểm số (1-5) và tính trung bình."""
        mood_score_map = {
            "happy": 5, "excited": 5, "calm": 4, "neutral": 3,
            "sad": 2, "angry": 1, "anxious": 2, "tired": 2
        }
        scores = [mood_score_map.get(m, 3) for m in mood_list]
        if scores:
            return sum(scores) / len(scores)
        return 0.0

    def _dominant_mood(self, mood_list: List[str]) -> str:
        if not mood_list:
            return "unknown"
        return Counter(mood_list).most_common(1)[0][0]

    def _analyze_sentiment_from_texts(self, texts: List[str]) -> str:
        """Phân tích sentiment tổng thể từ các journal entries."""
        if not texts:
            return "neutral"
        combined = " ".join(texts)
        # Dùng sentiment_analyzer đã có
        result = sentiment_analyzer.analyze_sentiment(combined)
        return result.get("sentiment", "neutral")