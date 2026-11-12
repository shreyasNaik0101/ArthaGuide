#!/bin/bash

# ArthaGuide RAG System Setup Script


echo "🚀 Setting up ArthaGuide - Memory-First Financial AI"
echo "=================================================="

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
  echo "❌ Docker is not running. Please start Docker and try again."
  exit 1
fi

echo "✅ Docker is running"

# Start Qdrant
echo ""
echo "📦 Starting Qdrant vector database..."
docker-compose up -d

# Wait for Qdrant to be ready
echo "⏳ Waiting for Qdrant to start..."
sleep 5

# Check Qdrant health
if curl -s http://localhost:6333/health > /dev/null; then
  echo "✅ Qdrant is running at http://localhost:6333"
else
  echo "❌ Qdrant failed to start"
  exit 1
fi

# Setup backend
echo ""
echo "🐍 Setting up Python backend..."
cd backend

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
  python3 -m venv venv
  echo "✅ Virtual environment created"
fi

# Activate virtual environment
source venv/bin/activate

# Install dependencies
echo "📦 Installing Python dependencies..."
pip install -q -r requirements.txt
echo "✅ Dependencies installed"

# Check if .env exists
if [ ! -f ".env" ]; then
  echo "⚠️  .env file not found. Creating from template..."
  cat > .env << EOF
# Database
MONGODB_URL=mongodb://localhost:27017
DATABASE_NAME=arthaguide

# JWT
SECRET_KEY=your-secret-key-here-change-in-production-hackistanis-2025
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# OpenAI
OPENAI_API_KEY=your_openai_api_key_here

# Qdrant Vector Database
QDRANT_URL=http://localhost:6333
QDRANT_API_KEY=

# CORS
CORS_ORIGINS=http://localhost:3000,https://frontend-ovl6s5g4r-dollaransh17s-projects.vercel.app
EOF
  echo "✅ .env file created. IMPORTANT: Add your OPENAI_API_KEY!"
fi

# Initialize Qdrant with financial knowledge
echo ""
echo "🧠 Initializing Qdrant vector database with financial knowledge..."
python -m app.services.seed_qdrant

if [ $? -eq 0 ]; then
  echo "✅ Qdrant initialized with:"
  echo "   - Loan products (5 Indian lenders)"
  echo "   - Financial advice (EN/HI/KN)"
  echo "   - RBI regulations"
else
  echo "❌ Qdrant initialization failed. Check your OPENAI_API_KEY in .env"
  exit 1
fi

# Setup frontend
echo ""
echo "⚛️  Setting up React frontend..."
cd ../frontend

# Install npm dependencies
if [ ! -d "node_modules" ]; then
  echo "📦 Installing npm dependencies..."
  npm install
  echo "✅ Dependencies installed"
else
  echo "✅ Dependencies already installed"
fi

echo ""
echo "=================================================="
echo "✅ ArthaGuide setup complete!"
echo ""
echo "🎯 Next steps:"
echo ""
echo "1. Add your OpenAI API key to backend/.env:"
echo "   OPENAI_API_KEY=sk-..."
echo ""
echo "2. Start backend server:"
echo "   cd backend"
echo "   source venv/bin/activate"
echo "   uvicorn app.main:app --reload --port 8000"
echo ""
echo "3. In another terminal, start frontend:"
echo "   cd frontend"
echo "   npm run dev"
echo ""
echo "4. Open http://localhost:3000"
echo ""
echo "🔍 Test RAG API:"
echo "   curl -X POST http://localhost:8000/api/rag-advisor/rag-chat \\"
echo "     -H 'Content-Type: application/json' \\"
echo "     -d '{\"message\": \"I need a loan\", \"language\": \"en\"}'"
echo ""
echo "📊 Qdrant Dashboard: http://localhost:6333/dashboard"
echo ""
echo "=================================================="
