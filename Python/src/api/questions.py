from fastapi import APIRouter
from typing import List, Optional
from datetime import datetime, timedelta
import logging
import json
import re
import random
from pydantic import BaseModel

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
            mood_doc = await db.mood_entries.find_one(
                {"user_id": user_id, "created_at": {"$gte": datetime.now() - timedelta(hours=24)}},
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
        snippets = snippets[:3]

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

async def _generate_questions(recent_mood: Optional[str], snippets: List[str],
                              avoid_questions: List[str], count: int, language: str) -> List[str]:
    """Generate questions using LLM with language support."""
    
    # System message theo ngôn ngữ
    if language == "vi":
        system_msg = "Bạn là trợ lý sức khỏe tinh thần, chuyên tạo các câu hỏi viết nhật ký mang tính đồng cảm và khuyến khích."
    else:
        system_msg = "You are a compassionate mental health assistant that generates open-ended, empathetic journaling questions."

    # Xây dựng snippets text
    if snippets:
        snippets_text = "\n".join([f"- {s}" for s in snippets])
    else:
        snippets_text = "No recent journal entries available." if language == "en" else "Không có dữ liệu nhật ký gần đây."

    avoid_text = ", ".join(avoid_questions[:3]) if avoid_questions else ("None" if language == "en" else "Không có")

    # User prompt theo ngôn ngữ
    if language == "vi":
        user_prompt = f"""Hãy tạo {count} câu hỏi mở, đồng cảm để gợi ý viết nhật ký.

Tâm trạng gần đây: {recent_mood or 'Không xác định'}

Các đoạn nhật ký trước đây của người dùng (để tham khảo):
{snippets_text}

Hướng dẫn:
- Câu hỏi phải tích cực, khích lệ, không phán xét (BR-18-02).
- Tránh câu hỏi đóng (có/không); hãy để người dùng suy ngẫm.
- Liên quan đến tâm trạng hiện tại và trải nghiệm quá khứ nếu có thể.
- KHÔNG lặp lại các câu hỏi đã hỏi gần đây: {avoid_text}

Trả về chính xác {count} câu hỏi dưới dạng mảng JSON.
Ví dụ: ["Điều gì nhỏ bé đã mang lại bình yên cho bạn hôm nay?", "Bạn có thể làm một việc gì đó để chăm sóc bản thân ngay lúc này?"]
"""
    else:
        user_prompt = f"""Generate {count} open-ended, empathetic journaling questions.

Recent mood: {recent_mood or 'Not specified'}

Relevant past journal entries (for context):
{snippets_text}

Guidelines:
- Questions must be positive, encouraging, and non-judgmental (BR-18-02).
- Avoid yes/no questions; they should invite reflection.
- Relate to the user's current mood and past experiences if possible.
- Do NOT repeat these recently asked questions: {avoid_text}

Return exactly {count} questions as a JSON array of strings.
Example: ["What brought you a moment of peace today?", "What is one small step you can take to nurture yourself?"]
"""

    try:
        response = await call_llm(
            messages=[
                {"role": "system", "content": system_msg},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.7,
            max_tokens=300
        )
        content = response.get("text", "")
        json_match = re.search(r'\[.*\]', content, re.DOTALL)
        if json_match:
            questions = json.loads(json_match.group())
        else:
            questions = [line.strip() for line in content.split('\n') if line.strip() and not line.startswith('[')]
        questions = questions[:count]
        if len(questions) < count:
            fallback = _get_fallback_questions(recent_mood, count - len(questions), language)
            questions.extend(fallback)
        return questions
    except Exception as e:
        logger.error(f"LLM call failed: {e}")
        return _get_fallback_questions(recent_mood, count, language)

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

    if mood and mood.lower() in question_banks:
        mood_questions = question_banks[mood.lower()]
        num_mood = min(2, len(mood_questions))
        selected = random.sample(mood_questions, num_mood)
        remaining = count - len(selected)
        if remaining > 0:
            selected.extend(random.sample(default_questions, min(remaining, len(default_questions))))
        return selected[:count]
    else:
        return random.sample(default_questions, min(count, len(default_questions)))