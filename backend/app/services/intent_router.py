"""
Intent Recognition Service for Agentic Navigation
Analyzes user queries and routes to appropriate features
"""

import os
from typing import Dict, List
import google.generativeai as genai

# Configure Gemini API
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))


class IntentRouter:
    """Routes user queries to appropriate application features"""
    
    FEATURE_MAP = {
        "dashboard": {
            "keywords": ["dashboard", "overview", "summary", "analytics", "stats", "statistics", "financial health", "score"],
            "description": "View financial dashboard with analytics and health score",
            "examples": ["show my dashboard", "financial overview", "what's my financial health", "check my stats"]
        },
        "advisor": {
            "keywords": ["advice", "advisor", "chat", "help me choose", "suggest", "recommendation", "assistant", "which loan", "best loan for me", "सलाह", "मदद"],
            "description": "Get AI-powered financial advice and loan recommendations",
            "examples": ["I need financial advice", "help me choose a loan", "suggest best loan options", "chat with advisor"]
        },
        "loans": {
            "keywords": ["loan", "loans", "marketplace", "lending", "borrow", "credit", "emi", "interest rate", "compare loans", "loan options", "find loans", "see loans", "show loans", "loan details", "ऋण", "लोन", "कर्ज"],
            "description": "Browse and compare loan options in the marketplace",
            "examples": ["show me loan options", "compare loans", "find loans", "loan marketplace", "मुझे लोन के बारे जाना है"]
        },
        "sms": {
            "keywords": ["sms", "transaction", "messages", "track", "parse", "spending", "expenses"],
            "description": "Track and analyze SMS transactions automatically",
            "examples": ["track my SMS", "show transactions", "analyze spending", "parse my messages"]
        },
        "features": {
            "keywords": ["features", "capabilities", "what can", "functionality", "about"],
            "description": "Explore all features and capabilities of ArthaGuide",
            "examples": ["what can you do", "show features", "tell me about capabilities"]
        },
        "business": {
            "keywords": ["business model", "revenue", "how does it work", "monetization", "business"],
            "description": "Learn about ArthaGuide's business model and revenue streams",
            "examples": ["how do you make money", "business model", "revenue model"]
        },
        "hero": {
            "keywords": ["home", "start", "main", "beginning", "welcome"],
            "description": "Return to the home page",
            "examples": ["go home", "main page", "start over"]
        }
    }
    
    def __init__(self):
        """Initialize the intent router"""
        self.model = None
    
    def _get_model(self):
        """Lazy load Gemini model on first use"""
        if self.model is None:
            self.model = genai.GenerativeModel('gemini-1.5-flash')
        return self.model
    
    def _get_feature_descriptions(self) -> str:
        """Generate feature descriptions for the prompt"""
        descriptions = []
        for feature_id, info in self.FEATURE_MAP.items():
            examples = ", ".join(info["examples"][:2])
            descriptions.append(f"- {feature_id}: {info['description']} (e.g., {examples})")
        return "\n".join(descriptions)
    
    def classify_intent(self, query: str, language: str = "en") -> Dict:
        """
        Classify user intent and route to appropriate feature
        
        Args:
            query: User's natural language query
            language: Language code (en, hi, kn)
            
        Returns:
            Dict with route, confidence, explanation, and suggested_action
        """
        # First try keyword-based matching for common queries
        query_lower = query.lower()
        
        # Check for keyword matches
        scores = {}
        for feature_id, info in self.FEATURE_MAP.items():
            score = sum(1 for keyword in info["keywords"] if keyword in query_lower)
            if score > 0:
                scores[feature_id] = score
        
        # If we have a clear keyword match, use it
        if scores:
            best_match = max(scores.items(), key=lambda x: x[1])
            if best_match[1] >= 1:  # At least 1 keyword match (lowered threshold)
                return {
                    "route": best_match[0],
                    "confidence": 0.85,
                    "explanation": f"Routing to {best_match[0]} based on keywords",
                    "method": "keyword_matching",
                    "suggested_action": f"Navigating to {self.FEATURE_MAP[best_match[0]]['description']}"
                }
        
        # If no clear keyword match, use LLM for intent classification
        prompt = f"""You are an intelligent router for a financial application called ArthaGuide.

Available features:
{self._get_feature_descriptions()}

User query: "{query}"
Language: {language}

Analyze the user's intent and determine which feature would best serve their needs.

Respond in JSON format:
{{
    "route": "feature_id",
    "confidence": 0.0-1.0,
    "explanation": "brief explanation of why this route was chosen",
    "suggested_action": "what the user should expect to see"
}}

Choose the most appropriate feature based on the user's intent. If uncertain, default to 'advisor' for questions or 'features' for general exploration."""

        try:
            model = self._get_model()
            response = model.generate_content(prompt)
            result = response.text.strip()
            
            # Extract JSON from response
            if "```json" in result:
                result = result.split("```json")[1].split("```")[0].strip()
            elif "```" in result:
                result = result.split("```")[1].split("```")[0].strip()
            
            import json
            intent_data = json.loads(result)
            
            # Validate route
            if intent_data.get("route") not in self.FEATURE_MAP:
                intent_data["route"] = "advisor"  # Default fallback
            
            intent_data["method"] = "llm_classification"
            return intent_data
            
        except Exception as e:
            # Fallback to best keyword match if available
            if scores:
                best_match = max(scores.items(), key=lambda x: x[1])
                return {
                    "route": best_match[0],
                    "confidence": 0.75,
                    "explanation": f"Routing to {best_match[0]} based on keyword analysis",
                    "suggested_action": f"Navigating to {self.FEATURE_MAP[best_match[0]]['description']}",
                    "method": "keyword_fallback"
                }
            
            # Last resort: default to advisor
            return {
                "route": "advisor",
                "confidence": 0.6,
                "explanation": "Routing to advisor for personalized assistance",
                "suggested_action": "Chat with our AI advisor for help",
                "method": "default_fallback"
            }
    
    def get_contextual_help(self, current_route: str, query: str) -> str:
        """
        Provide contextual help based on current location and query
        
        Args:
            current_route: Current feature user is on
            query: User's query
            
        Returns:
            Helpful message about the current feature
        """
        feature_info = self.FEATURE_MAP.get(current_route, {})
        description = feature_info.get("description", "")
        
        prompt = f"""The user is currently on the '{current_route}' page ({description}).
They asked: "{query}"

Provide a brief, helpful response (2-3 sentences) explaining what they can do on this page or guiding them to the right feature."""

        try:
            model = self._get_model()
            response = model.generate_content(prompt)
            return response.text.strip()
        except:
            return f"You're on the {current_route} page. {description}"


# Singleton instance
intent_router = IntentRouter()
