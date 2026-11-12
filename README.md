# ArthaGuide

Conversational loan planning for Indian gig workers, with a payment-aware PayPal sandbox demo.

**Recording teammate:** [Demo script and setup PDF](output/pdf/ArthaGuide_Demo_Script_and_Setup.pdf) | [Editable handoff](docs/TEAMMATE_DEMO_HANDOFF.md). The 2:50 script concentrates on the loan adviser, live extraction, repayment stress test, and an actual sandbox deposit changing the financing gap. Required API credentials and buyer-account setup are included. Live AI and real sandbox payment must be verified before recording.

```powershell
git clone https://github.com/shreyasNaik0101/ArthaGuide.git
cd ArthaGuide
```

Source is licensed under [MIT](LICENSE). Original Artha Guide contributors are credited below; the event additions are described in the setup guide.
#read LOAN_ADVISOR_README.md

#read PROJECT_DOCUMENTATION.md

Team Members name --> Shreyas Naik , Gaurav Durge , Anshul Vaibhav and Swayam S

## PayPal AI Hackathon: freelancer repair & repayment adviser

The existing **Advisor** entry point now opens a conversational loan adviser for an Indian freelance video editor, with a linked cash timeline and payment review. It compares two synthetic loan offers and lets an actual PayPal sandbox deposit change the repair-date financing gap. The original general chat remains available inside the detailed plan.

The loan adviser is the app's default screen at `/`, the highlighted navigation action immediately after Home, and the destination of the brand button. Supporting sections remain accessible; the animated landing page is at `/#hero` and its primary action opens the adviser. Named hash links also preserve the selected section on refresh.

**Conversational entry:** Advisor now opens a proper chat interface. With an OpenAI key, the bot responds to your messages, proposes cash/expense/client facts for confirmation, and explains repayment using deterministic calculator results. The **Try the laptop repair story** button is a clearly labeled guided demo that also works without a key. **Client pays a week late** runs the real calculator in the conversation. Use **Review sources & payment** to inspect source quotes, apply extracted loan terms, and issue/check the PayPal invoice; **Back to our conversation** brings the reviewed plan back into chat. A **Prepare lender-review summary** action creates an in-app draft only: the application status is **Not submitted**, and there is no lender integration or loan sanction.

**Automatic financial context:** Chat imports saved `arthaguide_transactions` on entry, computes the integer-paise net through the current local calendar date, and displays its source, snapshot date, latest transaction date, and entry count. It assumes a zero starting balance and may contain the dashboard's seeded examples: it is **not a bank balance**. Missing, malformed, mixed-currency, or negative-net history requires manual cash confirmation; it never silently becomes the ₹6,000 story. Old history is flagged. Confirm spendable cash, review missing bills/debt installments/other expected income, and explicitly confirm the repair/project/sample terms before recommendations or lender-review summaries become available. The AI receives that source/completeness context and asks about missing information. Server-side gating applies even if UI controls are bypassed.

Dashboard mode removes synthetic ordinary expenses and local gig income. Enter future obligations separately; amounts must be INR and dates must be after the cash snapshot, through the 17 Dec 2026 demo horizon. Historical entries are never replayed as future cash flows. The displayed USD client project remains a separate modeled promise; do not add it as other income again. Promised income cannot close the repair-date gap, including promises dated before the repair. Validated future events persist separately in `arthaguide_planned_events`, without altering dashboard transactions. Returning to the adviser, browser focus, and transaction-change events refresh changed dashboard data and require a new review. **Try the laptop repair story** explicitly switches to the original synthetic fixture; **Use my dashboard instead** restores dashboard mode and its saved future events. Current repair/project/loan dates remain scoped to this demo; this is not a live bank connection or lender underwriting system.

### Run locally (Windows PowerShell)

Requires Python 3.11+ and Node 20+. From the repo root, create an isolated backend environment:

```powershell
python -m venv backend/.venv
backend/.venv/Scripts/python.exe -m pip install -r backend/requirements-demo.txt
if (!(Test-Path backend/.env)) { Copy-Item backend/.env.example backend/.env }
```

Edit `backend/.env` locally. Never put these secrets in frontend variables or commit them:

```dotenv
OPENAI_API_KEY=your-real-api-key
OPENAI_MODEL=gpt-4o-mini
PAYPAL_CLIENT_ID=your-sandbox-merchant-app-client-id
PAYPAL_CLIENT_SECRET=your-sandbox-merchant-app-secret
PAYPAL_BUYER_EMAIL=your-separate-sandbox-personal-account-email
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
# Optional: absolute path to persistent demo SQLite file.
# DEMO_DB_PATH=C:/path/to/demo.sqlite3
```

Start the backend in one terminal:

```powershell
cd backend
.venv/Scripts/python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

Start the frontend in a second terminal:

```powershell
cd frontend
npm ci --no-audit --no-fund
npm run dev -- --host 127.0.0.1
```

Open **http://127.0.0.1:3000/#advisor**, or use the existing **Advisor / Ask Loan Advisor** button. API docs: http://127.0.0.1:8000/docs. Restart the backend after changing environment variables. On macOS/Linux use `backend/.venv/bin/python` / `.venv/bin/python` instead of the Windows Python paths.

The new workflow uses Vite's existing `/api` proxy. It ignores the legacy `VITE_API_URL`, which may refer to an old deployment. Only if using a different backend, set `VITE_FREELANCER_API_URL=http://127.0.0.1:8000/api/freelancer`. `vite preview` also needs the backend running; use `npm run dev` for the documented demo.

If layouts or buttons appear unstyled after updating this checkout, stop and restart `npm run dev`, then reload the browser. The project uses locally compiled Tailwind v3; a Vite process started with the earlier v4 PostCSS plugin can retain that processor until restarted. A successful production build alone does not verify the stylesheet served by an already-running dev process.

The calculator works without provider credentials. Missing AI credentials produce a visible setup error, with no fake AI response. Invoice issuance stays disabled until sandbox configuration is present. The optional Gemini navigation router is skipped if its SDK is missing; standard navigation still works. This demo does not require MongoDB, Qdrant, sentence-transformers, or downloading an embedding model.

### Demo inputs and verified arithmetic

All dates below are explicit scenario dates in **2026**, independent of the computer's clock. Opening cash is ₹6,000 on 15 November. Repair costs ₹24,000 on 16 November: the gap is ₹18,000 before borrowing. The client first promises 21 November, then explicitly supersedes it with **24 November**. The late switch uses **1 December**, seven days after the latest promise.

| Synthetic offer | Principal / minimum | All-in fee | Installments | Total repayment | Lowest balance, expected / late |
| --- | --- | --- | --- | --- | --- |
| A: Quick Bridge | ₹20,000 / ₹20,000 | ₹1,200 | ₹10,600 on 27 Nov and 10 Dec | ₹21,200 | ₹2,000 / **−₹5,100** |
| B: Steady Bridge | ₹20,000 / ₹20,000 | ₹2,400 | ₹11,200 on 3 Dec and 17 Dec | ₹22,400 | ₹2,000 / **₹2,000** |

Both disburse the full principal on the repair date. Fees are included in installments, with no upfront deduction. The cards compare these fixed ₹20,000 offers, separately from the financing gap. The initial gap is already below their minimum; after the deposit, **neither offer supports borrowing only ₹6,000**, which is shown explicitly.

Ordinary modeled cash events: +₹8,000 local gig on 18 Nov; −₹3,000 groceries/transport on 19 Nov; −₹1,500 internet/phone on 29 Nov; −₹4,000 rent contribution on 5 Dec; +₹6,000 local gig on 7 Dec; −₹2,000 groceries on 12 Dec. With no deposit and late payment, cash immediately before Quick Bridge's first installment is ₹7,000. Its ₹10,600 installment on **27 Nov creates a ₹3,600 shortfall**, deepening to ₹5,100 after the 29 Nov expense. Steady Bridge remains above zero through the full 17 Dec repayment horizon.

The standalone deposit invoice is **$160 USD against the $400 project**, not an extra project. Only a matching PayPal `PAID` invoice with PayPal transaction type, transaction ID, paid amount, currency, and configured recipient is credited. Pending, partial, manually marked, refunded, or mismatched payments are excluded. After confirmation the project balance becomes **$240**, and the modeled deposit is **($160 − $10) × ₹80/USD = ₹12,000**. The $10 fee and conversion rate are labeled demo assumptions, not actual PayPal pricing or a bank settlement promise. Modeled spendability on 16 Nov changes the gap to ₹6,000; spendability on 17 Nov leaves the repair-date gap at ₹18,000.

All calculations run server-side using integer paise/cents. Expenses and installments run before expected income on the same date. The opening balance, modeled deposit availability, and loan disbursal run before the repair. Future income remains labeled expected income. The optional **Use dashboard balance** action imports the existing local transaction net through 15 Nov, without modifying dashboard storage; restore the sample balance for the recording.

### Live AI review

1. Keep the prefilled synthetic messages and two offers, or paste your own explicit terms.
2. Click **Extract terms with live AI**. The backend uses OpenAI structured output and validates amounts, currencies, dates, totals, minimums, and verbatim source quotes.
3. Review the full project amount, original and revised dates, exact superseding message, principal, fees, minimum loan, disbursal, fee timing, and every installment.
4. Missing or unresolved terms block applying the extraction. Correct the pasted text and extract again. A resolved date revision is shown as a review warning.
5. Click **I reviewed the sources · apply these terms**. Calculations now use the stored extraction, rather than an unrelated hardcoded recommendation. Editing either input returns the comparison to the labeled sample until you extract and review again.
6. **Explain this comparison** sends the actual current calculator output to the model. It responds in English, Hindi, or Kannada according to the existing language selector. Main workflow headings are translated; detailed demo terms and operational copy are English.

### Real PayPal sandbox test and recording preparation

1. In the [PayPal Developer Dashboard](https://developer.paypal.com/dashboard/), create/select a **sandbox REST app tied to a Business merchant account** with Invoicing enabled. Add its Client ID and Secret to `backend/.env`.
2. Create a separate **sandbox Personal buyer account**, with test funds and a login you can access. Set its email as `PAYPAL_BUYER_EMAIL`. The buyer must differ from the merchant. Use sandbox accounts that support USD invoices; a US test merchant/buyer pair is suitable for proving the integration while the product models an Indian freelancer.
3. Restart the backend and refresh the adviser. Keep the sample ₹6,000 cash balance and availability date **16 Nov 2026**. Start with an unpaid invoice; the gap must read **₹18,000**.
4. Review **$160.00 USD** and the configured test recipient in the PayPal panel. Tick approval and click **Approve & issue deposit invoice**. The server creates a draft, saves its ID, issues it with email notifications suppressed, then retrieves the hosted share link. No email tool or automatic borrower payment is involved.
5. Click **Open hosted payer link**. In the hosted sandbox page, sign in as the separate Personal buyer and actually pay the invoice. If your browser has the merchant session, use a separate browser profile/private session for the buyer.
6. Return to Artha Guide and click **Check payment**. The merchant backend fetches its stored invoice directly from PayPal. A verified $160 USD payment changes the gap to **₹6,000**, shows modeled net ₹12,000 separately from payment status, and reduces the future project balance to $240.
7. Click **Check payment** again twice, then refresh and check again. The result stays ₹6,000: the app derives one deposit from one persistent invoice, without appending duplicate credits.
8. Change availability to **17 Nov 2026**: the repair-date gap returns to ₹18,000 even though PayPal still says paid. Restore 16 Nov for the final shot.

The only PayPal API host is `api-m.sandbox.paypal.com`; there is no production mode. Invoice and reviewed-extraction state persist in ignored `backend/data/demo.sqlite3`. Keep that file through the recording. To rehearse with a fresh, separate invoice, stop the backend and set `DEMO_DB_PATH` to a **new file path**, then restart; existing sandbox invoices remain in the merchant account. There is no reset/mark-paid button or fake paid endpoint. One backend process/worker and one freelancer are supported. Keep this local demo bound to loopback: authentication, webhooks, live payment operations, and multi-user hosting are outside scope.

PayPal references used: [Invoicing quick start](https://developer.paypal.com/api/invoicing/), [hosted-link issuance](https://developer.paypal.com/api/invoicing/v2/invoices-send/), [invoice status and payment object](https://developer.paypal.com/invoicing/object/), and the [v2 API schema](https://developer.paypal.com/api/invoicing/v2/schema.json). AI integration follows the [official OpenAI structured-output guide](https://developers.openai.com/api/docs/guides/structured-outputs?api-mode=chat).

### Verification commands

From `backend` with the backend already running for HTTP checks:

```powershell
.venv/Scripts/python.exe -m unittest discover -s tests -v
.venv/Scripts/python.exe scripts/verify_demo.py
# Live services: these require your keys / actual sandbox buyer payment.
.venv/Scripts/python.exe scripts/verify_demo.py --ai
.venv/Scripts/python.exe scripts/verify_demo.py --paypal
```

From `frontend`: `node --test tests/financialContext.test.js`, then `npm run build`. Unit tests isolate their SQLite file and mock remote responses; they do **not** prove a real PayPal payment or a live model invocation. The live flags never substitute mock data.

### What existed versus this event's work

**Existing Artha Guide:** React/Vite UI, Advisor entry point and multilingual chat, English/Hindi/Kannada i18n, dashboard with `arthaguide_transactions` local storage, loan marketplace, FastAPI routes, Qdrant memory/embedding service, and navigation. In this checkout, importing Qdrant fails because `qdrant_client` and `sentence_transformers` are absent. The active `/api/rag-chat` route uses hardcoded context and did not start without an OpenAI key; Gemini navigation also had an unavailable import.

**Built for this event:** repair-date gap, deterministic repayment stress test and timeline, two synthetic offers, live structured intake with source evidence and review, calculator-grounded multilingual explanation, sandbox Invoicing v2 issuance/share/check, persistent verification and duplicate-credit prevention, and focused test/setup documentation. Legacy chat is preserved in `GeneralAdvisor.jsx`; OpenAI initialization is lazy and `.env` loads before router imports so provider setup does not prevent the deterministic demo from starting.

See [the under-three-minute recording script](docs/RECORDING_SCRIPT.md) and [the actual-run handoff](docs/HANDOFF.md). Publishing the repository and uploading the recording remain with the owner. The [hackathon rules](https://paypalaihackathon.devpost.com/rules) are linked for the owner’s submission review.


## Free guided-only hosted demo

The `render.yaml` blueprint runs the FastAPI backend on Render's free web service without AI or PayPal credentials. Its SQLite file is temporary: do not use it for a real PayPal invoice. GitHub Pages builds a guided-only frontend when repository variable `DEMO_API_URL` contains the deployed backend origin, for example `https://your-service.onrender.com` (no trailing slash). In GitHub Settings > Pages select GitHub Actions. Then run the Deploy frontend to GitHub Pages workflow. It skips deployment until the backend variable is configured. The public site uses `/ArthaGuide/` as its asset base. Live AI chat and PayPal payment UI are disabled in this build; the sample calculator and dashboard still work. Render free services can sleep and take time to wake.
