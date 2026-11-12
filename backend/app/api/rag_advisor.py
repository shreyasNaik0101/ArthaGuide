"""
RAG-Powered Financial Advisor API
Uses Qdrant vector memory + OpenAI for context-aware responses
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from openai import OpenAI
import os
from typing import Optional, List, Dict
import sys
sys.path.append(os.path.dirname(os.path.dirname(__file__)))
# from services.qdrant_memory import FinancialMemoryRAG  # Commented out - using simplified RAG

router = APIRouter()

# Initialize RAG system and OpenAI
rag_system = None
openai_client = None

def get_rag_system():
    """Initialize and seed RAG system once"""
    global rag_system
    if rag_system is None:
        from app.services.seed_qdrant import initialize_qdrant_memory
        rag_system = initialize_qdrant_memory()
    return rag_system

class RAGAdvisorRequest(BaseModel):
    message: str
    language: str = "en"
    user_profile: Optional[Dict] = None  # {monthly_income, monthly_expenses, credit_score, etc.}

class RAGAdvisorResponse(BaseModel):
    response: str
    sources: List[Dict]  # Retrieved knowledge sources
    recommended_products: Optional[List[Dict]] = None

@router.post("/rag-chat", response_model=RAGAdvisorResponse)
async def rag_powered_chat(request: RAGAdvisorRequest):
    """
    Memory-First AI Financial Advisor
    
    Flow:
    1. Retrieve relevant knowledge from Qdrant (loan products, advice, regulations)
    2. Build context-aware prompt with retrieved information
    3. Generate personalized response using OpenAI
    4. Return answer + source citations
    """
    
    try:
        # Simplified RAG - use hardcoded knowledge base
        retrieved_knowledge = []
        loan_results = []
        
        # Check for regulatory queries
        if any(keyword in request.message.lower() for keyword in ['legal', 'regulation', 'rbi', 'law', 'नियम', 'guideline']):
            # Return RBI regulatory info
            regulation_context = """RBI Guidelines on Digital Lending:
- All digital lending platforms must be registered entities
- Direct benefit transfer (DBT) required - no deductions allowed before loan disbursal
- Interest rates must be disclosed upfront
- Lenders must provide loan sanction letter with all-inclusive interest cost
- No hidden charges allowed
- Borrowers have right to prepay without penalty after 6 months
- Consumers entitled to one free credit report per year from credit bureaus"""
            advice_results = [{"question": "RBI Guidelines", "answer": regulation_context, "category": "regulatory"}]
        else:
            # Default financial advice
            advice_results = [{"question": "General", "answer": "Financial advice based on your profile", "category": "general"}]
        
        # Step 2: Build context from retrieved knowledge
        context_parts = []
        
        if advice_results:
            context_parts.append("### Relevant Financial Advice:")
            for advice in advice_results:
                context_parts.append(f"- Q: {advice['question']}")
                context_parts.append(f"  A: {advice['answer']}")
        
        if loan_results:
            context_parts.append("\n### Available Loan Products:")
            for loan in loan_results:
                context_parts.append(
                    f"- {loan['lender']} {loan['product_name']}: "
                    f"{loan['interest_rate']}% APR, ₹{loan['min_amount']}-₹{loan['max_amount']}, "
                    f"{loan['tenure_months']}. {loan['features']}"
                )
        
        context = "\n".join(context_parts)
        
        # Step 3: Build user profile context
        profile_context = ""
        if request.user_profile:
            profile_context = f"""
User's Financial Profile:
- Monthly Income: ₹{request.user_profile.get('monthlyIncome', 'Not provided')}
- Monthly Expenses: ₹{request.user_profile.get('monthlyExpenses', 'Not provided')}
- Monthly Savings: ₹{request.user_profile.get('monthlySavings', 'Not provided')}
- Financial Health Score: {request.user_profile.get('healthScore', 'Not provided')}/100
"""
        
        # Step 4: Generate response using OpenAI with RAG context
        system_prompts = {
            "en": f"""You are ArthaGuide AI, a financial advisor for India's gig workers (Uber/Ola drivers, Swiggy/Zomato delivery partners, freelancers).

{profile_context}

RETRIEVED KNOWLEDGE FROM MEMORY:
{context}

Your role:
- Provide personalized loan advice based on user's profile and retrieved knowledge
- Recommend specific loan products from the retrieved list
- Give credit score improvement tips
- Offer savings and budgeting guidance
- Cite regulations when relevant
- Keep responses conversational and concise (3-5 sentences)
- Use retrieved knowledge to give accurate, data-backed answers
- Always mention specific lenders and products when recommending loans
""",
            "hi": f"""आप ArthaGuide AI हैं, भारत के गिग वर्कर्स (Uber/Ola ड्राइवर, Swiggy/Zomato डिलीवरी पार्टनर, फ्रीलांसर) के लिए वित्तीय सलाहकार।

{profile_context}

मेमोरी से प्राप्त ज्ञान:
{context}

आपकी भूमिका:
- यूजर की प्रोफाइल और प्राप्त ज्ञान के आधार पर व्यक्तिगत ऋण सलाह दें
- प्राप्त सूची से विशिष्ट ऋण उत्पादों की सिफारिश करें
- क्रेडिट स्कोर सुधार टिप्स दें
- बचत और बजट मार्गदर्शन प्रदान करें
""",
            "kn": f"""ನೀವು ArthaGuide AI, ಭಾರತದ ಗಿಗ್ ವರ್ಕರ್‌ಗಳಿಗೆ (Uber/Ola ಚಾಲಕರು, Swiggy/Zomato ಡೆಲಿವರಿ ಪಾಲುದಾರರು, ಫ್ರೀಲಾನ್ಸರ್‌ಗಳು) ಹಣಕಾಸು ಸಲಹೆಗಾರರು.

{profile_context}

ಮೆಮೊರಿಯಿಂದ ಪಡೆದ ಜ್ಞಾನ:
{context}
"""
        }
        
        system_prompt = system_prompts.get(request.language, system_prompts["en"])
        
        # Call OpenAI with RAG context
        global openai_client
        if openai_client is None:
            if not os.getenv("OPENAI_API_KEY"):
                raise HTTPException(503, "Configure OPENAI_API_KEY in backend/.env to use chat")
            openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        response = openai_client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": request.message}
            ],
            max_tokens=300,
            temperature=0.7
        )
        
        ai_response = response.choices[0].message.content
        
        # Step 5: Return response with sources
        return RAGAdvisorResponse(
            response=ai_response,
            sources=[
                {
                    "type": "advice" if "question" in item else "loan" if "lender" in item else "regulation",
                    "data": item
                }
                for item in (advice_results + loan_results)[:5]
            ],
            recommended_products=loan_results if loan_results else None
        )
        
    except Exception as e:
        print(f"Error in RAG advisor: {e}")
        
        # Fallback responses
        fallback_responses = {
            "en": "💬 I'm having trouble accessing my knowledge base right now. Please try again in a moment!",
            "hi": "💬 मुझे अभी अपने ज्ञान आधार तक पहुँचने में समस्या हो रही है। कृपया एक क्षण में पुनः प्रयास करें!",
            "kn": "💬 ನನಗೆ ಈಗ ನನ್ನ ಜ್ಞಾನ ನೆಲೆಯನ್ನು ಪ್ರವೇಶಿಸಲು ಸಮಸ್ಯೆ ಇದೆ. ದಯವಿಟ್ಟು ಸ್ವಲ್ಪ ಸಮಯದ ನಂತರ ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ!"
        }
        
        return RAGAdvisorResponse(
            response=fallback_responses.get(request.language, fallback_responses["en"]),
            sources=[]
        )

@router.get("/health")
async def rag_health():
    """Health check for RAG system"""
    return {
        "status": "healthy",
        "service": "RAG Financial Advisor",
        "mode": "simplified_rag",
        "llm": "OpenAI GPT-3.5-turbo"
    }

@router.post("/search-loans")
async def search_loans(query: str, user_profile: Optional[Dict] = None):
    """Direct loan product search endpoint"""
    try:
        results = rag_system.search_loan_products(query, user_profile, top_k=5)
        return {"results": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/search-advice")
async def search_advice(query: str, language: str = "en", category: Optional[str] = None):
    """Direct financial advice search endpoint"""
    try:
        results = rag_system.search_financial_advice(query, language, category, top_k=5)
        return {"results": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
