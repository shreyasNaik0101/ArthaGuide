# Teammate demo handoff

Target: 2:50. Read only the narration; rehearse the actual AI and sandbox payment.

## Required configuration

- **OPENAI_API_KEY:** Required for this checkout: live chat, extraction, and explanations. Use an API project with billing/credits and model access.
- **OPENAI_MODEL:** Optional setting, not a secret. Default: gpt-4o-mini. Select a model your API project can access.
- **PAYPAL_CLIENT_ID:** Required: Client ID from a sandbox REST app tied to the Business merchant account.
- **PAYPAL_CLIENT_SECRET:** Required: Secret from that same sandbox merchant app. Backend only.
- **PAYPAL_BUYER_EMAIL:** Required configuration: the separate sandbox Personal buyer email. This is not an API key.
- **Sandbox buyer login:** Email/password and test funds for paying the hosted invoice. Enter the password only on PayPal, never in the app or repo.

```dotenv
OPENAI_API_KEY=your_api_key
OPENAI_MODEL=gpt-4o-mini
PAYPAL_CLIENT_ID=your_sandbox_app_client_id
PAYPAL_CLIENT_SECRET=your_sandbox_app_secret
PAYPAL_BUYER_EMAIL=your_sandbox_personal_buyer_email
```

Gemini is not wired into this checkout. Never commit real secrets. See README for complete launch steps.

## Timed script

### 0:00-0:18 - The freelancer and the borrowing question

**Show:** Open the loan adviser. Select Try the laptop repair story. Point to the INR 18,000 gap.

**Say:** Artha Guide helps Indian gig workers make clearer borrowing decisions. Our video editor needs a 24,000-rupee laptop repair to keep working. With 6,000 available, they are 18,000 short by 16 November.

### 0:18-0:43 - Show live AI and the evidence

**Show:** Open Review sources & payment. Click Extract terms with live AI. Show the revised date, its source quote, and loan terms; apply the reviewed terms. Keep only a brief view of the review fields.

**Say:** The client owes 400 dollars. AI reads the conversation and loan offers, identifying the later message that moves payment from 21 to 24 November. We review its source quotes before applying the extracted terms. Cash and repayment calculations run in deterministic code.

### 0:43-1:08 - Make the repayment risk visible

**Show:** Turn on Client pays one week late. Point to the first shortfall and both loan cards. Optionally return briefly to chat to show the same explanation.

**Say:** If the client pays a week late, Quick Bridge costs less overall but its 10,600-rupee installment on 27 November creates a 3,600-rupee shortfall. Steady Bridge costs 1,200 more overall, but its later installments keep the lowest balance at positive 2,000.

### 1:08-1:30 - Review and issue the PayPal deposit

**Show:** In the PayPal panel review $160.00 USD and the sandbox buyer email. Approve and issue. Show unpaid status and INR 18,000 gap, then open the hosted payer link.

**Say:** The adviser suggests requesting a 160-dollar deposit against the same project. The freelancer reviews the currency and test recipient, then issues a real PayPal sandbox invoice. An unpaid or pending invoice leaves the borrowing gap unchanged.

### 1:30-2:10 - Record the actual buyer payment

**Show:** Pay on the hosted PayPal sandbox page using the separate Personal buyer. Return to the app and click Check payment. Reserve quiet time for the real payment; rehearse buyer login in a separate profile first.

**Say:** Here the sandbox buyer pays the invoice. Check payment retrieves the stored invoice from our merchant backend and verifies the invoice total, currency, and PayPal transaction. A chat message alone cannot mark it paid.

### 2:10-2:50 - Show the changed answer and close

**Show:** Show PAID, modeled INR 12,000, and INR 6,000 gap. Click Check payment again. Show $240 outstanding and the minimum-loan notice. End on the adviser. Stop by 2:50.

**Say:** Using the labeled demo assumptions of a 10-dollar fee and 80 rupees per dollar, with funds available by repair day, the net deposit is 12,000 rupees. The gap falls to 6,000, and the remaining project amount is 240 dollars. Rechecking counts the deposit only once. Neither sample loan supports borrowing just 6,000. This event adds conversational loan planning, evidence review, and payment-aware repayment comparisons to our existing finance app. A lender still decides approval.

## Submission checks

- Under three minutes; show the actual app functioning.
- Public YouTube video and public open-source repo with a license.
- Explain existing app versus hackathon additions; identify AI model and PayPal Invoicing v2.
- Record actual sandbox buyer payment. No fake paid endpoint or claims of loan sanction.
- Rules: https://paypalaihackathon.devpost.com/rules
- Requirements: https://paypalaihackathon.devpost.com/
