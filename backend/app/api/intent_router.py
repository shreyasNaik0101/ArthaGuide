"""
Intent Router API endpoints for agentic navigation
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.services.intent_router import intent_router

router = APIRouter()


class IntentQuery(BaseModel):
    query: str
    language: str = "en"
    current_route: str = None


class IntentResponse(BaseModel):
    route: str
    confidence: float
    explanation: str
    suggested_action: str = None
    method: str


@router.post("/intent/classify", response_model=IntentResponse)
async def classify_intent(intent_query: IntentQuery):
    """
    Classify user intent and suggest navigation route
    
    Args:
        intent_query: User's query and language preference
        
    Returns:
        Routing suggestion with confidence and explanation
    """
    try:
        result = intent_router.classify_intent(
            query=intent_query.query,
            language=intent_query.language
        )
        
        return IntentResponse(**result)
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Intent classification failed: {str(e)}"
        )


@router.post("/intent/help")
async def get_contextual_help(intent_query: IntentQuery):
    """
    Get contextual help based on current location and query
    
    Args:
        intent_query: User's query and current route
        
    Returns:
        Helpful message about current feature or navigation guidance
    """
    try:
        if not intent_query.current_route:
            return {"message": "Please provide your current location"}
        
        help_text = intent_router.get_contextual_help(
            current_route=intent_query.current_route,
            query=intent_query.query
        )
        
        return {"help": help_text}
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Help generation failed: {str(e)}"
        )


@router.get("/intent/features")
async def get_available_features():
    """
    Get list of all available features for navigation
    
    Returns:
        Dictionary of features with descriptions and examples
    """
    return {
        "features": intent_router.FEATURE_MAP
    }
