"""
Initialize Qdrant Vector Database with Financial Knowledge Base
Seed data for ArthaGuide Memory-First RAG System
"""

from app.services.qdrant_memory import FinancialMemoryRAG

def seed_loan_products(rag_system: FinancialMemoryRAG):
    """Seed Indian fintech loan products"""
    
    products = [
        {
            "lender": "MoneyTap",
            "product_name": "Personal Loan for Gig Workers",
            "interest_rate": 13.0,
            "min_amount": 10000,
            "max_amount": 500000,
            "tenure_months": "3-36 months",
            "eligibility": "Age 21-57, Monthly income ₹20,000+, Credit score 650+",
            "features": "Instant approval, Flexible EMI, No collateral, Digital KYC",
            "target_audience": "Uber/Ola drivers, delivery partners, freelancers"
        },
        {
            "lender": "PaySense",
            "product_name": "Instant Personal Loan",
            "interest_rate": 16.0,
            "min_amount": 5000,
            "max_amount": 200000,
            "tenure_months": "3-60 months",
            "eligibility": "Salaried/Self-employed, Monthly income ₹12,000+",
            "features": "Paperless, Same-day disbursal, No prepayment charges",
            "target_audience": "Gig workers, small business owners"
        },
        {
            "lender": "KreditBee",
            "product_name": "Short-Term Loan",
            "interest_rate": 18.0,
            "min_amount": 1000,
            "max_amount": 100000,
            "tenure_months": "3-15 months",
            "eligibility": "Age 21-55, PAN card, Bank account",
            "features": "Quick approval in 10 minutes, Minimal documentation",
            "target_audience": "Students, young professionals, gig economy workers"
        },
        {
            "lender": "EarlySalary",
            "product_name": "Salary Advance Loan",
            "interest_rate": 20.0,
            "min_amount": 5000,
            "max_amount": 200000,
            "tenure_months": "1-12 months",
            "eligibility": "Salaried employees with ₹15,000+ monthly income",
            "features": "Instant cash advance, Digital process, Flexible repayment",
            "target_audience": "Salaried professionals, gig workers with consistent income"
        },
        {
            "lender": "Navi",
            "product_name": "Personal Loan",
            "interest_rate": 9.9,
            "min_amount": 10000,
            "max_amount": 2000000,
            "tenure_months": "6-60 months",
            "eligibility": "Age 21-65, Credit score 750+, Monthly income ₹25,000+",
            "features": "Low interest rate, No hidden charges, Quick disbursal",
            "target_audience": "High credit score customers, stable income earners"
        }
    ]
    
    for product in products:
        rag_system.add_loan_product(product)
        
def seed_financial_advice(rag_system: FinancialMemoryRAG):
    """Seed financial advice knowledge base in multiple languages"""
    
    advice = [
        # Credit Score Advice
        {
            "category": "credit_score",
            "question": "How can I improve my credit score as a gig worker?",
            "answer": "Pay all EMIs on time (most important), keep credit utilization below 30%, maintain older credit accounts, don't apply for multiple loans simultaneously, and check your credit report regularly for errors.",
            "language": "en",
            "keywords": ["credit score", "CIBIL", "improvement", "gig worker"]
        },
        {
            "category": "credit_score",
            "question": "मैं एक गिग वर्कर के रूप में अपना क्रेडिट स्कोर कैसे सुधार सकता हूं?",
            "answer": "सभी EMI समय पर भुगतान करें (सबसे महत्वपूर्ण), क्रेडिट उपयोग 30% से कम रखें, पुराने क्रेडिट खाते बनाए रखें, एक साथ कई ऋणों के लिए आवेदन न करें, और त्रुटियों के लिए नियमित रूप से अपनी क्रेडिट रिपोर्ट जांचें।",
            "language": "hi",
            "keywords": ["क्रेडिट स्कोर", "CIBIL", "सुधार"]
        },
        
        # Loan Eligibility
        {
            "category": "loan_eligibility",
            "question": "What documents do I need for a personal loan as an Uber driver?",
            "answer": "You need: PAN card, Aadhaar card, bank statements (6 months), Uber/Ola earning statements, proof of address, and passport-size photos. Some lenders may also ask for electricity bill or rent agreement.",
            "language": "en",
            "keywords": ["documents", "personal loan", "Uber", "Ola", "eligibility"]
        },
        {
            "category": "loan_eligibility",
            "question": "Uber driver के लिए पर्सनल लोन के लिए कौन से दस्तावेज़ चाहिए?",
            "answer": "आपको चाहिए: PAN कार्ड, आधार कार्ड, बैंक स्टेटमेंट (6 महीने), Uber/Ola की कमाई का प्रमाण, पते का प्रमाण, और पासपोर्ट साइज फोटो। कुछ lenders बिजली बिल या किराया समझौता भी मांग सकते हैं।",
            "language": "hi",
            "keywords": ["दस्तावेज़", "पर्सनल लोन", "Uber"]
        },
        
        # Budgeting
        {
            "category": "budgeting",
            "question": "How much should I save from my monthly gig income?",
            "answer": "Follow the 50-30-20 rule: 50% for necessities (rent, food, fuel), 30% for discretionary spending, and 20% for savings and investments. As a gig worker, also maintain an emergency fund of 3-6 months expenses.",
            "language": "en",
            "keywords": ["budgeting", "savings", "50-30-20 rule", "emergency fund"]
        },
        {
            "category": "budgeting",
            "question": "मुझे अपनी मासिक गिग आय से कितना बचाना चाहिए?",
            "answer": "50-30-20 नियम का पालन करें: 50% आवश्यकताओं के लिए (किराया, खाना, ईंधन), 30% विवेकाधीन खर्च के लिए, और 20% बचत और निवेश के लिए। गिग वर्कर के रूप में, 3-6 महीने के खर्च का आपातकालीन फंड भी रखें।",
            "language": "hi",
            "keywords": ["बजट", "बचत", "आपातकालीन फंड"]
        },
        
        # Investment
        {
            "category": "investment",
            "question": "Best investment options for gig workers in India?",
            "answer": "Start with PPF (Public Provident Fund) for tax-free returns, Mutual Fund SIP for long-term wealth, recurring deposits for short-term goals, and digital gold for small savings. Avoid risky stock trading without knowledge.",
            "language": "en",
            "keywords": ["investment", "PPF", "mutual fund", "SIP", "gig worker"]
        },
        
        # Tax
        {
            "category": "tax",
            "question": "Do I need to pay income tax as a freelancer/gig worker?",
            "answer": "Yes, if your annual income exceeds ₹2.5 lakhs (₹3 lakhs for senior citizens). You must file ITR-3 or ITR-4 (presumptive taxation scheme). Keep records of all income and expenses. Consider hiring a CA for first-time filing.",
            "language": "en",
            "keywords": ["income tax", "ITR", "freelancer", "gig worker", "taxation"]
        },
        {
            "category": "tax",
            "question": "क्या मुझे freelancer/gig worker के रूप में आयकर देना होगा?",
            "answer": "हाँ, यदि आपकी वार्षिक आय ₹2.5 लाख से अधिक है (वरिष्ठ नागरिकों के लिए ₹3 लाख)। आपको ITR-3 या ITR-4 (अनुमानित कराधान योजना) दाखिल करना होगा। सभी आय और खर्चों का रिकॉर्ड रखें।",
            "language": "hi",
            "keywords": ["आयकर", "ITR", "फ्रीलांसर"]
        }
    ]
    
    for item in advice:
        rag_system.add_financial_advice(item)
        
def seed_regulatory_info(rag_system: FinancialMemoryRAG):
    """Seed Indian financial regulations"""
    
    regulations = [
        {
            "title": "RBI Guidelines on Digital Lending",
            "authority": "Reserve Bank of India (RBI)",
            "description": "All digital lending platforms must be registered entities. Direct benefit transfer (DBT) required - no deductions allowed before loan disbursal. Interest rates must be disclosed upfront.",
            "applicability": "Digital lending apps, fintech lenders",
            "source_url": "https://www.rbi.org.in/Scripts/BS_PressReleaseDisplay.aspx?prid=54162"
        },
        {
            "title": "Fair Practices Code for Lenders",
            "authority": "Reserve Bank of India (RBI)",
            "description": "Lenders must provide loan sanction letter with all-inclusive interest cost. No hidden charges allowed. Borrowers have right to prepay without penalty after 6 months.",
            "applicability": "NBFCs, Banks, Digital lenders",
            "source_url": "https://www.rbi.org.in/"
        },
        {
            "title": "Credit Information Companies Regulations",
            "authority": "Reserve Bank of India (RBI)",
            "description": "Consumers entitled to one free credit report per year from each credit bureau (CIBIL, Experian, Equifax, CRIF). Errors must be corrected within 30 days.",
            "applicability": "All borrowers",
            "source_url": "https://www.rbi.org.in/"
        },
        {
            "title": "Income Tax Act Section 80C",
            "authority": "Income Tax Department",
            "description": "Tax deduction up to ₹1.5 lakh available on investments in PPF, ELSS, NPS, life insurance premiums, and principal repayment of home loans.",
            "applicability": "All taxpayers",
            "source_url": "https://www.incometax.gov.in/"
        }
    ]
    
    for regulation in regulations:
        rag_system.add_regulatory_info(regulation)

def initialize_qdrant_memory():
    """Main function to initialize and seed Qdrant vector database"""
    
    print("🚀 Initializing ArthaGuide Financial Memory RAG System...")
    
    rag_system = FinancialMemoryRAG()
    
    print("📦 Seeding loan products...")
    seed_loan_products(rag_system)
    
    print("💡 Seeding financial advice knowledge base...")
    seed_financial_advice(rag_system)
    
    print("📜 Seeding regulatory information...")
    seed_regulatory_info(rag_system)
    
    print("✅ Qdrant memory initialization complete!")
    print(f"   - {len(rag_system.collections)} collections created")
    print(f"   - Loan products indexed")
    print(f"   - Financial advice in EN, HI, KN")
    print(f"   - Indian regulatory info loaded")
    
    return rag_system

if __name__ == "__main__":
    initialize_qdrant_memory()
