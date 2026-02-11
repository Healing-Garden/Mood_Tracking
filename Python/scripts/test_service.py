import asyncio
import aiohttp
import json
import sys

async def test_service():
    """Test the AI service endpoints"""
    
    base_url = "http://localhost:8000"
    
    async with aiohttp.ClientSession() as session:
        # Test health endpoint
        print("Testing health endpoint...")
        async with session.get(f"{base_url}/health") as response:
            if response.status == 200:
                data = await response.json()
                print(f"   Health: {data['status']}")
                print(f"   MongoDB: {data['services']['mongodb']['status']}")
                print(f"   Redis: {data['services']['redis']['status']}")
            else:
                print(f"   Health check failed: {response.status}")
                return False
        
        # Test questions endpoint
        print("\n Testing questions endpoint...")
        question_data = {
            "user_id": "test_user_001",
            "recent_mood": "anxious",
            "count": 3
        }
        
        async with session.post(
            f"{base_url}/api/v1/questions/suggest",
            json=question_data
        ) as response:
            if response.status == 200:
                data = await response.json()
                print(f" Questions generated: {len(data['questions'])}")
                for i, q in enumerate(data['questions'], 1):
                    print(f"   {i}. {q}")
            else:
                print(f" Questions endpoint failed: {response.status}")
                error = await response.text()
                print(f"   Error: {error}")
                return False
        
        # Test sentiment analysis
        print("\n Testing sentiment analysis...")
        text = "I had a wonderful day today! Everything went perfectly."
        
        # Note: You'll need to implement a sentiment endpoint first
        # This is just a placeholder for the test structure
        
        print("\n All tests completed!")
        return True

if __name__ == "__main__":
    success = asyncio.run(test_service())
    sys.exit(0 if success else 1)