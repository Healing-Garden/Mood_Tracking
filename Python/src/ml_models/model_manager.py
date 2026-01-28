import torch
from sentence_transformers import SentenceTransformer
from transformers import pipeline, AutoTokenizer, AutoModelForSeq2SeqLM
from typing import Dict, Any, Optional
import numpy as np
import logging
from src.config import settings

logger = logging.getLogger(__name__)

class ModelManager:
    _instance = None
    
    def __init__(self):
        if not ModelManager._instance:
            self.embedding_model = None
            self.sentiment_analyzer = None
            self.summarizer = None
            self.tokenizer = None
            self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
            logger.info(f"Using device: {self.device}")
            
    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            cls._instance = ModelManager()
        return cls._instance
    
    def load_models(self):
        """Load all ML models"""
        logger.info("Loading ML models...")
        
        # Load embedding model
        try:
            self.embedding_model = SentenceTransformer(settings.EMBEDDING_MODEL)
            self.embedding_model.to(self.device)
            logger.info(f"Loaded embedding model: {settings.EMBEDDING_MODEL}")
        except Exception as e:
            logger.error(f"Failed to load embedding model: {e}")
            raise
        
        # Load sentiment analyzer
        try:
            self.sentiment_analyzer = pipeline(
                "sentiment-analysis",
                model=settings.SENTIMENT_MODEL,
                device=0 if torch.cuda.is_available() else -1
            )
            logger.info(f"Loaded sentiment model: {settings.SENTIMENT_MODEL}")
        except Exception as e:
            logger.error(f"Failed to load sentiment model: {e}")
            # Fallback to TextBlob
            self.sentiment_analyzer = "textblob"
            logger.info("Using TextBlob as fallback for sentiment analysis")
        
        # Load summarizer
        try:
            self.summarizer = pipeline(
                "summarization",
                model=settings.SUMMARIZATION_MODEL,
                device=0 if torch.cuda.is_available() else -1
            )
            logger.info(f"Loaded summarization model: {settings.SUMMARIZATION_MODEL}")
        except Exception as e:
            logger.error(f"Failed to load summarization model: {e}")
            self.summarizer = None
        
        logger.info("All models loaded successfully")
    
    def get_embedding(self, text: str) -> np.ndarray:
        """Get embedding for text"""
        if not self.embedding_model:
            raise ValueError("Embedding model not loaded")
        
        with torch.no_grad():
            embedding = self.embedding_model.encode(
                text,
                convert_to_tensor=True,
                show_progress_bar=False
            )
        
        return embedding.cpu().numpy()
    
    def get_batch_embeddings(self, texts: list) -> np.ndarray:
        """Get embeddings for multiple texts"""
        if not self.embedding_model:
            raise ValueError("Embedding model not loaded")
        
        with torch.no_grad():
            embeddings = self.embedding_model.encode(
                texts,
                convert_to_tensor=True,
                show_progress_bar=True,
                batch_size=32
            )
        
        return embeddings.cpu().numpy()
    
    def analyze_sentiment(self, text: str) -> Dict[str, Any]:
        """Analyze sentiment of text"""
        if self.sentiment_analyzer == "textblob":
            # Fallback using TextBlob
            from textblob import TextBlob
            blob = TextBlob(text)
            polarity = blob.sentiment.polarity
            
            if polarity > 0.1:
                sentiment = "positive"
            elif polarity < -0.1:
                sentiment = "negative"
            else:
                sentiment = "neutral"
            
            return {
                "sentiment": sentiment,
                "score": polarity,
                "confidence": abs(polarity)
            }
        
        try:
            result = self.sentiment_analyzer(text)[0]
            score = result['score']
            label = result['label']
            
            # Convert to -1 to 1 scale
            if label == "NEGATIVE":
                normalized_score = -score
            elif label == "POSITIVE":
                normalized_score = score
            else:
                normalized_score = 0
            
            return {
                "sentiment": label.lower(),
                "score": normalized_score,
                "confidence": score
            }
        except Exception as e:
            logger.error(f"Sentiment analysis failed: {e}")
            # Return neutral as fallback
            return {
                "sentiment": "neutral",
                "score": 0.0,
                "confidence": 0.0
            }
    
    def summarize_text(self, text: str, max_length: int = 150, min_length: int = 30) -> str:
        """Summarize text"""
        if not self.summarizer:
            # Simple fallback - take first few sentences
            sentences = text.split('.')
            return '. '.join(sentences[:3]) + '.'
        
        try:
            summary = self.summarizer(
                text,
                max_length=max_length,
                min_length=min_length,
                do_sample=False
            )[0]['summary_text']
            return summary
        except Exception as e:
            logger.error(f"Summarization failed: {e}")
            # Fallback to extractive summarization
            sentences = text.split('.')
            return '. '.join(sentences[:min(3, len(sentences))]) + '.'
    
    def get_model_status(self) -> Dict[str, bool]:
        """Get status of all models"""
        return {
            "embedding_model": self.embedding_model is not None,
            "sentiment_analyzer": self.sentiment_analyzer is not None,
            "summarizer": self.summarizer is not None
        }