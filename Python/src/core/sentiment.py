from typing import Dict, Any, List, Tuple
import logging
# Lazy load transformers and torch
# from transformers import pipeline, AutoTokenizer, AutoModelForSequenceClassification
# import torch
from src.config import settings

logger = logging.getLogger(__name__)

class SentimentAnalyzer:
    """Sentiment and emotion analysis service"""
    
    def __init__(self):
        self.sentiment_pipeline = None
        self.emotion_pipeline = None
        self.device = "cpu"
    
    async def initialize(self):
        """Initialize sentiment and emotion models"""
        try:
            if not settings.load_heavy_models:
                logger.info("Skipping local sentiment/emotion pipelines (LOAD_HEAVY_MODELS=false)")
                self.sentiment_pipeline = None
                self.emotion_pipeline = None
                return

            from transformers import pipeline
            import torch
            
            self.device = "cuda" if torch.cuda.is_available() else "cpu"
            logger.info(f"Loading sentiment analysis models on {self.device}...")
            
            # Sentiment analysis (positive/negative/neutral)
            self.sentiment_pipeline = pipeline(
                "sentiment-analysis",
                model=settings.sentiment_model,
                device=0 if torch.cuda.is_available() else -1,
                framework="pt"
            )
            
            # Emotion analysis (multiple emotions)
            self.emotion_pipeline = pipeline(
                "text-classification",
                model=settings.emotion_model,
                device=0 if torch.cuda.is_available() else -1,
                top_k=None,
                framework="pt"
            )
            
            logger.info("Sentiment models loaded")
            
        except Exception as e:
            logger.error(f"Failed to load sentiment models: {e}")
            # Fallback to simple rule-based analysis
            self.sentiment_pipeline = None
            self.emotion_pipeline = None
    
    def analyze_sentiment(self, text: str) -> Dict[str, Any]:
        """Analyze sentiment of text"""
        if not self.sentiment_pipeline:
            return self._fallback_sentiment_analysis(text)
        
        try:
            result = self.sentiment_pipeline(text)[0]
            
            # Convert to standardized format
            label = result['label'].lower()
            score = result['score']
            
            # Map to our sentiment scale (-1 to 1)
            if 'positive' in label:
                sentiment_score = score
            elif 'negative' in label:
                sentiment_score = -score
            else:  # neutral
                sentiment_score = 0
            
            return {
                "sentiment": label,
                "score": float(sentiment_score),
                "confidence": float(score),
                "raw": result
            }
            
        except Exception as e:
            logger.error(f"Sentiment analysis failed: {e}")
            return self._fallback_sentiment_analysis(text)
    
    def analyze_emotions(self, text: str, top_k: int = 3) -> List[Dict[str, Any]]:
        """Analyze emotions in text"""
        if not self.emotion_pipeline:
            return self._fallback_emotion_analysis(text, top_k)
        
        try:
            results = self.emotion_pipeline(text)[0]
            
            # Sort by score and get top_k
            results.sort(key=lambda x: x['score'], reverse=True)
            
            emotions = []
            for i, emotion in enumerate(results[:top_k]):
                emotions.append({
                    "emotion": emotion['label'].lower(),
                    "score": float(emotion['score']),
                    "rank": i + 1
                })
            
            return emotions
            
        except Exception as e:
            logger.error(f"Emotion analysis failed: {e}")
            return self._fallback_emotion_analysis(text, top_k)
    
    def analyze_journal_entry(self, text: str) -> Dict[str, Any]:
        """Comprehensive analysis of journal entry"""
        sentiment = self.analyze_sentiment(text)
        emotions = self.analyze_emotions(text)
        
        return {
            "sentiment": sentiment,
            "emotions": emotions,
            "overall_score": sentiment["score"],
            "dominant_emotion": emotions[0]["emotion"] if emotions else "neutral"
        }
    
    def _fallback_sentiment_analysis(self, text: str) -> Dict[str, Any]:
        """Simple rule-based sentiment analysis as fallback"""
        from textblob import TextBlob
        
        try:
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
                "score": float(polarity),
                "confidence": abs(float(polarity)),
                "raw": {"fallback": True}
            }
            
        except:
            return {
                "sentiment": "neutral",
                "score": 0.0,
                "confidence": 0.0,
                "raw": {"fallback": True, "error": "analysis_failed"}
            }
        
    def _vietnamese_sentiment_analysis(self, text: str) -> Dict:
        # Simple rule-based for Vietnamese: check keywords
        positive_keywords = ['vui', 'hạnh phúc', 'tốt', 'tuyệt', 'cảm ơn', 'yêu']
        negative_keywords = ['buồn', 'chán', 'mệt', 'đau', 'khổ', 'sợ', 'lo lắng', 'tức giận']
        text_lower = text.lower()
        pos_count = sum(1 for kw in positive_keywords if kw in text_lower)
        neg_count = sum(1 for kw in negative_keywords if kw in text_lower)
        if pos_count > neg_count:
            return {"sentiment": "positive", "score": 0.5, "confidence": 0.6}
        elif neg_count > pos_count:
            return {"sentiment": "negative", "score": -0.5, "confidence": 0.6}
        else:
            return {"sentiment": "neutral", "score": 0, "confidence": 0.5}
    
    def _fallback_emotion_analysis(self, text: str, top_k: int = 3) -> List[Dict[str, Any]]:
        """Simple emotion detection as fallback"""
        # Basic keyword matching for common emotions
        emotion_keywords = {
            "happy": ["happy", "joy", "excited", "good", "great", "wonderful"],
            "sad": ["sad", "unhappy", "depressed", "bad", "terrible"],
            "angry": ["angry", "mad", "frustrated", "annoyed"],
            "anxious": ["anxious", "worried", "nervous", "stressed"],
            "calm": ["calm", "peaceful", "relaxed", "chill"],
            "grateful": ["grateful", "thankful", "appreciate", "blessed"]
        }
        
        text_lower = text.lower()
        emotion_scores = []
        
        for emotion, keywords in emotion_keywords.items():
            score = sum(1 for keyword in keywords if keyword in text_lower)
            if score > 0:
                emotion_scores.append({
                    "emotion": emotion,
                    "score": score / len(keywords),
                    "rank": 0
                })
        
        # Sort by score
        emotion_scores.sort(key=lambda x: x["score"], reverse=True)
        
        # Add rank
        for i, emotion in enumerate(emotion_scores[:top_k]):
            emotion["rank"] = i + 1
        
        return emotion_scores[:top_k] if emotion_scores else [{
            "emotion": "neutral",
            "score": 1.0,
            "rank": 1
        }]

# Global sentiment analyzer instance
sentiment_analyzer = SentimentAnalyzer()