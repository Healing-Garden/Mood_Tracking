import logging
import asyncio
import random
from typing import Dict, Any, Optional, List
from src.core.sentiment import sentiment_analyzer
from src.core.crisis_detection import detect_crisis, get_crisis_response
from src.core.cbt_knowledge import cbt_kb
from src.core.gemini_client import gemini_client
from src.core.llm import call_llm
from src.config import settings

logger = logging.getLogger(__name__)

class CBTChatAgent:
    def __init__(self):
        pass
    
    async def process_message(
        self,
        user_input: str,
        session_state: Dict[str, Any],
        user_context: Optional[Dict[str, Any]] = None,
        conversation_history: Optional[List[Dict[str, Any]]] = None,
    ) -> Dict[str, Any]:

        # 1. Crisis detection
        is_crisis, risk_level, language = detect_crisis(user_input)
        if is_crisis:
            if not language:
                language = "vi" if self._is_vietnamese(user_input) else "en"
                
            return {
                "text": get_crisis_response(language),
                "is_crisis": True,
                "risk_level": risk_level,
                "next_state": "crisis",
                "sentiment": None,
                "technique": None,
                "exercise": None,
                "intent": "crisis_response",
            }
        
        # 2 & 3. Sentiment analysis AND Retrieval
        current_state = session_state.get("state", "initial")
        user_message_count = 1
        if conversation_history:
            user_message_count += sum(1 for msg in conversation_history if msg.get('sender') == 'user')

        # Detect language early to filter techniques and select exercise
        is_vi = self._is_vietnamese(user_input)
        lang = "vi" if is_vi else "en"
        
        query = user_input
        sentiment_task = asyncio.to_thread(sentiment_analyzer.analyze_journal_entry, user_input)
        
        if current_state in ["initial", "assessment"]:
            # Exploration phase: fetch exploratory questions in user's language only
            techniques_task = cbt_kb.retrieve_techniques(query=query, category="exploratory", k=3, lang=lang)
        else:
            # Intervention phase: fetch all technique types in user's language  
            techniques_task = cbt_kb.retrieve_techniques(query, k=6, lang=lang)
            
        # Execute both tasks concurrently
        sentiment_result, techniques = await asyncio.gather(sentiment_task, techniques_task)
        
        # 4. Generate response with LLM (Prefer OpenAI for ChatBot)
        response_text = await self._generate_with_openai(
            user_input,
            sentiment_result,
            user_context,
            conversation_history,
            techniques,
            user_message_count,
            current_state
        )

        # Fallback if AI fails completely
        if not response_text:
            logger.warning("AI returned empty, falling back to rule-based")
            response_text = self._rule_based_response(user_input, sentiment_result, techniques, conversation_history, current_state)
        
        # 5. Xác định kỹ thuật và exercise
        technique_used = techniques[0]['metadata'].get('technique') if techniques else None
        exercise = None

        # Exercise is shown ONLY when:
        # - Not a crisis
        # - State is "intervention" (user has gone through exploration)
        # - User has sent >= 4 messages (enough context collected)
        # - The LLM response itself doesn't already contain exercise text
        should_show_exercise = (
            not is_crisis
            and current_state == "intervention"
            and user_message_count >= 4
        )
        if should_show_exercise:
            response_lower = response_text.lower()
            already_has_exercise = any(
                kw in response_lower
                for kw in ["try this", "exercise", "breath", "grounding", "thở", "kỹ thuật", "bài tập"]
            )
            if not already_has_exercise:
                # Pick first technique that:
                # (a) matches user's language  (b) is NOT exploratory category
                intervention_techniques = [
                    t for t in techniques
                    if t['metadata'].get('category') not in ['exploratory']
                    and t['metadata'].get('lang') == lang
                ]
                if intervention_techniques:
                    exercise = intervention_techniques[0]['text']
                    logger.info(
                        f"[CBT] Exercise shown — lang={lang}, msgs={user_message_count}, "
                        f"technique: {exercise[:50]}..."
                    )
                elif techniques:
                    # Fallback: any non-exploratory technique (no language restriction)
                    fallback = [
                        t for t in techniques
                        if t['metadata'].get('category') not in ['exploratory']
                    ]
                    if fallback:
                        exercise = fallback[0]['text']
        
        # 6. Xác định next state
        next_state = self._determine_next_state(session_state, sentiment_result, user_message_count)
        
        return {
            "text": response_text,
            "sentiment": sentiment_result,
            "intent": "cbt_response",
            "technique": technique_used,
            "exercise": exercise,
            "is_crisis": False,
            "risk_level": session_state.get("riskLevel", 0),
            "next_state": next_state,
        }
    
    async def _generate_with_openai(
        self,
        user_input: str,
        sentiment: Dict,
        user_context: Optional[Dict],
        history: Optional[List],
        techniques: List[Dict],
        user_message_count: int,
        current_state: str
    ) -> Optional[str]:
        """Xây dựng messages cho OpenAI (hoặc LLM chung), ưu tiên OpenAI."""
        
        # 1. Tạo system instruction
        system_instruction = self._build_system_instruction(
            sentiment, user_context, techniques, user_message_count, current_state
        )

        # 2. Xây dựng danh sách messages (OpenAI format)
        messages = [{"role": "system", "content": system_instruction}]
        
        # Thêm lịch sử nếu có
        if history:
            history_len = len(history)
            recent = history[max(0, history_len-5):history_len]
            for msg in recent:
                role = "user" if msg['sender'] == 'user' else "assistant"
                messages.append({"role": role, "content": msg['text']})
        
        # Thêm input hiện tại
        messages.append({"role": "user", "content": user_input})

        # 3. Gọi LLM qua wrapper (ưu tiên OpenAI)
        result = await call_llm(messages=messages, temperature=settings.gemini_temperature)
        return result.get("text")
    
    def _build_system_instruction(self, sentiment: Dict, user_context: Optional[Dict],
                                  techniques: List[Dict], user_message_count: int,
                                  current_state: str) -> str:
        """Tạo system instruction cho LLM."""
        context_str = ""
        if user_context:
            recent_moods = user_context.get("recentMoods", [])
            context_str = f"User mood history: {recent_moods[:3]}"

        sentiment_label = sentiment['sentiment']['sentiment']
        primary_emotion = sentiment['dominant_emotion']

        if current_state in ["initial", "assessment"] or user_message_count < 4:
            guidance = (
                "STRICT RULE — EXPLORATION PHASE:\n"
                "  1. Validate the user's feelings with empathy (1 sentence).\n"
                "  2. Ask exactly ONE open-ended question to explore further (1-2 sentences).\n"
                "  PROHIBITED: Do NOT mention, hint at, or suggest any exercise, breathing technique,\n"
                "  grounding activity, or coping strategy. Absolutely zero. Even if it feels helpful.\n"
                "  Keep total response to 2-3 sentences."
            )
        else:
            guidance = (
                "INTERVENTION PHASE:\n"
                "  You now have sufficient context. Provide a brief cognitive reframe or validation.\n"
                "  You may mention that a helpful activity will be shown below (a dedicated card).\n"
                "  Focus on the emotional reframe, not the exercise details themselves."
            )

        instruction = f"""You are Daisy, a CBT-trained (Cognitive Behavioral Therapy) support companion.
You are NOT a free-chat AI. Every response must strictly follow CBT methodology.

SESSION STRUCTURE:
  Phase 1 — Exploration (initial/assessment, <4 messages from user):
    * Listen, validate, explore. One question only. No exercises.
  Phase 2 — Intervention (intervention, ≥4 messages from user):
    * Validate, reframe, bridge toward the exercise shown in the card below.

CURRENT PHASE INSTRUCTION:
{guidance}

LANGUAGE RULE (MANDATORY, NO EXCEPTIONS):
- Detect the language of the user's latest message.
- Vietnamese → respond 100% in Vietnamese. Use no English words or terms.
- English → respond 100% in English. Use no Vietnamese words or terms.
- STRICTLY ONE LANGUAGE PER RESPONSE.

CBT CONSTRAINTS:
- Only use CBT-based language: validation, Socratic questioning, cognitive reframing.
- Do NOT give generic life advice, diagnoses, or advice outside CBT scope.
- Do NOT invent techniques. Stick to the structured CBT approach.

Context:
  User sentiment: {sentiment_label} | Primary emotion: {primary_emotion}
  {f"Recent moods: {context_str}" if context_str else ""}

Respond now. Be warm, structured, and CBT-compliant."""
        return instruction
    
    def _build_conversation_prompt(self, user_input: str, history: Optional[List]) -> str:
        """Tạo prompt chứa lịch sử hội thoại."""
        if not history:
            return user_input

        recent = history[-5:]
        conversation = ""
        for msg in recent:
            sender = "User" if msg['sender'] == 'user' else "Assistant"
            conversation += f"{sender}: {msg['text']}\n"
        conversation += f"User: {user_input}"
        return conversation
    
    def _rule_based_response(self, user_input: str, sentiment: Dict, techniques: List[Dict],
                             history: Optional[List], current_state: str) -> str:
        # Nếu có techniques, ưu tiên dùng
        if techniques:
            # Nếu đang trong giai đoạn thăm dò, ưu tiên exploratory
            if current_state in ["initial", "assessment"]:
                exploratory = [t for t in techniques if t['metadata'].get('category') == 'exploratory']
                if exploratory:
                    return exploratory[0]['text']
            # Nếu không, dùng technique đầu tiên, biến thành câu hỏi nếu cần
            technique = techniques[0]
            text = technique['text']
            if '?' in text:
                return text
            return f"Bạn nghĩ sao về điều này: {text}?"

        # Không có technique -> dùng template tránh lặp
        last_bot_msg = ""
        if history:
            for msg in reversed(history):
                if msg['sender'] == 'bot':
                    last_bot_msg = msg['text']
                    break

        sentiment_label = sentiment['sentiment']['sentiment']
        primary = sentiment['dominant_emotion']
        lang = "vi" if self._is_vietnamese(user_input) else "en"

        templates = {
            ('negative', 'sadness', 'vi'): [
                "Mình nghe bạn nói rằng bạn đang cảm thấy rất mệt mỏi. Cảm giác đó là bình thường. Bạn có thể chia sẻ thêm điều gì đang làm bạn lo lắng không?",
                "Có vẻ như hôm nay bạn gặp nhiều áp lực. Bạn muốn nói thêm về điều đó không?",
                "Mình ở đây với bạn. Điều gì khiến bạn buồn nhất lúc này?"
            ],
            ('negative', 'anger', 'vi'): [
                "Có vẻ bạn đang cảm thấy bực bội. Mình hiểu mà. Điều gì đã khiến bạn khó chịu vậy?",
                "Sự tức giận đôi khi che giấu những cảm xúc khác. Bạn có thể kể mình nghe được không?",
                "Mình ở đây để lắng nghe. Chuyện gì đã xảy ra vậy?"
            ],
            ('negative', 'other', 'vi'): [
                "Cảm ơn bạn đã chia sẻ. Thật can đảm khi bạn nói ra những cảm xúc này. Bạn đã cảm thấy như vậy bao lâu rồi?",
                "Điều đó nghe có vẻ khó khăn. Bạn muốn nói thêm về nó không?",
                "Mình đang lắng nghe đây. Hãy chia sẻ bất cứ điều gì bạn cảm thấy."
            ],
            ('positive', None, 'vi'): [
                "Mình rất vui khi thấy bạn cảm thấy tốt hơn! Điều gì đã giúp bạn có sự thay đổi tích cực này?",
                "Thật tuyệt! Bạn có thể kể mình nghe về khoảnh khắc tích cực đó không?",
                "Cảm xúc tích cực rất đáng quý. Bạn đã làm gì để có được nó?"
            ],
            ('neutral', None, 'vi'): [
                "Mình ở đây để lắng nghe. Bạn cần mình hỗ trợ điều gì lúc này?",
                "Hôm nay của bạn thế nào? Bạn có điều gì muốn chia sẻ không?",
                "Mình sẵn sàng lắng nghe bất cứ điều gì bạn nghĩ đến."
            ],
            ('negative', 'sadness', 'en'): [
                "I hear that you're feeling really exhausted. That feeling is completely normal. Could you share more about what's worrying you?",
                "It sounds like you're under a lot of pressure today. Would you like to talk more about it?",
                "I'm here for you. What's making you the saddest right now?"
            ],
            ('negative', 'anger', 'en'): [
                "It seems you're feeling frustrated. I understand. What made you so upset?",
                "Anger sometimes hides other emotions. Can you tell me more?",
                "I'm here to listen. What happened?"
            ],
            ('negative', 'other', 'en'): [
                "Thank you for sharing. It takes courage to express these feelings. How long have you felt this way?",
                "That sounds difficult. Would you like to talk more about it?",
                "I'm listening. Please share whatever you're feeling."
            ],
            ('positive', None, 'en'): [
                "I'm so glad to see you're feeling better! What helped bringing this positive change?",
                "That's wonderful! Can you tell me about that positive moment?",
                "Positive emotions are precious. What did you do to achieve it?"
            ],
            ('neutral', None, 'en'): [
                "I'm here to listen. How can I support you right now?",
                "How is your day going? Do you have anything you'd like to share?",
                "I'm ready to listen to whatever is on your mind."
            ]
        }
        # Tương tự cho tiếng Anh (có thể mở rộng)

        # Xác định key
        if sentiment_label == 'negative':
            if primary in ['sadness', 'fear']:
                key = ('negative', 'sadness', lang)
            elif primary == 'anger':
                key = ('negative', 'anger', lang)
            else:
                key = ('negative', 'other', lang)
        elif sentiment_label == 'positive':
            key = ('positive', None, lang)
        else:
            key = ('neutral', None, lang)

        candidates = templates.get(key, templates.get(('neutral', None, lang), templates[('neutral', None, 'vi')]))

        for candidate in candidates:
            if candidate != last_bot_msg:
                return candidate
        return random.choice(candidates) if candidates else "Mình ở đây để lắng nghe."
            
    def _is_vietnamese(self, text: str) -> bool:
        vietnamese_chars = set('àáảãạăắằẳẵặâấầẩẫậđèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵ')
        return any(c in vietnamese_chars for c in text.lower())
    
    def _determine_next_state(self, session_state: Dict, sentiment: Dict, user_message_count: int) -> str:
        current = session_state.get("state", "initial")
        sentiment_label = sentiment['sentiment']['sentiment']

        if current == "initial":
            return "assessment"
        elif current == "assessment":
            if user_message_count >= 2 and sentiment_label in ['negative', 'neutral']:
                return "intervention"
            else:
                return "assessment"
        elif current == "intervention":
            if sentiment_label == 'positive':
                return "closure"
            else:
                return "intervention"
        else:
            return "closure"

cbt_agent = CBTChatAgent()