from typing import List, Optional
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field, field_validator, SecretStr
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseSettings):
    # Cấu hình model
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        env_prefix="",  
        extra="ignore"  
    )
    
    # Application
    app_name: str = Field(default="Mental Health AI Service")
    environment: str = Field(default="development")
    debug: bool = Field(default=False)
    load_heavy_models: bool = Field(default=False)
    
    # Server
    host: str = Field(default="0.0.0.0")
    port: int = Field(default=8000)
    api_prefix: str = Field(default="/api/v1")
    cors_origins: List[str] = Field(default=["http://localhost:5173"])
    
    # Database
    mongodb_uri: str
    mongodb_db_name: str = Field(default="Healing_Garden")
    redis_url: str = Field(default="redis://localhost:6379/0")
    redis_password: Optional[str] = Field(default=None)
    
    # Vector Database
    chromadb_host: str = Field(default="localhost")
    chromadb_port: int = Field(default=8001)
    chromadb_persist_directory: str = Field(default="./data/vector_store")
    vector_store_type: str = Field(default="chroma")
    
    # AI Models
    embedding_model: str = Field(default="paraphrase-multilingual-MiniLM-L12-v2")
    embedding_dimension: int = Field(default=384)
    sentiment_model: str = Field(default="cardiffnlp/twitter-roberta-base-sentiment-latest")
    emotion_model: str = Field(default="j-hartmann/emotion-english-distilroberta-base")
    summarization_model: str = Field(default="facebook/bart-large-cnn")

    # OpenAI 
    openai_api_key: Optional[SecretStr] = Field(default=None)
    openai_model: str = Field(default="gpt-4o-mini")

    # Gemini
    gemini_api_key: Optional[SecretStr] = Field(default=None)
    gemini_model: str = Field(default="gemini-2.0-flash")
    gemini_fallback_models: List[str] = Field(
        default=["gemini-2.0-flash-lite", "gemini-1.5-flash", "gemini-1.5-flash-8b", "gemini-flash-latest"]
    )
    gemini_temperature: float = Field(default=0.7)
    gemini_max_tokens: int = Field(default=500)
    
    # Security
    secret_key: str
    service_api_key: str = Field(default="")
    api_key_header: str = Field(default="X-API-Key")
    
    # Limits
    rate_limit_per_minute: int = Field(default=60)
    embedding_batch_size: int = Field(default=32)
    max_summary_length: int = Field(default=200)
    similarity_threshold: float = Field(default=0.65)
    
    # Paths
    models_cache_dir: str = Field(default="./models_cache")
    logs_dir: str = Field(default="./logs")
    data_dir: str = Field(default="./data")
    
    @field_validator("cors_origins", mode="before")
    @classmethod
    def parse_cors_origins(cls, v):
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(",")]
        return v
    
    @field_validator("secret_key")
    @classmethod
    def validate_secret_key(cls, v):
        if v == "generate_with_openssl_rand_hex_32":
            import secrets
            return secrets.token_hex(32)
        return v
    
    def get_openai_api_key(self) -> Optional[str]:
        if self.openai_api_key:
            return self.openai_api_key.get_secret_value()
        return None
    
    def get_gemini_api_key(self) -> Optional[str]:
        if self.gemini_api_key:
            return self.gemini_api_key.get_secret_value()
        return None

settings = Settings()