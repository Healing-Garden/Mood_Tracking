#!/bin/bash
# setup.sh

echo "Setting up Mental Health AI Service"
echo "======================================"

# 1. Create necessary directories
echo "Creating directories..."
mkdir -p data/vector_store data/cache models_cache logs

# 2. Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "Creating .env file from template..."
    cp .env.example .env
    
    echo ""
    echo "      Please update the .env file with your configuration:"
    echo "    - MongoDB URI"
    echo "    - OpenAI API Key (optional)"
    echo "    - Other settings as needed"
    echo ""
    read -p "Press Enter to continue after updating .env..."
fi

# 3. Install dependencies
echo " Installing Python dependencies..."
pip install -r requirements.txt

# 4. Download NLTK data for fallback summarization
echo "Downloading NLTK data..."
python -c "import nltk; nltk.download('punkt', quiet=True); nltk.download('stopwords', quiet=True)"

# 5. Run the service
echo "Starting AI Service..."
echo ""
echo "Access URLs:"
echo "   - API: http://localhost:8000"
echo "   - Docs: http://localhost:8000/docs"
echo "   - Health: http://localhost:8000/health"
echo ""
echo "To run with Docker: docker-compose up -d"
echo ""

uvicorn src.main:app --reload --host 0.0.0.0 --port 8000