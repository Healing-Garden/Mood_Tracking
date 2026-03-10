import logging
from typing import List, Dict, Any, Optional
from datetime import datetime
from src.core.gemini_client import gemini_client
from src.config import settings
from src.core.sentiment import sentiment_analyzer 
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
        day_theme = self._get_day_theme(date)
        prompt = self._build_prompt(journal_summary, mood_list, energy_list, avg_mood, dominant_mood, day_theme)

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
        dominant_mood: str,
        day_theme: str = ""
    ) -> str:
        """Xây dựng prompt với ngôn ngữ tích cực, khích lệ."""
        mood_tokens = [str(m) for m in mood_list] if mood_list else []
        mood_text = f"Recorded moods: {', '.join(mood_tokens) if mood_tokens else 'none'}. "
        energy_text = f"Average energy level: {sum(energy_list)/len(energy_list):.1f}/10. " if energy_list else ""

        prompt = f"""
You are a compassionate mental health assistant. Write a warm, encouraging daily reflection in natural, human-sounding English.

{day_theme} Use this context to flavor the reflection and avoid repetitive daily templates.

User data (may include Vietnamese text; please interpret it and respond in English while preserving the emotional meaning):
- Mood check-ins: {mood_text}{energy_text}Average mood score (1-5): {avg_mood:.1f}. Most frequent mood: {dominant_mood}.
- Journal text: {journal_summary if journal_summary else 'No journal text was recorded today.'}

Writing requirements:
1. Sound like a supportive therapist: gentle, validating, and practical.
2. Do NOT list stats or counts in a report-like way (avoid phrases like "You recorded X..." or bullet-point style output).
3. Structure: 2 short paragraphs (Total 4-7 sentences). Keep it around ~100-140 words.
4. Reflect one or two emotional themes you infer from the journal and mood trend.
5. Closing: Instead of a generic tip, end with a specific "reflection question" tailored to the user's day (e.g., "What’s one small thing you can do for yourself right now?" or "In what way did you show yourself grace today?"). This question should be the final sentence.
6. If the mood seems low (avg < 3), explicitly validate difficulty and highlight resilience.
7. Language: English.
8. Safety: Ensure all sentences are complete. Do not stop mid-sentence.

Daily reflection:
"""
        return prompt

    def _get_day_theme(self, date_str: Optional[str]) -> str:
        """Tạo context dựa trên ngày trong tuần để tăng độ đa dạng."""
        try:
            if not date_str:
                dt = datetime.now()
            else:
                dt = datetime.strptime(date_str, "%Y-%m-%d")
            
            day_name = dt.strftime("%A")
            themes = {
                "Monday": "a fresh start to the week, setting intentions and managing transitions",
                "Tuesday": "building momentum, finding focus, and settling into a productive rhythm",
                "Wednesday": "the mid-week bridge, checking in on energy balance and self-care",
                "Thursday": "persistence through the week's challenges, noticing growth and preparation",
                "Friday": "wrap-up and release, celebrating wins (no matter how small) and letting go of stress",
                "Saturday": "unstructured time, rest, recreation, and connecting with what truly matters",
                "Sunday": "gentle reflection, deep restoration, and setting a peaceful tone for the coming days"
            }
            return f"Note: Today is {day_name}, which is often associated with {themes.get(day_name, 'reflection')}."
        except:
            return ""

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
        if mood_count <= 0 and entry_count <= 0:
            return "Even without any check-ins today, showing up matters. If you have a moment, try naming one feeling you noticed and one small thing you needed. You can always begin again tomorrow."

        tone = "steady" if avg_mood >= 3 else "heavy"
        mood_sentence = ""
        if mood_count > 0:
            if tone == "heavy":
                mood_sentence = f"It sounds like today may have felt heavy, and it took courage to track it."
            else:
                mood_sentence = f"It seems like your day had a more steady emotional tone, and you stayed present with it."

        journal_sentence = ""
        if entry_count > 0:
            journal_sentence = "Your journaling suggests you were trying to make sense of what happened, which is a strong step toward clarity."

        gentle_step = "If you can, try a 60-second reset: inhale for 4, exhale for 6, and ask yourself: 'What would be kind to me right now?'"
        closing = "You don't have to carry today perfectly — you just have to carry it one moment at a time."

        parts = [p for p in [mood_sentence, journal_sentence, gentle_step, closing] if p]
        return " ".join(parts)

    def _post_process(self, summary: str) -> str:
        """Đảm bảo summary không quá dài và loại bỏ khoảng trắng."""
        summary = summary.strip()
        # Tăng lên 250 từ để tránh cắt giữa chừng
        if len(summary.split()) > 250:
            summary = " ".join(summary.split()[:250]) + "..."
        return summary

    def _calculate_avg_mood(self, mood_list: List[str], energy_list: List[int]) -> float:
        """Chuyển mood thành điểm số (1-5) và tính trung bình."""
        mood_score_map = {
            "happy": 5, "excited": 5, "calm": 4, "neutral": 3,
            "sad": 2, "angry": 1, "anxious": 2, "tired": 2
        }
        scores = []
        for m in mood_list:
            if isinstance(m, (int, float)):
                if 1 <= float(m) <= 5:
                    scores.append(float(m))
                continue
            scores.append(mood_score_map.get(str(m).lower(), 3))
        if scores:
            return sum(scores) / len(scores)
        return 0.0

    def _dominant_mood(self, mood_list: List[str]) -> str:
        if not mood_list:
            return "unknown"
        normalized = [str(m) for m in mood_list]
        return Counter(normalized).most_common(1)[0][0]

    def _analyze_sentiment_from_texts(self, texts: List[str]) -> str:
        """Phân tích sentiment tổng thể từ các journal entries."""
        if not texts:
            return "neutral"
        combined = " ".join(texts)
        # Dùng sentiment_analyzer đã có
        result = sentiment_analyzer.analyze_sentiment(combined)
        return result.get("sentiment", "neutral")