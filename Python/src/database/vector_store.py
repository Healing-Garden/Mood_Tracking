import chromadb
from chromadb.config import Settings as ChromaSettings
from typing import List, Dict, Any, Optional
import numpy as np
import logging
from src.config import settings

logger = logging.getLogger(__name__)

class VectorStore:
    """ChromaDB vector store for semantic search"""
    def __init__(self):
        self.client: Optional[chromadb.HttpClient] = None
        self.collections: Dict[str, chromadb.Collection] = {}
        
    async def connect(self):
        """Connect to ChromaDB"""
        try:
            self.client = chromadb.HttpClient(
                host=settings.chromadb_host,
                port=settings.chromadb_port
            )
            
            # Test connection
            self.client.heartbeat()
            logger.info("Connected to ChromaDB")
            
        except Exception as e:
            logger.error(f"Failed to connect to ChromaDB: {e}")
            # Fallback to local persistent client
            try:
                self.client = chromadb.PersistentClient(
                    path=settings.chromadb_persist_directory
                )
                logger.info("Connected to local ChromaDB")
            except Exception as inner_e:
                logger.error(f"Failed to connect to local ChromaDB: {inner_e}")
                raise
    
    async def disconnect(self):
        """Disconnect from ChromaDB"""
        self.client = None
        self.collections = {}
        logger.info("Disconnected from ChromaDB")
    
    def get_collection(self, name: str, create: bool = True) -> chromadb.Collection:
        """Get or create collection"""
        if name in self.collections:
            return self.collections[name]
        
        try:
            if create:
                # Use cosine similarity by default for semantic search
                collection = self.client.get_or_create_collection(
                    name=name,
                    metadata={"hnsw:space": "cosine"}
                )
            else:
                collection = self.client.get_collection(name=name)
            
            self.collections[name] = collection
            return collection
            
        except Exception as e:
            logger.error(f"Failed to get collection {name}: {e}")
            raise
    
    async def add_documents(
        self,
        collection_name: str,
        documents: List[str],
        embeddings: List[List[float]],
        metadatas: List[Dict[str, Any]],
        ids: List[str]
    ):
        """Add documents to vector store"""
        try:
            collection = self.get_collection(collection_name)
            
            # Add in batches to avoid memory issues
            batch_size = 100
            for i in range(0, len(documents), batch_size):
                batch_end = min(i + batch_size, len(documents))
                
                collection.add(
                    embeddings=embeddings[i:batch_end],
                    documents=documents[i:batch_end],
                    metadatas=metadatas[i:batch_end],
                    ids=ids[i:batch_end]
                )
            
            logger.info(f"Added {len(documents)} documents to collection '{collection_name}'")
            
        except Exception as e:
            logger.error(f"Failed to add documents: {e}")
            raise
    
    async def query(
        self,
        collection_name: str,
        query_embeddings: List[List[float]],
        n_results: int = 10,
        where: Optional[Dict] = None,
        where_document: Optional[Dict] = None
    ) -> Dict[str, Any]:
        """Query vector store"""
        try:
            collection = self.get_collection(collection_name)
            
            results = collection.query(
                query_embeddings=query_embeddings,
                n_results=n_results,
                where=where,
                where_document=where_document
            )
            
            return results
            
        except Exception as e:
            logger.error(f"Failed to query vector store: {e}")
            return {"ids": [], "documents": [], "metadatas": [], "distances": []}
    
    async def delete(
        self,
        collection_name: str,
        ids: Optional[List[str]] = None,
        where: Optional[Dict] = None
    ):
        """Delete from vector store"""
        try:
            collection = self.get_collection(collection_name, create=False)
            
            if ids:
                collection.delete(ids=ids)
            elif where:
                collection.delete(where=where)
            
            logger.info(f"Deleted from collection '{collection_name}'")
            
        except Exception as e:
            logger.error(f"Failed to delete from vector store: {e}")
    
    def get_stats(self, collection_name: str) -> Dict[str, Any]:
        """Get collection statistics"""
        try:
            collection = self.get_collection(collection_name, create=False)
            
            # ChromaDB doesn't have a direct count method in current version
            # This is a workaround
            results = collection.peek(limit=1)
            count = len(results.get("ids", [0])) if results.get("ids") else 0
            
            return {
                "collection_name": collection_name,
                "document_count": count,
                "exists": True
            }
            
        except Exception as e:
            logger.error(f"Failed to get collection stats: {e}")
            return {"collection_name": collection_name, "exists": False}

# Global vector store instance
vector_store = VectorStore()