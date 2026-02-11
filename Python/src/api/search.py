from fastapi import APIRouter, HTTPException
from typing import List, Optional
import logging
from pydantic import BaseModel
from src.database import mongodb, vector_store
from src.core.embeddings import embedding_service
import numpy as np

router = APIRouter()
logger = logging.getLogger(__name__)

class SearchRequest(BaseModel):
    user_id: str
    query: str
    limit: int = 10
    threshold: float = 0.65  

class SearchResult(BaseModel):
    entry_id: str
    text: str
    similarity: float
    mood: Optional[str] = None
    created_at: str
    highlighted_text: Optional[str] = None

class SearchResponse(BaseModel):
    results: List[SearchResult]
    query: str
    count: int
    search_type: str  # "semantic" or "keyword"

@router.post("/semantic", response_model=SearchResponse)
async def semantic_search(request: SearchRequest):
    try:
        # Generate query embedding
        query_embedding = embedding_service.encode([request.query])[0]
        
        # Query vector store with user filter
        results = await vector_store.query(
            collection_name="journal_entries",
            query_embeddings=[query_embedding.tolist()],
            n_results=request.limit * 2,  # Get more for filtering
            where={"user_id": request.user_id}
        )
        
        # Filter by similarity threshold
        filtered_results = []
        db = mongodb.get_db()
        
        for i, (entry_id, distance) in enumerate(zip(results["ids"][0], results["distances"][0])):
            # Convert distance to similarity (ChromaDB uses distance, not similarity)
            similarity = 1.0 - distance  # Assuming cosine distance
            
            if similarity >= request.threshold:
                # Get full entry details from MongoDB
                entry = await db.journal_entries.find_one({"_id": entry_id})
                
                if entry and not entry.get("deleted_at"):
                    # Extract preview text
                    text = entry.get("text", "")
                    preview = text[:200] + "..." if len(text) > 200 else text
                    
                    # Find most similar sentence (simple highlight)
                    sentences = text.split('. ')
                    if sentences:
                        # Find sentence with highest similarity to query
                        sentence_embeddings = embedding_service.encode(sentences)
                        similarities = embedding_service.batch_similarity(
                            query_embedding, 
                            sentence_embeddings
                        )
                        best_idx = np.argmax(similarities)
                        highlighted = sentences[best_idx] + "."
                    else:
                        highlighted = preview
                    
                    filtered_results.append(SearchResult(
                        entry_id=str(entry["_id"]),
                        text=preview,
                        similarity=float(similarity),
                        mood=entry.get("mood"),
                        created_at=entry.get("created_at").isoformat() if entry.get("created_at") else "",
                        highlighted_text=highlighted
                    ))
        
        # Sort by similarity and limit
        filtered_results.sort(key=lambda x: x.similarity, reverse=True)
        filtered_results = filtered_results[:request.limit]
        
        if not filtered_results:
            # Fallback to keyword search
            return await keyword_search(request)
        
        return SearchResponse(
            results=filtered_results,
            query=request.query,
            count=len(filtered_results),
            search_type="semantic"
        )
        
    except Exception as e:
        logger.error(f"Semantic search failed: {e}")
        # Fallback to keyword search
        return await keyword_search(request)

async def keyword_search(request: SearchRequest) -> SearchResponse:
    """Fallback keyword search"""
    try:
        db = mongodb.get_db()
        
        # Simple text search using MongoDB $regex
        query_regex = {"$regex": request.query, "$options": "i"}
        
        entries = await db.journal_entries.find({
            "user_id": request.user_id,
            "text": query_regex,
            "deleted_at": None
        }).sort("created_at", -1).limit(request.limit).to_list(length=request.limit)
        
        results = []
        for entry in entries:
            text = entry.get("text", "")
            preview = text[:200] + "..." if len(text) > 200 else text
            
            # Find sentence containing query
            sentences = text.split('. ')
            highlighted = preview
            for sentence in sentences:
                if request.query.lower() in sentence.lower():
                    highlighted = sentence + "."
                    break
            
            results.append(SearchResult(
                entry_id=str(entry["_id"]),
                text=preview,
                similarity=0.7,  # Default similarity for keyword matches
                mood=entry.get("mood"),
                created_at=entry.get("created_at").isoformat() if entry.get("created_at") else "",
                highlighted_text=highlighted
            ))
        
        return SearchResponse(
            results=results,
            query=request.query,
            count=len(results),
            search_type="keyword"
        )
        
    except Exception as e:
        logger.error(f"Keyword search failed: {e}")
        return SearchResponse(
            results=[],
            query=request.query,
            count=0,
            search_type="failed"
        )

@router.post("/similar")
async def find_similar_entries(entry_id: str, user_id: str, limit: int = 5):
    """Find entries similar to a specific entry"""
    try:
        db = mongodb.get_db()
        
        # Get the entry
        entry = await db.journal_entries.find_one({
            "_id": entry_id,
            "user_id": user_id,
            "deleted_at": None
        })
        
        if not entry:
            raise HTTPException(status_code=404, detail="Entry not found")
        
        # Get entry embedding (if stored in MongoDB)
        if "embedding" not in entry:
            # Generate embedding on the fly
            embedding = embedding_service.encode([entry.get("text", "")])[0]
        else:
            embedding = np.array(entry["embedding"])
        
        # Search for similar entries (excluding the query entry itself)
        results = await vector_store.query(
            collection_name="journal_entries",
            query_embeddings=[embedding.tolist()],
            n_results=limit + 1,  # +1 to account for the query entry
            where={"user_id": user_id, "_id": {"$ne": entry_id}}
        )
        
        # Process results
        similar_entries = []
        for i, (result_id, distance) in enumerate(zip(results["ids"][0], results["distances"][0])):
            if str(result_id) != entry_id:  # Skip the query entry
                similar_entry = await db.journal_entries.find_one({"_id": result_id})
                if similar_entry:
                    similarity = 1.0 - distance
                    similar_entries.append({
                        "entry_id": str(similar_entry["_id"]),
                        "text": similar_entry.get("text", "")[:150] + "...",
                        "similarity": float(similarity),
                        "mood": similar_entry.get("mood"),
                        "created_at": similar_entry.get("created_at").isoformat() if similar_entry.get("created_at") else ""
                    })
        
        return {
            "query_entry": {
                "id": str(entry["_id"]),
                "preview": entry.get("text", "")[:100] + "..."
            },
            "similar_entries": similar_entries[:limit],
            "count": len(similar_entries[:limit])
        }
        
    except Exception as e:
        logger.error(f"Find similar entries failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))