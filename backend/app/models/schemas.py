from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

class UserBase(BaseModel):
    email: EmailStr
    phone: Optional[str] = None
    language_preference: str = "en"

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: str
    created_at: datetime
    
    class Config:
        from_attributes = True

class Transaction(BaseModel):
    id: Optional[str] = None
    user_id: str
    amount: float
    type: str  # credit or debit
    merchant: Optional[str] = None
    category: str
    date: str
    raw_sms: str
    created_at: Optional[datetime] = None

class AnalyticsSummary(BaseModel):
    income: float
    expenses: float
    balance: float
    categories: dict

class HealthScore(BaseModel):
    score: float
    narrative: str
    suggestion: str

class ChatMessage(BaseModel):
    message: str
    language: str = "en"

class ChatResponse(BaseModel):
    response: str
    language: str
