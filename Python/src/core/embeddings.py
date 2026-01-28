import numpy as np
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
import logging
from src.ml_models.model_manager import ModelManager
from src.database.mongodb import get_database
from src.database.redis_client import redis_client

logger = logging.getLogger(__name__)

class EmbeddingService:
    def __init__(self):
        self.model_manager = ModelManager.get_instance()
        self.embedding_dimension = 384  # For all-MiniLM-L6-v2
    
    async def create_embedding(self, text: str, metadata: Optional[Dict] = None) -> Dict[str, Any]:
        """Create embedding for text and cache it"""
        
        # Check cache first
        cache_key = f"embedding:{hash(text)}"
        cached = await redis_client.get(cache_key)
        
        if cached:
            logger.debug("Embedding retrieved from cache")
            return cached
        
        # Generate embedding
        vector = self.model_manager.get_embedding(text)
        vector_list = vector.tolist()
        
        result = {
            "vector": vector_list,
            "dimension": self.embedding_dimension,
            "model": "all-MiniLM-L6-v2",
            "created_at": datetime.now().isoformat()
        }
        
        # Cache for 24 hours
        await redis_client.set(cache_key, result, expire=86400)
        
        return result
    
    async def batch_create_embeddings(self, texts: List[str]) -> List[List[float]]:
        """Create embeddings for multiple texts efficiently"""
        vectors = self.model_manager.get_batch_embeddings(texts)
        return vectors.tolist()
    
    async def search_similar(self, query: str, user_id: str, limit: int = 10) -> List[Dict[str, Any]]:
        """Search for similar journal entries using semantic search"""
        
        # Get query embedding
        query_embedding = self.model_manager.get_embedding(query)
        
        # Get user's journal entries with embeddings from MongoDB
        db = await get_database()
        collection = db.journal_entries
        
        # Find entries with embeddings
        entries = await collection.find({
            "user_id": user_id,
            "embedding": {"$exists": True},
            "deleted_at": None
        }).sort("created_at", -1).limit(100).to_list(length=100)
        
        if not entries:
            return []
        
        # Calculate similarities
        results = []
        for entry in entries:
            if "embedding" not in entry:
                continue
            
            entry_embedding = np.array(entry["embedding"])
            similarity = self._cosine_similarity(query_embedding, entry_embedding)
            
            results.append({
                "entry_id": str(entry["_id"]),
                "text": entry.get("text", "")[:200],  # Preview
                "mood": entry.get("mood"),
                "similarity": float(similarity),
                "created_at": entry.get("created_at")
            })
        
        # Sort by similarity and limit
        results.sort(key=lambda x: x["similarity"], reverse=True)
        return results[:limit]
    
    async def update_user_embedding_profile(self, user_id: str):
        """Update user's embedding profile (average of recent embeddings)"""
        db = await get_database()
        collection = db.journal_entries
        
        # Get recent entries with embeddings
        entries = await collection.find({
            "user_id": user_id,
            "embedding": {"$exists": True},
            "deleted_at": None,
            "created_at": {
                "$gte": datetime.now() - timedelta(days=30)
            }
        }).sort("created_at", -1).limit(50).to_list(length=50)
        
        if not entries:
            return None
        
        # Calculate average embedding
        embeddings = [np.array(entry["embedding"]) for entry in entries]
        avg_embedding = np.mean(embeddings, axis=0).tolist()
        
        # Store in user profile or separate collection
        profile_collection = db.user_vector_profiles
        await profile_collection.update_one(
            {"user_id": user_id},
            {
                "$set": {
                    "user_id": user_id,
                    "profile_vector": avg_embedding,
                    "embeddings_count": len(embeddings),
                    "last_updated": datetime.now()
                }
            },
            upsert=True
        )
        
        return avg_embedding
    
    def _cosine_similarity(self, vec1: np.ndarray, vec2: np.ndarray) -> float:
        """Calculate cosine similarity between two vectors"""
        dot_product = np.dot(vec1, vec2)
        norm1 = np.linalg.norm(vec1)
        norm2 = np.linalg.norm(vec2)
        
        if norm1 == 0 or norm2 == 0:
            return 0
        
        return dot_product / (norm1 * norm2)