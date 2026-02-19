import logging
import asyncio
import random
from typing import Dict, Any, Optional, List
from src.core.sentiment import sentiment_analyzer
from src.core.crisis_detection import detect_crisis, get_crisis_response
from src.core.cbt_knowledge import cbt_kb
from src.core.gemini_client import gemini_client
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
        
        # 2. Sentiment analysis
        sentiment_result = await asyncio.to_thread(sentiment_analyzer.analyze_journal_entry, user_input)
        
        # Xác định giai đoạn hiện tại
        current_state = session_state.get("state", "initial")
        user_message_count = 1  
        if conversation_history:
            user_message_count += sum(1 for msg in conversation_history if msg.get('sender') == 'user')
        
        # 3. Retrieve CBT techniques
        query = f"{user_input} {sentiment_result['dominant_emotion']}"

        if current_state in ["initial", "assessment"]:
            techniques = await cbt_kb.retrieve_techniques(query=query, category="exploratory", k=2)
        else:
            techniques = await cbt_kb.retrieve_techniques(query, k=3)

        # 4. Generate response với Gemini
        response_text = await self._generate_with_gemini(
            user_input,
            sentiment_result,
            user_context,
            conversation_history,
            techniques,
            user_message_count,
            current_state
        )

        # Fallback nếu Gemini không hoạt động
        if not response_text:
            logger.warning("Gemini returned empty, falling back to rule-based")
            response_text = self._rule_based_response(user_input, sentiment_result, techniques, conversation_history, current_state)
        
        # 5. Xác định kỹ thuật và exercise
        technique_used = techniques[0]['metadata'].get('technique') if techniques else None
        exercise = None

        # Chỉ gắn exercise nếu:
        # - Không phải crisis
        # - Đã qua giai đoạn initial/assessment
        # - Đã có ít nhất 3 tin nhắn (hoặc theo logic khác)
        # - Response chưa chứa gợi ý exercise
        if not is_crisis and current_state == "intervention" and user_message_count >= 3:
            if not any(kw in response_text.lower() for kw in ["try this", "exercise", "breath", "grounding"]):
                if techniques and techniques[0]['metadata'].get('category') not in ['exploratory']:
                    exercise = techniques[0]['text']
                    # IMPORTANT: do not duplicate the exercise inside `text`.
                    # Frontend renders `exercise` in a dedicated block.
        
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
    
    async def _generate_with_gemini(
        self,
        user_input: str,
        sentiment: Dict,
        user_context: Optional[Dict],
        history: Optional[List],
        techniques: List[Dict],
        user_message_count: int,
        current_state: str
    ) -> Optional[str]:
        """Xây dựng system instruction và prompt, gọi Gemini."""
        if not gemini_client.api_key:
            return None

        # 1. Tạo system instruction
        system_instruction = self._build_system_instruction(
            sentiment, user_context, techniques, user_message_count, current_state
        )

        # 2. Tạo conversation prompt (lịch sử + input)
        conversation_prompt = self._build_conversation_prompt(user_input, history)

        # 3. Gọi Gemini
        response = await gemini_client.generate_response(
            prompt=conversation_prompt,
            system_instruction=system_instruction
        )
        return response
    
    def _build_system_instruction(self, sentiment: Dict, user_context: Optional[Dict],
                                  techniques: List[Dict], user_message_count: int,
                                  current_state: str) -> str:
        """Tạo system instruction cho Gemini."""
        context_str = ""
        if user_context:
            recent_moods = user_context.get("recentMoods", [])
            context_str = f"User mood history: {recent_moods[:3]}"

        sentiment_label = sentiment['sentiment']['sentiment']
        primary_emotion = sentiment['dominant_emotion']

        if current_state in ["initial", "assessment"] or user_message_count < 3:
            guidance = "Your priority now is to ask open-ended questions to explore the user's feelings and thoughts. Do not suggest any exercise yet."
        else:
            guidance = "You have gathered enough information. You may now gently suggest a simple CBT exercise or reframe, but only if appropriate and the user seems receptive."

        techniques_text = ""
        if techniques:
            techniques_text = "Relevant CBT techniques you might consider:\n"
            for t in techniques:
                techniques_text += f"- {t['text']} (type: {t['metadata'].get('category')})\n"

        instruction = f"""You are a compassionate AI assistant trained in Cognitive Behavioral Therapy (CBT). Your role is to provide psychological first aid: validate feelings, gently explore the user's thoughts and emotions, and only after understanding the situation, offer a small exercise if appropriate.

Important: You must respond in the SAME LANGUAGE as the user. If the user writes in Vietnamese, you must reply in Vietnamese. If they write in English, reply in English.

Guidelines:
- Always respond with warmth, empathy, and non-judgmental language.
- {guidance}
- Keep responses concise (2-3 sentences) but exploratory.
- Do NOT diagnose or claim to be a therapist.

User context: {context_str}
Current sentiment: {sentiment_label} (primary emotion: {primary_emotion})

{techniques_text}

Now respond to the user's message following the guidelines above."""
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

        candidates = templates.get(key, templates[('neutral', None, lang)])

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