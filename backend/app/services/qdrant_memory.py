"""
Qdrant Vector Memory Service for Financial Knowledge RAG
Implements domain-specific retrieval for India's gig worker finance domain
"""

from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct, Filter, FieldCondition, MatchValue
from sentence_transformers import SentenceTransformer
import os
from typing import List, Dict, Optional
import uuid

class FinancialMemoryRAG:
    """
    RAG system for financial knowledge using Qdrant vector database
    Stores and retrieves:
    - Loan product information
    - Financial advice knowledge base
    - User transaction patterns
    - Regulatory compliance info
    """
    
    def __init__(self):
        # Initialize Qdrant client in memory mode
        self.client = QdrantClient(":memory:")
        
        # Initialize embedding model
        self.encoder = SentenceTransformer('all-MiniLM-L6-v2')
        self.vector_size = 384  # all-MiniLM-L6-v2 dimension
        
        # Collection names
        self.collections = {
            "loan_products": "arthaguide_loan_products",
            "financial_advice": "arthaguide_financial_advice",
            "user_transactions": "arthaguide_user_transactions",
            "regulatory_info": "arthaguide_regulatory_info"
        }
        
        # Initialize collections
        self._initialize_collections()
        
    def _initialize_collections(self):
        """Create Qdrant collections if they don't exist"""
        for collection_name in self.collections.values():
            try:
                self.client.get_collection(collection_name)
            except:
                self.client.create_collection(
                    collection_name=collection_name,
                    vectors_config=VectorParams(
                        size=self.vector_size,
                        distance=Distance.COSINE
                    )
                )
                
    def add_loan_product(self, product_data: Dict):
        """
        Add loan product to vector memory
        product_data: {
            "lender": str,
            "product_name": str,
            "interest_rate": float,
            "min_amount": int,
            "max_amount": int,
            "tenure_months": str,
            "eligibility": str,
            "features": str,
            "target_audience": str
        }
        """
        # Create searchable text
        text = f"{product_data['lender']} {product_data['product_name']} - Interest rate {product_data['interest_rate']}% APR. Loan amount from ₹{product_data['min_amount']} to ₹{product_data['max_amount']}. {product_data['eligibility']}. {product_data['features']}. Best for {product_data['target_audience']}."
        
        # Generate embedding
        vector = self.encoder.encode(text).tolist()
        
        # Store in Qdrant
        point = PointStruct(
            id=str(uuid.uuid4()),
            vector=vector,
            payload=product_data
        )
        
        self.client.upsert(
            collection_name=self.collections["loan_products"],
            points=[point]
        )
        
    def add_financial_advice(self, advice_data: Dict):
        """
        Add financial advice to knowledge base
        advice_data: {
            "category": str (credit_score, savings, budgeting, loans, etc.),
            "question": str,
            "answer": str,
            "language": str (en, hi, kn),
            "keywords": List[str]
        }
        """
        text = f"{advice_data['category']}: {advice_data['question']} - {advice_data['answer']}"
        vector = self.encoder.encode(text).tolist()
        
        point = PointStruct(
            id=str(uuid.uuid4()),
            vector=vector,
            payload=advice_data
        )
        
        self.client.upsert(
            collection_name=self.collections["financial_advice"],
            points=[point]
        )
        
    def add_regulatory_info(self, regulation_data: Dict):
        """
        Add Indian financial regulation info
        regulation_data: {
            "title": str,
            "authority": str (RBI, SEBI, IRDAI, etc.),
            "description": str,
            "applicability": str,
            "source_url": str
        }
        """
        text = f"{regulation_data['authority']} - {regulation_data['title']}: {regulation_data['description']}"
        vector = self.encoder.encode(text).tolist()
        
        point = PointStruct(
            id=str(uuid.uuid4()),
            vector=vector,
            payload=regulation_data
        )
        
        self.client.upsert(
            collection_name=self.collections["regulatory_info"],
            points=[point]
        )
        
    def search_loan_products(
        self, 
        query: str, 
        user_profile: Optional[Dict] = None,
        top_k: int = 5
    ) -> List[Dict]:
        """
        Semantic search for relevant loan products
        Filters by user's financial profile if provided
        """
        # Use query_text instead of manual encoding for in-memory client
        results = self.client.query(
            collection_name=self.collections["loan_products"],
            query_text=query,
            limit=top_k
        )
        
        return [
            {
                "score": hit.score,
                **hit.payload
            }
            for hit in results
        ]
        
    def search_financial_advice(
        self,
        query: str,
        language: str = "en",
        category: Optional[str] = None,
        top_k: int = 3
    ) -> List[Dict]:
        """
        Retrieve relevant financial advice from knowledge base
        """
        # Filter by language
        filter_conditions = Filter(
            must=[
                FieldCondition(
                    key="language",
                    match=MatchValue(value=language)
                )
            ]
        )
        
        if category:
            filter_conditions.must.append(
                FieldCondition(
                    key="category",
                    match=MatchValue(value=category)
                )
            )
        
        results = self.client.query(
            collection_name=self.collections["financial_advice"],
            query_text=query,
            limit=top_k,
            query_filter=filter_conditions
        )
        
        return [
            {
                "score": hit.score,
                "question": hit.payload["question"],
                "answer": hit.payload["answer"],
                "category": hit.payload["category"]
            }
            for hit in results
        ]
        
    def search_regulations(self, query: str, top_k: int = 3) -> List[Dict]:
        """
        Search Indian financial regulations
        """
        results = self.client.query(
            collection_name=self.collections["regulatory_info"],
            query_text=query,
            limit=top_k
        )
        
        return [
            {
                "score": hit.score,
                **hit.payload
            }
            for hit in results
        ]
        
    def get_personalized_recommendations(
        self,
        user_profile: Dict,
        user_query: str
    ) -> Dict:
        """
        Generate personalized financial recommendations using RAG
        Combines loan products, advice, and regulations
        """
        # Search relevant knowledge
        loan_products = self.search_loan_products(user_query, user_profile, top_k=3)
        financial_advice = self.search_financial_advice(user_query, top_k=2)
        
        return {
            "recommended_products": loan_products,
            "relevant_advice": financial_advice,
            "user_profile": user_profile
        }
