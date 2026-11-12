from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from mangum import Mangum
import os

# Create FastAPI app directly
app = FastAPI(title="ArthaGuide API", version="1.0.0", root_path="")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "ArthaGuide API is running"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}

@app.get("/debug")
def debug_routes():
    """Debug endpoint to see all registered routes"""
    routes = [{"path": route.path, "name": route.name} for route in app.routes]
    return {"routes": routes}

# Intent Router endpoints
class IntentQuery(BaseModel):
    query: str
    language: str = "en"
    current_route: str = None

FEATURE_MAP = {
    "dashboard": {
        "keywords": ["dashboard", "overview", "summary", "analytics"],
        "description": "View financial dashboard with analytics"
    },
    "advisor": {
        "keywords": ["advice", "advisor", "chat", "help", "suggest"],
        "description": "Get AI-powered financial advice"
    },
    "loans": {
        "keywords": ["loan", "loans", "marketplace", "lending", "borrow", "compare", "ऋण", "लोन"],
        "description": "Browse and compare loan options"
    },
    "sms": {
        "keywords": ["sms", "transaction", "track", "spending"],
        "description": "Track SMS transactions"
    }
}

@app.get("/api/intent/features")
def get_features():
    return {"features": FEATURE_MAP}

@app.post("/api/intent/classify")
def classify_intent(intent_query: IntentQuery):
    """Simple keyword-based classification"""
    query_lower = intent_query.query.lower()
    
    scores = {}
    for feature_id, info in FEATURE_MAP.items():
        score = sum(1 for keyword in info["keywords"] if keyword in query_lower)
        if score > 0:
            scores[feature_id] = score
    
    if scores:
        best_match = max(scores.items(), key=lambda x: x[1])
        return {
            "route": best_match[0],
            "confidence": 0.85,
            "explanation": f"Routing to {best_match[0]} based on keywords",
            "method": "keyword_matching",
            "suggested_action": f"Navigating to {FEATURE_MAP[best_match[0]]['description']}"
        }
    
    # Default fallback
    return {
        "route": "advisor",
        "confidence": 0.5,
        "explanation": "Unable to classify intent. Opening advisor for help.",
        "method": "default_fallback",
        "suggested_action": "Chat with advisor for assistance"
    }

# Try to import advanced routers if dependencies available
try:
    from app.api import rag_advisor
    app.include_router(rag_advisor.router, prefix="/api", tags=["rag-advisor"])
except Exception as e:
    print(f"RAG advisor not loaded: {e}")

# Export for Vercel using Mangum
handler = Mangum(app, lifespan="off")
