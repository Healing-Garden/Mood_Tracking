import logging
from typing import List, Dict, Optional
from sentence_transformers import SentenceTransformer
from src.database.vector_store import vector_store
from src.config import settings

logger = logging.getLogger(__name__)

class CBTKnowledgeBase:    
    def __init__(self):
        self.collection_name = "cbt_techniques"
        self.embedder = None
        self._init_embedder()
    
    def _init_embedder(self):
        try:
            self.embedder = SentenceTransformer(settings.embedding_model)
            logger.info(f"Loaded embedding model: {settings.embedding_model}")
        except Exception as e:
            logger.error(f"Failed to load embedding model: {e}")
            raise
    
    async def ensure_collection(self):
        """Đảm bảo collection tồn tại, nếu chưa có thì seed dữ liệu"""
        stats = vector_store.get_stats(self.collection_name)
        if not stats.get("exists") or stats.get("document_count", 0) == 0:
            await self._seed_initial_data()
    
    async def _seed_initial_data(self):
        logger.info("Seeding initial CBT data...")
        
        # Danh sách kỹ thuật CBT 
        documents = [
            "What's been going on in your mind lately?",
            "How does that feeling show up in your body?",
            "Can you tell me more about what triggered this?",
            "What thoughts are running through your head right now?",
            "If this feeling had a shape or color, what would it be?",
            "Cognitive Restructuring: Identify automatic negative thoughts and challenge them with evidence. Ask yourself: 'What evidence supports this thought? What contradicts it?'",
            "Behavioral Activation: Schedule one small pleasant activity today. Even a 5-minute walk can improve your mood.",
            "Mindful Breathing: Inhale for 4 counts, hold for 4, exhale for 4. Repeat 5 times. Focus on the sensation of breathing.",
            "Thought Record: Write down: Situation → Automatic Thought → Emotion → Evidence For/Against → Balanced Thought.",
            "Gratitude Practice: Name three things you're grateful for right now, no matter how small.",
            "Grounding Technique (5-4-3-2-1): Acknowledge 5 things you see, 4 you can touch, 3 you hear, 2 you can smell, 1 you can taste.",
            "Socratic Questioning: 'If your best friend had this thought, what would you tell them?'",
            "Labeling Emotions: Simply name the emotion you're feeling. This reduces its intensity.",
            "Self-Compassion Break: 'This is a moment of suffering. Suffering is part of life. May I be kind to myself.'",
            "Pleasant Activity Scheduling: Plan one activity you used to enjoy, even if you don't feel like it right now.",
        ]
        
        metadatas = [
            {"technique": "exploratory_question", "category": "exploratory", "difficulty": 1},
            {"technique": "exploratory_question", "category": "exploratory", "difficulty": 1},
            {"technique": "exploratory_question", "category": "exploratory", "difficulty": 1},
            {"technique": "exploratory_question", "category": "exploratory", "difficulty": 1},
            {"technique": "exploratory_question", "category": "exploratory", "difficulty": 1},
            {"technique": "cognitive_restructuring", "category": "cognitive", "difficulty": 2},
            {"technique": "behavioral_activation", "category": "behavioral", "difficulty": 1},
            {"technique": "breathing", "category": "grounding", "difficulty": 1},
            {"technique": "thought_record", "category": "cognitive", "difficulty": 3},
            {"technique": "gratitude", "category": "positive", "difficulty": 1},
            {"technique": "grounding_54321", "category": "grounding", "difficulty": 1},
            {"technique": "socratic", "category": "cognitive", "difficulty": 2},
            {"technique": "labeling", "category": "emotion_focus", "difficulty": 1},
            {"technique": "self_compassion", "category": "compassion", "difficulty": 2},
            {"technique": "pleasant_activity", "category": "behavioral", "difficulty": 1},
        ]
        
        ids = [f"cbt_{i}" for i in range(len(documents))]
        
        # Tạo embeddings
        embeddings = self.embedder.encode(documents).tolist()
        
        # Thêm vào vector store
        await vector_store.add_documents(
            collection_name=self.collection_name,
            documents=documents,
            embeddings=embeddings,
            metadatas=metadatas,
            ids=ids
        )
        logger.info(f"Seeded {len(documents)} CBT documents")
    
    async def retrieve_techniques(
        self,
        query: str,
        category: Optional[str] = None,
        k: int = 3
    ) -> List[Dict]:
        """Truy vấn các kỹ thuật CBT phù hợp"""
        # Tạo embedding cho query
        query_emb = self.embedder.encode(query).tolist()
        
        # Filter theo category nếu có
        where = {"category": category} if category else None
        
        results = await vector_store.query(
            collection_name=self.collection_name,
            query_embeddings=[query_emb],
            n_results=k,
            where=where
        )
        
        # Format kết quả
        docs = results.get("documents", [[]])[0]
        metas = results.get("metadatas", [[]])[0]
        distances = results.get("distances", [[]])[0]
        
        return [
            {
                "text": doc,
                "metadata": meta,
                "score": 1 - dist
            }
            for doc, meta, dist in zip(docs, metas, distances)
        ]

cbt_kb = CBTKnowledgeBase()