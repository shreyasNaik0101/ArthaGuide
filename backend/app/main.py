from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

from pathlib import Path
load_dotenv(Path(__file__).resolve().parents[1] / ".env")

from app.api import rag_advisor, freelancer

app = FastAPI(title="ArthaGuide API", version="1.0.0")

# CORS - Allow all Vercel deployments
origins = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000").split(",")
# Add wildcard for Vercel preview deployments
if any("vercel.app" in origin for origin in origins):
    origins.append("https://*.vercel.app")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "ArthaGuide API is running"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}

# Register routers
app.include_router(rag_advisor.router, prefix="/api", tags=["rag-advisor"])
app.include_router(freelancer.router, prefix="/api", tags=["freelancer-adviser"])
# Legacy smart navigation uses optional Gemini; it must not block the adviser.
try:
    from app.api import intent_router
except ModuleNotFoundError as exc:
    if exc.name not in ("google", "google.generativeai"):
        raise
else:
    app.include_router(intent_router.router, prefix="/api", tags=["intent-router"])
