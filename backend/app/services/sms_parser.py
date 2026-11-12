import re
from datetime import datetime
from typing import List, Dict

class SMSParser:
    def __init__(self):
        self.amount_regex = re.compile(r'(INR|Rs\.?|₹)\s*([0-9,]+\.?[0-9]*)', re.IGNORECASE)
        self.debit_regex = re.compile(r'(debited|spent|withdrawn|paid)', re.IGNORECASE)
        self.credit_regex = re.compile(r'(credited|received|deposit|salary|refund)', re.IGNORECASE)
        self.upi_regex = re.compile(r'(UPI|GPay|PhonePe|Paytm)', re.IGNORECASE)
        self.merchant_regex = re.compile(r'(Swiggy|Zomato|Uber|Ola|Amazon|Flipkart|IRCTC|Metro|Fuel|HP|IOCL|Cafe|Restaurant|Hotel|Movie)', re.IGNORECASE)
        self.date_regex = re.compile(r'(\d{2}[/-]\d{2}[/-]\d{2,4}|\d{4}-\d{2}-\d{2})')

    def categorize(self, text: str) -> str:
        text_lower = text.lower()
        if re.search(r'salary|income|credited|neft|rtgs|imps', text_lower):
            return 'Income'
        elif re.search(r'swiggy|zomato|restaurant|cafe|food', text_lower):
            return 'Food'
        elif re.search(r'uber|ola|metro|irctc|travel|ticket', text_lower):
            return 'Travel'
        elif re.search(r'fuel|petrol|diesel|hp|iocl', text_lower):
            return 'Transport'
        elif re.search(r'amazon|flipkart|shopping', text_lower):
            return 'Shopping'
        elif re.search(r'bill|electricity|water|rent', text_lower):
            return 'Bills'
        elif self.upi_regex.search(text):
            return 'UPI'
        else:
            return 'Others'

    def parse_sms(self, sms_text: str) -> List[Dict]:
        lines = [line.strip() for line in sms_text.split('\n') if line.strip()]
        transactions = []

        for line in lines:
            amount_match = self.amount_regex.search(line)
            if not amount_match:
                continue

            amount = float(amount_match.group(2).replace(',', ''))
            
            tx_type = 'credit' if self.credit_regex.search(line) else 'debit'
            
            merchant_match = self.merchant_regex.search(line)
            merchant = merchant_match.group(1) if merchant_match else (
                'UPI' if self.upi_regex.search(line) else 'Payment'
            )
            
            category = self.categorize(line)
            
            date_match = self.date_regex.search(line)
            date = date_match.group(0) if date_match else datetime.now().strftime('%Y-%m-%d')
            
            transactions.append({
                'amount': amount,
                'type': tx_type,
                'merchant': merchant,
                'category': category,
                'date': date,
                'raw_sms': line
            })

        return transactions
