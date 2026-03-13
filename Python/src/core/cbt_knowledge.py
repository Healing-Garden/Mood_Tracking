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
        
        # Danh sách kỹ thuật CBT (Bilingual)
        documents = [
            # Exploratory (English & Vietnamese)
            "What's been going on in your mind lately?",
            "Dạo này trong lòng bạn đang có chuyện gì thế?",
            "How does that feeling show up in your body?",
            "Cảm giác đó biểu hiện trong cơ thể bạn như thế nào?",
            "Can you tell me more about what triggered this?",
            "Bạn có thể chia sẻ thêm về điều gì đã dẫn đến cảm giác này không?",
            "What thoughts are running through your head right now?",
            "Những suy nghĩ nào đang chạy qua đầu bạn lúc này?",
            "If this feeling had a shape or color, what would it be?",
            "Nếu cảm xúc này có hình dáng hay màu sắc, nó sẽ trông như thế nào?",
            
            # Cognitive / Intervention (English & Vietnamese)
            "Cognitive Restructuring: Identify automatic negative thoughts and challenge them with evidence.",
            "Tái cấu trúc nhận thức: Xác định các suy nghĩ tiêu cực tự động và thử thách chúng bằng bằng chứng thực tế.",
            "Behavioral Activation: Schedule one small pleasant activity today.",
            "Kích hoạt hành vi: Lên kế hoạch cho một hoạt động nhỏ bạn yêu thích trong hôm nay.",
            "Mindful Breathing: Inhale for 4 counts, hold for 4, exhale for 4. Repeat 5 times.",
            "Thở chánh niệm: Hít vào 4 nhịp, giữ 4 nhịp, thở ra 4 nhịp. Lặp lại 5 lần.",
            "Gratitude Practice: Name three things you're grateful for right now.",
            "Thực hành lòng biết ơn: Hãy gọi tên 3 điều bạn cảm thấy biết ơn ngay lúc này.",
            "Grounding Technique (5-4-3-2-1): Acknowledge 5 things you see, 4 you can touch, 3 you hear, 2 you smell, 1 you taste.",
            "Kỹ thuật tiếp đất (5-4-3-2-1): Nhận diện 5 thứ bạn thấy, 4 thứ bạn chạm được, 3 âm thanh, 2 mùi hương, 1 vị giác.",
            "Pleasant Activity Scheduling: Plan one activity you used to enjoy, even if you don't feel like it right now.",
            "Lên lịch hoạt động thú vị: Lên kế hoạch một hoạt động bạn từng yêu thích, dù hiện tại bạn chưa thấy hứng thú lắm."
        ]
        
        metadatas = [
            {"technique": "exploratory_question", "category": "exploratory", "lang": "en"},
            {"technique": "exploratory_question", "category": "exploratory", "lang": "vi"},
            {"technique": "exploratory_question", "category": "exploratory", "lang": "en"},
            {"technique": "exploratory_question", "category": "exploratory", "lang": "vi"},
            {"technique": "exploratory_question", "category": "exploratory", "lang": "en"},
            {"technique": "exploratory_question", "category": "exploratory", "lang": "vi"},
            {"technique": "exploratory_question", "category": "exploratory", "lang": "en"},
            {"technique": "exploratory_question", "category": "exploratory", "lang": "vi"},
            {"technique": "exploratory_question", "category": "exploratory", "lang": "en"},
            {"technique": "exploratory_question", "category": "exploratory", "lang": "vi"},
            {"technique": "cognitive_restructuring", "category": "cognitive", "lang": "en"},
            {"technique": "cognitive_restructuring", "category": "cognitive", "lang": "vi"},
            {"technique": "behavioral_activation", "category": "behavioral", "lang": "en"},
            {"technique": "behavioral_activation", "category": "behavioral", "lang": "vi"},
            {"technique": "breathing", "category": "grounding", "lang": "en"},
            {"technique": "breathing", "category": "grounding", "lang": "vi"},
            {"technique": "gratitude", "category": "positive", "lang": "en"},
            {"technique": "gratitude", "category": "positive", "lang": "vi"},
            {"technique": "grounding_54321", "category": "grounding", "lang": "en"},
            {"technique": "grounding_54321", "category": "grounding", "lang": "vi"},
            {"technique": "pleasant_activity", "category": "behavioral", "lang": "en"},
            {"technique": "pleasant_activity", "category": "behavioral", "lang": "vi"}
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
        k: int = 3,
        lang: Optional[str] = None
    ) -> List[Dict]:
        """Truy vấn các kỹ thuật CBT phù hợp"""
        # Tạo embedding cho query
        query_emb = self.embedder.encode(query).tolist()
        
        # Build ChromaDB where clause
        # ChromaDB requires $and when combining multiple conditions
        filters = []
        if category:
            filters.append({"category": {"$eq": category}})
        if lang:
            filters.append({"lang": {"$eq": lang}})

        if len(filters) == 0:
            where = None
        elif len(filters) == 1:
            where = filters[0]
        else:
            where = {"$and": filters}
            
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