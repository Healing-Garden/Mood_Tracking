from fastapi import APIRouter
from typing import List, Optional
from datetime import datetime, timedelta
import logging
import json
import re
import random
from pydantic import BaseModel
from bson import ObjectId

from src.database import mongodb
from src.core.embeddings import embedding_service
from src.database.vector_store import vector_store
from src.core.llm import call_llm

router = APIRouter()
logger = logging.getLogger(__name__)

class QuestionRequest(BaseModel):
    user_id: str
    recent_mood: Optional[str] = None
    count: int = 3
    language: str = "en"  

class QuestionResponse(BaseModel):
    questions: List[str]
    context: dict
    generated_at: datetime

@router.post("/suggest", response_model=QuestionResponse)
async def suggest_questions(request: QuestionRequest):
    try:
        db = mongodb.get_db()
        user_id = request.user_id

        # ---- 1. Lấy mood gần nhất (nếu request không cung cấp) ----
        recent_mood = request.recent_mood
        if not recent_mood:
            try:
                user_obj_id = ObjectId(user_id)
            except:
                user_obj_id = user_id
                
            mood_doc = await db.dailycheckins.find_one(
                {"user": user_obj_id, "created_at": {"$gte": datetime.now() - timedelta(hours=24)}},
                sort=[("created_at", -1)]
            )
            recent_mood = mood_doc.get("mood") if mood_doc else None

        # ---- 2. Lấy câu hỏi đã hỏi trong 48h qua (BR-18-01) ----
        cutoff = datetime.now() - timedelta(hours=48)
        recent_interactions = await db.ai_interactions.find({
            "user_id": user_id,
            "type": "suggested_question",
            "created_at": {"$gte": cutoff}
        }).to_list(length=100)
        asked_questions = []
        for inter in recent_interactions:
            asked_questions.extend(inter.get("content", {}).get("questions", []))

        # ---- 3. RAG: lấy đoạn văn liên quan từ journal entries ----
        # Tạo query text dựa trên ngôn ngữ
        if request.language == "vi":
            query_text = f"Tâm trạng gần đây: {recent_mood or 'không rõ'}. Tìm những bài viết có thể gợi ý câu hỏi suy ngẫm."
        else:
            query_text = f"Recent mood: {recent_mood or 'unknown'}. Find journal entries that could inspire a reflective question."
            
        query_embedding = await embedding_service.encode_with_cache([query_text])
        
        results = await vector_store.query(
            collection_name="journal_entries",
            query_embeddings=query_embedding,
            n_results=5,
            where={"user_id": user_id}
        )
        snippets = []
        if results.get("documents") and len(results["documents"]) > 0:
            snippets = results["documents"][0]
        if isinstance(snippets, list):
            snippets = snippets[:3]
        else:
            snippets = []

        # ---- 4. Sinh câu hỏi bằng LLM ----
        questions = await _generate_questions(
            recent_mood=recent_mood,
            snippets=snippets,
            avoid_questions=asked_questions[-5:],
            count=request.count,
            language=request.language
        )

        # ---- 5. Lưu tương tác ----
        await db.ai_interactions.insert_one({
            "user_id": user_id,
            "type": "suggested_question",
            "content": {
                "questions": questions,
                "context": {
                    "recent_mood": recent_mood,
                    "snippet_count": len(snippets),
                    "language": request.language
                }
            },
            "created_at": datetime.now()
        })

        return QuestionResponse(
            questions=questions,
            context={
                "recent_mood": recent_mood,
                "used_rag": bool(snippets),
                "language": request.language
            },
            generated_at=datetime.now()
        )

    except Exception as e:
        logger.error(f"Failed to generate questions: {e}")
        fallback = _get_fallback_questions(request.recent_mood, request.count, request.language)
        return QuestionResponse(
            questions=fallback,
            context={"fallback": True, "error": str(e), "language": request.language},
            generated_at=datetime.now()
        )

# ---------------------------------------------------------------------------
# Emoji → human-readable mood mapping
# ---------------------------------------------------------------------------
EMOJI_TO_MOOD: dict = {
    # Happy / Positive
    "😊": "happy and content",
    "🙂": "slightly positive",
    "😍": "very excited and joyful",
    "😄": "cheerful",
    "😁": "very happy",
    "🥰": "loving and grateful",
    "😎": "confident and energized",
    "🤩": "excited and inspired",
    # Sad / Negative
    "😢": "sad and emotional",
    "😭": "very sad and overwhelmed",
    "😔": "down and disappointed",
    "😞": "discouraged",
    # Angry
    "😡": "frustrated and angry",
    "😠": "annoyed and irritated",
    "🤬": "very angry",
    # Neutral
    "😐": "neutral and indifferent",
    "😑": "expressionless",
    "🙃": "unsure or somewhat ironic",
    "😶": "speechless or numb",
    # Anxious / Tired
    "😰": "anxious and stressed",
    "😥": "worried",
    "😓": "tired and drained",
    "😴": "exhausted and sleepy",
    "🥺": "vulnerable and sensitive",
}

def _resolve_mood_label(mood: Optional[str]) -> str:
    """Convert raw mood (emoji or text) to a descriptive label for the LLM."""
    if not mood:
        return "not specified"
    # If it's already a text label, return as-is
    if mood in EMOJI_TO_MOOD:
        return EMOJI_TO_MOOD[mood]
    # Check if any emoji character is in the string
    for emoji, label in EMOJI_TO_MOOD.items():
        if emoji in mood:
            return label
    return mood  # fallback: pass through as-is


def _parse_llm_questions(content: str, count: int) -> Optional[list]:
    """
    Robustly extract a JSON array of strings from LLM output.
    Handles: raw JSON array, markdown code fences, numbered lists.
    """
    if not content:
        return None

    # Step 1: Strip markdown code fences (```json ... ``` or ``` ... ```)
    cleaned = re.sub(r'```(?:json)?\s*', '', content).strip()
    cleaned = cleaned.replace('```', '').strip()

    # Step 2: Try to find and parse a JSON array
    json_match = re.search(r'(\[.*?\])', cleaned, re.DOTALL)
    if json_match:
        try:
            questions = json.loads(json_match.group(1))
            if isinstance(questions, list) and questions:
                # Filter to only string items
                questions = [q for q in questions if isinstance(q, str) and q.strip()]
                if questions:
                    return questions[:count]
        except json.JSONDecodeError:
            pass

    # Step 3: Try parsing the whole cleaned content as JSON
    try:
        questions = json.loads(cleaned)
        if isinstance(questions, list):
            questions = [q for q in questions if isinstance(q, str) and q.strip()]
            if questions:
                return questions[:count]
    except json.JSONDecodeError:
        pass

    # Step 4: Fallback - extract lines that look like questions (contain '?')
    lines = []
    for line in cleaned.split('\n'):
        line = line.strip()
        # Remove common list prefixes (1. 2. - * etc.)
        line = re.sub(r'^[\d]+\.\s*', '', line)
        line = re.sub(r'^[-*•]\s*', '', line)
        line = line.strip('"').strip("'").strip()
        if line and '?' in line and len(line) > 10:
            lines.append(line)
    if lines:
        return lines[:count]

    return None


async def _generate_questions(recent_mood: Optional[str], snippets: List[str],
                              avoid_questions: List[str], count: int, language: str) -> List[str]:
    """Generate questions using LLM with language support."""

    # Resolve emoji to readable mood label so LLM understands the context
    mood_label = _resolve_mood_label(recent_mood)

    # System message
    if language == "vi":
        system_msg = (
            "Bạn là trợ lý sức khỏe tinh thần đồng cảm. "
            "Nhiệm vụ của bạn là tạo ra các câu hỏi viết nhật ký CÁ NHÂN HÓA dựa trên tâm trạng và nhật ký của người dùng. "
            "CHỈ trả về mảng JSON chứa các câu hỏi, KHÔNG dùng markdown code block."
        )
    else:
        system_msg = (
            "You are a compassionate mental health journaling assistant. "
            "Your task is to generate PERSONALIZED open-ended journaling questions based on the user's current mood and past journal entries. "
            "ONLY return a raw JSON array of question strings. Do NOT use markdown code fences."
        )

    # Build snippets context
    if snippets:
        snippets_text = "\n".join([f"- {s[:200]}" for s in snippets])  # cap each snippet
    else:
        snippets_text = "(No journal entries available yet)" if language == "en" else "(Chưa có nhật ký nào.)"

    avoid_text = "; ".join(avoid_questions[:3]) if avoid_questions else ("none" if language == "en" else "không có")

    # Build prompts
    if language == "vi":
        user_prompt = f"""Tạo {count} câu hỏi nhật ký mở, đồng cảm, phù hợp với tâm trạng người dùng.

Tâm trạng hiện tại: {mood_label}

Các đoạn nhật ký gần đây (để hiểu ngữ cảnh):
{snippets_text}

Quy tắc:
- Câu hỏi phải LIÊN QUAN ĐẾN TÂM TRẠNG "{mood_label}" của người dùng.
- Câu hỏi phải tích cực, mang tính suy ngẫm, không phán xét.
- KHÔNG hỏi câu có/không; phải mời người dùng chia sẻ sâu hơn.
- KHÔNG lặp lại: {avoid_text}

Trả về CHÍNH XÁC theo format này (không thêm gì khác):
["câu hỏi 1?", "câu hỏi 2?", "câu hỏi 3?"]"""
    else:
        user_prompt = f"""Generate exactly {count} personalized journaling questions for a user feeling: {mood_label}.

Recent journal context:
{snippets_text}

Rules:
- Questions MUST reflect the user's current mood ({mood_label}).
- Open-ended, empathetic, encouraging, non-judgmental.
- NOT yes/no questions — invite deep reflection.
- Do NOT repeat: {avoid_text}

Return ONLY this exact format, nothing else:
["question 1?", "question 2?", "question 3?"]"""

    try:
        response = await call_llm(
            messages=[
                {"role": "system", "content": system_msg},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.7,
            max_tokens=400
        )
        content = response.get("text", "")
        logger.debug(f"LLM raw response for questions: {content[:300]}")

        # Use robust parser
        parsed = _parse_llm_questions(content, count)
        if parsed and len(parsed) > 0:
            # Pad with fallback questions if needed
            if len(parsed) < count:
                extra = _get_fallback_questions(mood_label, count - len(parsed), language)
                parsed.extend(extra)
            return parsed[:count]

        logger.warning("Could not parse LLM response, using fallback questions")
        return _get_fallback_questions(mood_label, count, language)

    except Exception as e:
        logger.error(f"LLM call failed: {e}")
        return _get_fallback_questions(mood_label, count, language)


def _get_fallback_questions(mood: Optional[str], count: int, language: str) -> List[str]:
    """Fallback questions bank with language support."""
    if language == "vi":
        # Vietnamese questions
        question_banks = {
            "happy": [
                "Điều gì cụ thể đã làm bạn cảm thấy hạnh phúc hôm nay?",
                "Làm thế nào để bạn duy trì năng lượng tích cực này?",
                "Ai đã góp phần mang lại niềm vui cho bạn hôm nay?",
            ],
            "sad": [
                "Điều gì đã an ủi bạn trong những lúc khó khăn?",
                "Bạn cần sự hỗ trợ gì ngay lúc này?",
                "Một điều nhỏ có thể mang lại sự dễ chịu cho bạn là gì?",
            ],
            "anxious": [
                "Điều gì nằm trong tầm kiểm soát của bạn ngay bây giờ?",
                "Bằng chứng nào thách thức những lo lắng của bạn?",
                "Kỹ thuật nào giúp bạn cảm thấy vững vàng hơn?",
            ],
            "angry": [
                "Ranh giới nào có thể cần được quan tâm?",
                "Nhu cầu ẩn sau cảm xúc này là gì?",
                "Làm thế nào để bạn chuyển hóa năng lượng này một cách tích cực?",
            ],
            "tired": [
                "Nghỉ ngơi thực sự trông như thế nào với bạn?",
                "Điều gì đang lấy đi năng lượng của bạn mà bạn có thể buông bỏ?",
                "Một thay đổi nhỏ nào có thể giúp ngày mai dễ dàng hơn?",
            ]
        }
        default_questions = [
            "Điều gì khiến bạn mỉm cười hôm nay?",
            "Điều gì thử thách bạn hôm nay?",
            "Bạn biết ơn điều gì hôm nay?",
            "Hôm nay bạn đã chăm sóc bản thân thế nào?",
            "Bạn học được gì về bản thân hôm nay?",
            "Ai đã tác động tích cực đến ngày của bạn?",
            "Bạn muốn làm gì khác đi vào ngày mai?",
            "Bạn đang mong chờ điều gì?"
        ]
    else:
        # English questions
        question_banks = {
            "happy": [
                "What specifically made you feel happy today?",
                "How can you carry this positive energy forward?",
                "Who contributed to your happiness today?",
            ],
            "sad": [
                "What comforted you during difficult moments?",
                "What support would be helpful right now?",
                "What's one small thing that could bring you comfort?",
            ],
            "anxious": [
                "What's within your control right now?",
                "What evidence challenges your worries?",
                "What grounding techniques might help?",
            ],
            "angry": [
                "What boundary might need attention?",
                "What's the underlying need behind this feeling?",
                "How can you channel this energy constructively?",
            ],
            "tired": [
                "What would genuine rest look like for you?",
                "What's draining your energy that you could release?",
                "What small adjustment could make tomorrow easier?",
            ]
        }
        default_questions = [
            "What made you smile today?",
            "What challenged you today?",
            "What are you grateful for today?",
            "How did you take care of yourself today?",
            "What did you learn about yourself today?",
            "Who made a positive impact on your day?",
            "What would you like to do differently tomorrow?",
            "What are you looking forward to?"
        ]

    # Partial match: find the first key that appears in the mood label
    matched_bank = None
    if mood:
        mood_lower = mood.lower()
        for key in question_banks:
            if key in mood_lower:
                matched_bank = question_banks[key]
                break

    if matched_bank:
        num_mood = min(2, len(matched_bank))
        selected = random.sample(matched_bank, num_mood)
        remaining = count - len(selected)
        if remaining > 0:
            selected.extend(random.sample(default_questions, min(remaining, len(default_questions))))
        return selected[:count]
    else:
        return random.sample(default_questions, min(count, len(default_questions)))