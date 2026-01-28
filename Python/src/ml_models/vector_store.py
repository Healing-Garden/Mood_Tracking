import numpy as np
from typing import List, Dict, Any, Optional, Tuple
import logging
import faiss
import pickle
import os
from datetime import datetime
from src.config import settings

logger = logging.getLogger(__name__)

class VectorStore:
    """FAISS vector store for efficient similarity search"""
    
    def __init__(self):
        self.index = None
        self.id_to_index = {}  # Map MongoDB IDs to FAISS indices
        self.index_to_data = {}  # Store metadata for each index
        self.next_index = 0
        self.dimension = 384  # Dimension of embeddings
        
    def initialize(self, dimension: int = 384):
        """Initialize FAISS index"""
        self.dimension = dimension
        self.index = faiss.IndexFlatIP(dimension)  # Inner Product (cosine similarity)
        logger.info(f"Initialized FAISS index with dimension {dimension}")
    
    def add_vectors(self, vectors: List[np.ndarray], ids: List[str], metadata: List[Dict] = None):
        """Add vectors to the index"""
        if self.index is None:
            self.initialize(self.dimension)
        
        # Convert list to numpy array
        vectors_np = np.array(vectors).astype('float32')
        
        # Normalize for cosine similarity
        faiss.normalize_L2(vectors_np)
        
        # Add to index
        start_idx = self.next_index
        self.index.add(vectors_np)
        
        # Store mappings
        for i, vec_id in enumerate(ids):
            idx = start_idx + i
            self.id_to_index[vec_id] = idx
            if metadata:
                self.index_to_data[idx] = {
                    "id": vec_id,
                    "metadata": metadata[i] if i < len(metadata) else {},
                    "added_at": datetime.now()
                }
        
        self.next_index += len(vectors)
        logger.info(f"Added {len(vectors)} vectors to FAISS index")
    
    def search(self, query_vector: np.ndarray, k: int = 10, filter_ids: List[str] = None) -> List[Dict[str, Any]]:
        """Search for similar vectors"""
        if self.index is None or self.index.ntotal == 0:
            return []
        
        # Prepare query vector
        query_np = np.array([query_vector]).astype('float32')
        faiss.normalize_L2(query_np)
        
        # Search
        distances, indices = self.index.search(query_np, min(k * 2, self.index.ntotal))
        
        results = []
        for i, (distance, idx) in enumerate(zip(distances[0], indices[0])):
            if idx == -1:  # No more results
                continue
            
            # Get data for this index
            if idx in self.index_to_data:
                data = self.index_to_data[idx]
                
                # Apply filtering if needed
                if filter_ids and data["id"] not in filter_ids:
                    continue
                
                results.append({
                    "id": data["id"],
                    "score": float(distance),
                    "metadata": data["metadata"]
                })
            
            if len(results) >= k:
                break
        
        return results
    
    def remove_vectors(self, ids: List[str]):
        """Remove vectors by ID"""
        # FAISS doesn't support removal directly, so we need to rebuild
        # This is a simplified version - in production, consider using index with ID mapping
        indices_to_remove = [self.id_to_index.get(id_) for id_ in ids if id_ in self.id_to_index]
        
        for id_ in ids:
            if id_ in self.id_to_index:
                idx = self.id_to_index[id_]
                del self.id_to_index[id_]
                if idx in self.index_to_data:
                    del self.index_to_data[idx]
        
        logger.info(f"Marked {len(indices_to_remove)} vectors for removal")
        # Note: Actual removal would require rebuilding the index
    
    def save(self, filepath: str):
        """Save index to disk"""
        if self.index is None:
            return False
        
        try:
            # Create directory if it doesn't exist
            os.makedirs(os.path.dirname(filepath), exist_ok=True)
            
            # Save FAISS index
            faiss.write_index(self.index, f"{filepath}.faiss")
            
            # Save metadata
            with open(f"{filepath}.meta", "wb") as f:
                pickle.dump({
                    "id_to_index": self.id_to_index,
                    "index_to_data": self.index_to_data,
                    "next_index": self.next_index,
                    "dimension": self.dimension
                }, f)
            
            logger.info(f"Saved vector store to {filepath}")
            return True
        except Exception as e:
            logger.error(f"Failed to save vector store: {e}")
            return False
    
    def load(self, filepath: str):
        """Load index from disk"""
        try:
            # Load FAISS index
            self.index = faiss.read_index(f"{filepath}.faiss")
            
            # Load metadata
            with open(f"{filepath}.meta", "rb") as f:
                data = pickle.load(f)
                self.id_to_index = data["id_to_index"]
                self.index_to_data = data["index_to_data"]
                self.next_index = data["next_index"]
                self.dimension = data["dimension"]
            
            logger.info(f"Loaded vector store from {filepath}")
            return True
        except Exception as e:
            logger.error(f"Failed to load vector store: {e}")
            return False
    
    def get_stats(self) -> Dict[str, Any]:
        """Get statistics about the vector store"""
        return {
            "total_vectors": self.index.ntotal if self.index else 0,
            "dimension": self.dimension,
            "unique_ids": len(self.id_to_index),
            "has_index": self.index is not None
        }

# Global vector store instance
vector_store = VectorStore()