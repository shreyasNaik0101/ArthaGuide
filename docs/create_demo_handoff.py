"""Generate the teammate PDF and matching Markdown from the same timed script."""
from pathlib import Path
from html import escape
import re
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_LEFT
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, Preformatted

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'output' / 'pdf' / 'ArthaGuide_Demo_Script_and_Setup.pdf'
SCENES = [
('0:00-0:18', 'The freelancer and the borrowing question',
 'Open the loan adviser. Select Try the laptop repair story. Point to the INR 18,000 gap.',
 'Artha Guide helps Indian gig workers make clearer borrowing decisions. Our video editor needs a 24,000-rupee laptop repair to keep working. With 6,000 available, they are 18,000 short by 16 November.'),
('0:18-0:43', 'Show live AI and the evidence',
 'Open Review sources & payment. Click Extract terms with live AI. Show the revised date, its source quote, and loan terms; apply the reviewed terms. Keep only a brief view of the review fields.',
 'The client owes 400 dollars. AI reads the conversation and loan offers, identifying the later message that moves payment from 21 to 24 November. We review its source quotes before applying the extracted terms. Cash and repayment calculations run in deterministic code.'),
('0:43-1:08', 'Make the repayment risk visible',
 'Turn on Client pays one week late. Point to the first shortfall and both loan cards. Optionally return briefly to chat to show the same explanation.',
 'If the client pays a week late, Quick Bridge costs less overall but its 10,600-rupee installment on 27 November creates a 3,600-rupee shortfall. Steady Bridge costs 1,200 more overall, but its later installments keep the lowest balance at positive 2,000.'),
('1:08-1:30', 'Review and issue the PayPal deposit',
 'In the PayPal panel review $160.00 USD and the sandbox buyer email. Approve and issue. Show unpaid status and INR 18,000 gap, then open the hosted payer link.',
 'The adviser suggests requesting a 160-dollar deposit against the same project. The freelancer reviews the currency and test recipient, then issues a real PayPal sandbox invoice. An unpaid or pending invoice leaves the borrowing gap unchanged.'),
('1:30-2:10', 'Record the actual buyer payment',
 'Pay on the hosted PayPal sandbox page using the separate Personal buyer. Return to the app and click Check payment. Reserve quiet time for the real payment; rehearse buyer login in a separate profile first.',
 'Here the sandbox buyer pays the invoice. Check payment retrieves the stored invoice from our merchant backend and verifies the invoice total, currency, and PayPal transaction. A chat message alone cannot mark it paid.'),
('2:10-2:50', 'Show the changed answer and close',
 'Show PAID, modeled INR 12,000, and INR 6,000 gap. Click Check payment again. Show $240 outstanding and the minimum-loan notice. End on the adviser. Stop by 2:50.',
 'Using the labeled demo assumptions of a 10-dollar fee and 80 rupees per dollar, with funds available by repair day, the net deposit is 12,000 rupees. The gap falls to 6,000, and the remaining project amount is 240 dollars. Rechecking counts the deposit only once. Neither sample loan supports borrowing just 6,000. This event adds conversational loan planning, evidence review, and payment-aware repayment comparisons to our existing finance app. A lender still decides approval.'),
]

KEYS = [
('OPENAI_API_KEY', 'Required for this checkout: live chat, extraction, and explanations. Use an API project with billing/credits and model access.'),
('OPENAI_MODEL', 'Optional setting, not a secret. Default: gpt-4o-mini. Select a model your API project can access.'),
('PAYPAL_CLIENT_ID', 'Required: Client ID from a sandbox REST app tied to the Business merchant account.'),
('PAYPAL_CLIENT_SECRET', 'Required: Secret from that same sandbox merchant app. Backend only.'),
('PAYPAL_BUYER_EMAIL', 'Required configuration: the separate sandbox Personal buyer email. This is not an API key.'),
('Sandbox buyer login', 'Email/password and test funds for paying the hosted invoice. Enter the password only on PayPal, never in the app or repo.'),
]

ENV = '''OPENAI_API_KEY=your_api_key
OPENAI_MODEL=gpt-4o-mini
PAYPAL_CLIENT_ID=your_sandbox_app_client_id
PAYPAL_CLIENT_SECRET=your_sandbox_app_secret
PAYPAL_BUYER_EMAIL=your_sandbox_personal_buyer_email'''

def build():
    OUT.parent.mkdir(parents=True, exist_ok=True)
    styles = getSampleStyleSheet()
    styles.add(ParagraphStyle(name='Brand', fontName='Helvetica-Bold', fontSize=10, leading=14, textColor=colors.HexColor('#7964ad'), spaceAfter=16))
    styles.add(ParagraphStyle(name='TitleAG', fontName='Helvetica-Bold', fontSize=29, leading=34, textColor=colors.HexColor('#24293f'), spaceAfter=15))
    styles.add(ParagraphStyle(name='SubAG', fontName='Helvetica', fontSize=12, leading=18, textColor=colors.HexColor('#74708b'), spaceAfter=16))
    styles.add(ParagraphStyle(name='BodyAG', fontName='Helvetica', fontSize=10, leading=15, textColor=colors.HexColor('#4b4c61'), spaceAfter=9))
    styles.add(ParagraphStyle(name='SmallAG', fontName='Helvetica', fontSize=8.5, leading=12, textColor=colors.HexColor('#76748b'), spaceAfter=7))
    styles.add(ParagraphStyle(name='SectionAG', fontName='Helvetica-Bold', fontSize=14, leading=19, textColor=colors.HexColor('#39314e'), spaceBefore=15, spaceAfter=9))
    styles.add(ParagraphStyle(name='KeyAG', fontName='Courier-Bold', fontSize=8, leading=12, textColor=colors.HexColor('#6c548f')))
    styles.add(ParagraphStyle(name='CueAG', fontName='Helvetica-Bold', fontSize=8, leading=12, textColor=colors.HexColor('#8b70b3'), spaceAfter=4))
    p = lambda text, style='BodyAG': Paragraph(text, styles[style])
    story = []
    def add(text, style='BodyAG'): story.append(p(text, style))
    def table(rows, widths):
        t = Table(rows, colWidths=widths, hAlign='LEFT')
        t.setStyle(TableStyle([('VALIGN',(0,0),(-1,-1),'TOP'),('BACKGROUND',(0,0),(-1,-1),colors.HexColor('#f6f3fa')),('LINEBELOW',(0,0),(-1,-1),.5,colors.white),('LEFTPADDING',(0,0),(-1,-1),12),('RIGHTPADDING',(0,0),(-1,-1),12),('TOPPADDING',(0,0),(-1,-1),10),('BOTTOMPADDING',(0,0),(-1,-1),10)]))
        story.append(t)
    add('ARTHA GUIDE  /  PRESENTER HANDOFF', 'Brand')
    add('The loan adviser is<br/>the story.', 'TitleAG')
    add('A 2-minute-50-second desktop demo, with setup instructions for the teammate recording it.', 'SubAG')
    table([[p('01 / UNDERSTAND','CueAG'),p('02 / COMPARE','CueAG'),p('03 / GET PAID','CueAG')],[p('Live AI extracts client promises and loan terms, with source quotes.','SmallAG'),p('Code stress-tests installments against dated cash flows.','SmallAG'),p('A verified PayPal deposit changes the borrowing gap.','SmallAG')]], [169,169,169])
    add('Before you record', 'SectionAG')
    for text in [
        'Configure and test the AI key and PayPal sandbox accounts. Development checks passed, but live AI and a real buyer payment were not verified because credentials were absent.',
        'Use English for this recording. The welcome and live-language prompts support Hindi/Kannada, but some operational copy is still English.',
        'Select the labeled laptop demo, not the imported dashboard balance. Keep INR 6,000 cash and estimated deposit availability on 16 Nov 2026. Use a fresh unpaid invoice for the take.',
        'Rehearse buyer login in a separate browser profile. Never record secrets or present a mocked PAID response as a real payment.',
    ]: add('• ' + text)
    add('What judges should see', 'SectionAG')
    add('Show the product functioning end-to-end, with meaningful AI and PayPal use. The video must be under three minutes and publicly visible on YouTube. Provide a public open-source repository with a license and runnable instructions. Explain the significant additions to the pre-existing app. Avoid unlicensed music or unrelated third-party material.', 'BodyAG')
    add('Rules checked 12 Nov 2026: <link href="https://paypalaihackathon.devpost.com/rules" color="#7964ad">Official rules</link> and <link href="https://paypalaihackathon.devpost.com/" color="#7964ad">submission requirements</link>. Final upload and Devpost submission stay with the team.', 'SmallAG')
    story.append(PageBreak())
    add('SETUP  /  FOR THE RECORDING TEAMMATE', 'Brand')
    add('Keys, accounts, and launch.', 'TitleAG')
    table([[p(escape(key),'KeyAG'),p(escape(desc),'SmallAG')] for key,desc in KEYS], [151,356])
    add('Put these in backend/.env', 'SectionAG')
    story.append(Preformatted(ENV, ParagraphStyle('Env',fontName='Courier',fontSize=8,leading=12,textColor=colors.HexColor('#65517e'),backColor=colors.HexColor('#f7f4fb'),borderPadding=10)))
    add('Gemini keys do not work in the current adviser: a Gemini adapter has not been added. No Qdrant, MongoDB, bank API, webhook, or frontend API secret is required for the focused demo. PayPal uses sandbox credentials only. Merchant and Personal buyer must be different accounts; a USD-capable test pair is needed.', 'SmallAG')
    add('Launch and prove the live path', 'SectionAG')
    for text in [
        'Clone github.com/shreyasNaik0101/ArthaGuide. Follow README setup: Python 3.11+, Node 20+, backend/requirements-demo.txt, and npm ci in frontend.',
        'Terminal 1, inside backend: .venv/Scripts/python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000. Terminal 2, inside frontend: npm run dev -- --host 127.0.0.1. Open http://127.0.0.1:3000/.',
        'From backend, run scripts/verify_demo.py --ai with the venv Python. Rehearse invoice issuance and the actual buyer payment, then run scripts/verify_demo.py --paypal. Restart the backend after changing .env.',
        'For the recorded take, stop the backend, set DEMO_DB_PATH to a NEW file path, and restart. This creates a fresh local invoice slot without deleting an earlier PayPal invoice. Keep this file throughout the take.',
    ]: add('• ' + text,'SmallAG')
    add('Do not commit .env, buyer passwords, API keys, or the SQLite file. Share credentials with your teammate through a private channel. Judges need clear access instructions; do not publish secrets in a public repository.', 'SmallAG')
    story.append(PageBreak())
    add('RECORDING SCRIPT  /  PART 1', 'Brand')
    add('Start with the decision.', 'TitleAG')
    add('Read only the SAY text. SHOW is an action cue. Timing includes navigation and model latency; rehearse with the configured services first.', 'SubAG')
    for timing,title,show,say in SCENES[:3]:
        story.append(KeepTogether([p(timing+'  /  '+title,'SectionAG'),p('SHOW','CueAG'),p(escape(show),'SmallAG'),p('SAY','CueAG'),p(escape(say))]))
    add('Recording tip', 'SectionAG')
    add('Skip tours of Dashboard, Business, and the loan marketplace. The audience, loan conversation, source evidence, and installment failure are the first half of the story. Do not narrate loan sanction, credit approval, or automatic repayments: the app does none of these.', 'SmallAG')
    story.append(PageBreak())
    add('RECORDING SCRIPT  /  PART 2', 'Brand')
    add('Make PayPal change the answer.', 'TitleAG')
    for timing,title,show,say in SCENES[3:]:
        story.append(KeepTogether([p(timing+'  /  '+title,'SectionAG'),p('SHOW','CueAG'),p(escape(show),'SmallAG'),p('SAY','CueAG'),p(escape(say))]))
    add('Final shot / 2:50', 'SectionAG')
    add('Keep the INR 6,000 gap, confirmed payment, and minimum-loan notice visible. The $10 fee, INR 80/USD conversion, and repair-day availability are modeled assumptions, not actual PayPal fees, FX quotes, or a settlement guarantee. Upload only after the real flow succeeds.', 'SmallAG')
    def decorate(canvas, doc):
        canvas.setStrokeColor(colors.HexColor('#e9e3f0')); canvas.line(44,42,551,42)
        canvas.setFont('Helvetica',8); canvas.setFillColor(colors.HexColor('#9b8dab'))
        canvas.drawString(44,28,'ARTHA GUIDE  •  PAYPAL AI HACKATHON  •  TEAM HANDOFF')
        canvas.drawRightString(551,28,f'{doc.page} / 4')
    doc = SimpleDocTemplate(str(OUT),pagesize=(595.28,841.89),rightMargin=44,leftMargin=44,topMargin=40,bottomMargin=57,title='ArthaGuide - Demo Script and Teammate Setup',author='ArthaGuide team')
    doc.build(story,onFirstPage=decorate,onLaterPages=decorate)
    md = ['# Teammate demo handoff', '', 'Target: 2:50. Read only the narration; rehearse the actual AI and sandbox payment.', '', '## Required configuration', '']
    md += [f'- **{key}:** {desc}' for key,desc in KEYS]
    md += ['', '```dotenv', ENV, '```', '', 'Gemini is not wired into this checkout. Never commit real secrets. See README for complete launch steps.', '', '## Timed script', '']
    for timing,title,show,say in SCENES:
        md += [f'### {timing} - {title}', '', '**Show:** '+show, '', '**Say:** '+say, '']
    md += ['## Submission checks', '', '- Under three minutes; show the actual app functioning.', '- Public YouTube video and public open-source repo with a license.', '- Explain existing app versus hackathon additions; identify AI model and PayPal Invoicing v2.', '- Record actual sandbox buyer payment. No fake paid endpoint or claims of loan sanction.', '- Rules: https://paypalaihackathon.devpost.com/rules', '- Requirements: https://paypalaihackathon.devpost.com/', '']
    (ROOT/'docs'/'TEAMMATE_DEMO_HANDOFF.md').write_text('\n'.join(md),encoding='utf-8')
    words = sum(len(re.findall(r"\b[\w'-]+\b",scene[3])) for scene in SCENES)
    print(f'PDF: {OUT}\nNarration words: {words}; target duration: 2:50')

if __name__ == '__main__': build()
