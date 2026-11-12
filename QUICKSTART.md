# 🚀 ArthaGuide RAG - Quick Start (5 Minutes)

## Prerequisites
- Docker installed
- Python 3.9+
- OpenAI API key

## Step 1: Clone & Setup (1 min)
```bash
git clone https://github.com/dollaransh17/Artha_Guide_Code_Red.git
cd Artha_Guide_Code_Red
chmod +x setup.sh
```

## Step 2: Start Qdrant (1 min)
```bash
docker-compose up -d
```

## Step 3: Add OpenAI Key (30 sec)
```bash
# Edit backend/.env
OPENAI_API_KEY=sk-your-key-here
```

## Step 4: Initialize Vector Database (1 min)
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python -m app.services.seed_qdrant
```

## Step 5: Start Backend (30 sec)
```bash
uvicorn app.main:app --reload --port 8000
```

## Step 6: Test RAG API (1 min)
```bash
curl -X POST http://localhost:8000/api/rag-advisor/rag-chat \
  -H 'Content-Type: application/json' \
  -d '{
    "message": "I need a loan of 50000 rupees",
    "language": "en",
    "user_profile": {
      "monthlyIncome": 45000,
      "monthlyExpenses": 32000,
      "monthlySavings": 13000,
      "healthScore": 72
    }
  }'
```

**Expected Response:**
```json
{
  "response": "Based on your ₹45,000 monthly income and ₹13,000 savings, you're eligible for ₹50,000 loan. I recommend MoneyTap (13% APR) with ₹4,200 monthly EMI...",
  "sources": [
    {"type": "loan", "data": {"lender": "MoneyTap", "interest_rate": 13.0}}
  ],
  "recommended_products": [...]
}
```

## 🎯 What Just Happened?

1. **Qdrant Vector DB** started with 4 collections
2. **Embedding Model** (all-MiniLM-L6-v2) loaded
3. **Financial Knowledge** seeded:
   - 5 loan products
   - 10+ financial advice items
   - 4 regulatory guidelines
4. **RAG Pipeline** retrieved relevant vectors
5. **OpenAI GPT-3.5** generated personalized response

## 📊 Check Qdrant Dashboard
http://localhost:6333/dashboard

## 🔍 View Collections
```bash
curl http://localhost:6333/collections
```
