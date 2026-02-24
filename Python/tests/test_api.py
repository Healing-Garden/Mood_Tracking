import pytest
import asyncio
from fastapi.testclient import TestClient
from src.main import app

client = TestClient(app)

def test_health_endpoint():
    """Test health check endpoint"""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert "status" in data
    assert "services" in data

def test_root_endpoint():
    """Test root endpoint"""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "message" in data
    assert "version" in data

def test_info_endpoint():
    """Test info endpoint"""
    response = client.get("/info")
    assert response.status_code == 200
    data = response.json()
    assert "name" in data
    assert "environment" in data

@pytest.mark.asyncio
async def test_questions_endpoint():
    """Test questions endpoint with mock data"""
    test_data = {
        "user_id": "test_user_123",
        "recent_mood": "happy",
        "count": 3
    }
    
    response = client.post("/api/v1/questions/suggest", json=test_data)
    assert response.status_code == 200
    data = response.json()
    assert "questions" in data
    assert len(data["questions"]) == 3
    assert "generated_at" in data