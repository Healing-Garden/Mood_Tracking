import numpy as np
from typing import List, Dict, Any, Optional
import logging
import logging
# Lazy load sentence-transformers and torch
# from sentence_transformers import SentenceTransformer
# import torch
from src.config import settings
from src.database.redis_client import redis_client

logger = logging.getLogger(__name__)

class EmbeddingService:
    """Service for text embeddings using Sentence Transformers"""
    
    def __init__(self):
        self.model = None
        self.device = "cpu"
        
    async def initialize(self):
        """Initialize embedding model"""
        try:
            from sentence_transformers import SentenceTransformer
            import torch
            
            self.device = "cuda" if torch.cuda.is_available() else "cpu"
            logger.info(f"Loading embedding model: {settings.embedding_model} on {self.device}")
            
            self.model = SentenceTransformer(
                settings.embedding_model,
                device=self.device,
                cache_folder=settings.models_cache_dir
            )
            
            # Test the model
            test_embedding = self.model.encode(["test"], show_progress_bar=False)
            logger.info(f"Embedding model loaded. Dimension: {test_embedding.shape[1]}")
            
        except Exception as e:
            logger.error(f"Failed to load embedding model: {e}")
            raise
    
    def encode(self, texts: List[str], batch_size: int = None) -> np.ndarray:
        """Encode texts to embeddings"""
        if not self.model:
            raise RuntimeError("Embedding model not initialized")
        
        if batch_size is None:
            batch_size = settings.embedding_batch_size
        
        return self.model.encode(
            texts,
            batch_size=batch_size,
            show_progress_bar=False,
            convert_to_numpy=True
        )
    
    async def encode_with_cache(
        self, 
        texts: List[str], 
        cache_key_prefix: str = "embedding",
        expire: int = 86400  # 24 hours
    ) -> List[List[float]]:
        """Encode texts with Redis caching"""
        if not texts:
            return []
        
        embeddings = []
        texts_to_encode = []
        cache_keys = []
        
        # Check cache for each text
        for text in texts:
            cache_key = f"{cache_key_prefix}:{hash(text)}"
            cached = await redis_client.get(cache_key)
            
            if cached:
                embeddings.append(cached)
            else:
                texts_to_encode.append(text)
                cache_keys.append(cache_key)
        
        # Encode texts not in cache
        if texts_to_encode:
            new_embeddings = self.encode(texts_to_encode)
            
            # Cache new embeddings
            for text, embedding, cache_key in zip(texts_to_encode, new_embeddings, cache_keys):
                embedding_list = embedding.tolist()
                await redis_client.set(cache_key, embedding_list, expire)
                embeddings.append(embedding_list)
        
        return embeddings
    
    def similarity(self, embedding1: np.ndarray, embedding2: np.ndarray) -> float:
        """Calculate cosine similarity between two embeddings"""
        from numpy.linalg import norm
        return np.dot(embedding1, embedding2) / (norm(embedding1) * norm(embedding2))
    
    async def batch_similarity(
        self, 
        query_embedding: np.ndarray, 
        target_embeddings: np.ndarray
    ) -> np.ndarray:
        """Calculate similarities between query and multiple targets"""
        query_norm = np.linalg.norm(query_embedding)
        target_norms = np.linalg.norm(target_embeddings, axis=1)
        dot_products = np.dot(target_embeddings, query_embedding)
        
        # Avoid division by zero
        nonzero_norms = target_norms > 0
        similarities = np.zeros(len(target_embeddings))
        
        if query_norm > 0 and np.any(nonzero_norms):
            similarities[nonzero_norms] = dot_products[nonzero_norms] / (target_norms[nonzero_norms] * query_norm)
        
        return similarities

# Global embedding service instance
embedding_service = EmbeddingService()