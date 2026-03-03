from typing import List, Dict, Any, Optional
import logging
from transformers import pipeline, AutoTokenizer, AutoModelForSeq2SeqLM
import torch
from src.config import settings

logger = logging.getLogger(__name__)

class SummarizationService:
    """Text summarization service"""
    
    def __init__(self):
        self.summarizer = None
        self.tokenizer = None
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    
    async def initialize(self):
        """Initialize summarization model"""
        try:
            logger.info(f"Loading summarization model: {settings.summarization_model}")
            
            self.summarizer = pipeline(
                "summarization",
                model=settings.summarization_model,
                device=0 if torch.cuda.is_available() else -1,
                framework="pt"
            )
            
            logger.info("Summarization model loaded")
            
        except Exception as e:
            logger.error(f"Failed to load summarization model: {e}")
            self.summarizer = None
    
    def summarize(
        self, 
        text: str, 
        max_length: int = None, 
        min_length: int = None,
        ratio: float = 0.3
    ) -> str:
        """Summarize text"""
        if not self.summarizer:
            return self._fallback_summarize(text, ratio)
        
        if max_length is None:
            max_length = settings.max_summary_length
        if min_length is None:
            min_length = max_length // 3
        
        try:
            # Handle long texts by splitting
            if len(text.split()) > 1000:
                return self._summarize_long_text(text, max_length, min_length)
            
            result = self.summarizer(
                text,
                max_length=max_length,
                min_length=min_length,
                do_sample=False,
                truncation=True
            )
            
            return result[0]['summary_text']
            
        except Exception as e:
            logger.error(f"Summarization failed: {e}")
            return self._fallback_summarize(text, ratio)
    
    def _summarize_long_text(
        self, 
        text: str, 
        max_length: int, 
        min_length: int
    ) -> str:
        """Summarize long text by splitting into chunks"""
        sentences = text.split('. ')
        chunk_size = 20
        chunks = []
        
        # Create chunks of sentences
        for i in range(0, len(sentences), chunk_size):
            chunk = '. '.join(sentences[i:i + chunk_size])
            if chunk:
                chunks.append(chunk)
        
        # Summarize each chunk
        chunk_summaries = []
        for chunk in chunks:
            if len(chunk.split()) > 50: 
                try:
                    summary = self.summarizer(
                        chunk,
                        max_length=max_length // len(chunks),
                        min_length=min_length // len(chunks),
                        do_sample=False
                    )[0]['summary_text']
                    chunk_summaries.append(summary)
                except:
                    chunk_summaries.append(chunk[:100] + "...")
            else:
                chunk_summaries.append(chunk)
        
        # Combine and summarize again if needed
        combined = ' '.join(chunk_summaries)
        if len(combined.split()) > max_length:
            return self.summarizer(
                combined,
                max_length=max_length,
                min_length=min_length,
                do_sample=False
            )[0]['summary_text']
        
        return combined
    
    def _fallback_summarize(self, text: str, ratio: float = 0.3) -> str:
        """Simple extractive summarization as fallback"""
        from heapq import nlargest
        from nltk.tokenize import sent_tokenize, word_tokenize
        from nltk.corpus import stopwords
        import string
        
        try:
            import nltk
            nltk.download('punkt', quiet=True)
            nltk.download('stopwords', quiet=True)
            
            sentences = sent_tokenize(text)
            
            if len(sentences) <= 3:
                return text
            
            # Remove stopwords and punctuation
            stop_words = set(stopwords.words('english'))
            table = str.maketrans('', '', string.punctuation)
            
            # Calculate word frequencies
            word_frequencies = {}
            for sentence in sentences:
                words = word_tokenize(sentence.lower())
                for word in words:
                    word = word.translate(table)
                    if word not in stop_words and word.isalpha():
                        word_frequencies[word] = word_frequencies.get(word, 0) + 1
            
            # Calculate sentence scores
            sentence_scores = {}
            for sentence in sentences:
                words = word_tokenize(sentence.lower())
                for word in words:
                    word = word.translate(table)
                    if word in word_frequencies:
                        sentence_scores[sentence] = sentence_scores.get(sentence, 0) + word_frequencies[word]
            
            # Get top sentences
            num_sentences = max(1, int(len(sentences) * ratio))
            summary_sentences = nlargest(num_sentences, sentence_scores, key=sentence_scores.get)
            
            return ' '.join(summary_sentences)
            
        except Exception as e:
            logger.error(f"Fallback summarization failed: {e}")
            # Last resort: return first few sentences
            sentences = text.split('. ')
            return '. '.join(sentences[:3]) + '.'
    
    async def generate_daily_summary(
        self, 
        entries: List[Dict[str, Any]],
        moods: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Generate daily summary from journal entries and moods"""
        if not entries and not moods:
            return {
                "summary": "No data recorded today. Every day is a new opportunity for growth and reflection.",
                "type": "empty_day"
            }
        
        # Combine text from entries
        texts = []
        for entry in entries:
            if entry.get('text'):
                texts.append(f"Journal entry: {entry['text']}")
        
        for mood in moods:
            if mood.get('mood'):
                texts.append(f"Mood: {mood['mood']} (energy: {mood.get('energy_level', 'N/A')}/10)")
        
        combined_text = ' '.join(texts)
        
        if len(combined_text) < 50:
            return {
                "summary": "You checked in today. Remember that small steps lead to big changes.",
                "type": "minimal_data"
            }
        
        # Generate summary
        summary = self.summarize(combined_text)
        
        # Add encouraging note
        encouraging_notes = [
            "Remember to be kind to yourself today.",
            "Every step forward, no matter how small, is progress.",
            "You're doing better than you think.",
            "Take a moment to appreciate your resilience.",
            "Your feelings are valid and important.",
            "Tomorrow brings new opportunities for growth."
        ]
        
        import random
        encouraging_note = random.choice(encouraging_notes)
        
        return {
            "summary": f"{summary} {encouraging_note}",
            "type": "full_summary",
            "entry_count": len(entries),
            "mood_count": len(moods),
            "length": len(summary)
        }

summarization_service = SummarizationService()