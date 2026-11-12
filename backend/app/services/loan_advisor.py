import os
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

class LoanAdvisor:
    def __init__(self):
        self.client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        
    def get_advice(self, user_message: str, language: str, financial_data: dict = None) -> str:
        """
        Generate loan advice using OpenAI API
        
        Args:
            user_message: User's question
            language: Language preference (en, hi, kn)
            financial_data: User's financial summary (income, expenses, balance)
        """
        
        system_prompt = self._get_system_prompt(language)
        context = self._build_context(financial_data) if financial_data else ""
        
        try:
            response = self.client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": f"{context}\n\nUser Question: {user_message}"}
                ],
                temperature=0.7,
                max_tokens=300
            )
            
            return response.choices[0].message.content
            
        except Exception as e:
            return self._fallback_response(language)
    
    def _get_system_prompt(self, language: str) -> str:
        prompts = {
            "en": "You are a helpful financial advisor for gig workers in India. Provide clear, practical loan and financial advice. Keep responses concise and actionable. Focus on loan eligibility, affordability, and financial health.",
            "hi": "आप भारत में गिग वर्कर्स के लिए एक सहायक वित्तीय सलाहकार हैं। स्पष्ट, व्यावहारिक ऋण और वित्तीय सलाह दें। प्रतिक्रियाओं को संक्षिप्त और क्रियाशील रखें।",
            "kn": "ನೀವು ಭಾರತದಲ್ಲಿ ಗಿಗ್ ವರ್ಕರ್‌ಗಳಿಗೆ ಸಹಾಯಕ ಹಣಕಾಸು ಸಲಹೆಗಾರರಾಗಿದ್ದೀರಿ. ಸ್ಪಷ್ಟ, ಪ್ರಾಯೋಗಿಕ ಸಾಲ ಮತ್ತು ಹಣಕಾಸು ಸಲಹೆಯನ್ನು ನೀಡಿ."
        }
        return prompts.get(language, prompts["en"])
    
    def _build_context(self, financial_data: dict) -> str:
        return f"""
Financial Context:
- Monthly Income: ₹{financial_data.get('income', 0):,}
- Monthly Expenses: ₹{financial_data.get('expenses', 0):,}
- Current Balance: ₹{financial_data.get('balance', 0):,}
- Financial Health Score: {financial_data.get('health_score', 0)}/100
"""
    
    def _fallback_response(self, language: str) -> str:
        responses = {
            "en": "I'm here to help with your financial questions. Based on typical guidelines, maintain a debt-to-income ratio below 40% and ensure you have 3-6 months of emergency savings.",
            "hi": "मैं आपके वित्तीय प्रश्नों में मदद के लिए यहां हूं। सामान्य दिशानिर्देशों के अनुसार, 40% से कम ऋण-से-आय अनुपात बनाए रखें।",
            "kn": "ನಾನು ನಿಮ್ಮ ಹಣಕಾಸು ಪ್ರಶ್ನೆಗಳಲ್ಲಿ ಸಹಾಯ ಮಾಡಲು ಇಲ್ಲಿದ್ದೇನೆ. 40% ಕ್ಕಿಂತ ಕಡಿಮೆ ಸಾಲ-ಆದಾಯ ಅನುಪಾತವನ್ನು ನಿರ್ವಹಿಸಿ."
        }
        return responses.get(language, responses["en"])
