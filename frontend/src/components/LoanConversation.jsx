import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import './LoanConversation.css';
import FinancialContextReview from './FinancialContextReview';
import { demoContext } from '../services/financialContext';

const GUIDED_ONLY = import.meta.env.VITE_GUIDED_ONLY === 'true';
const BASE = import.meta.env.VITE_FREELANCER_API_URL || '/api/freelancer';
async function call(path, body) {
  const r = await fetch(BASE + path, body === undefined ? {} : { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const data = await r.json();
  if (!r.ok) throw new Error(typeof data.detail === 'string' ? data.detail : 'Please review the dates and amounts.');
  return data;
}
const money = n => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n / 100);
const labels = { cash_minor: 'Cash available', repair_minor: 'Repair cost', project_usd_minor: 'Client project (USD)', payment_date: 'Client payment date', late: 'Client one week late' };
const welcome = { en: 'Hi, I’m your Artha Guide. Let’s work out what you need and what you could repay. What do you need the money for, and how much will it cost?', hi: 'नमस्ते! मैं आपका Artha Guide हूँ। आपको पैसे किस काम के लिए चाहिए और उस पर कितना खर्च होगा?', kn: 'ನಮಸ್ಕಾರ! ನಾನು ನಿಮ್ಮ Artha Guide. ನಿಮಗೆ ಹಣ ಯಾವುದಕ್ಕೆ ಬೇಕು ಮತ್ತು ಎಷ್ಟು ವೆಚ್ಚವಾಗುತ್ತದೆ?' };

export default function LoanConversation({ context, notice, onReload, onContext, onOpenPlan }) {
  const { i18n } = useTranslation();
  const [boot, setBoot] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [pending, setPending] = useState(null);
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [started, setStarted] = useState(false);
  const [summary, setSummary] = useState(false);
  const end = useRef(null);
  useEffect(() => { call('/bootstrap').then(setBoot).catch(e => setError(e.message)); }, []);
  useEffect(() => { let active = true; setResult(null); setSummary(false); call('/calculate', context).then(r => { if (active) setResult(r); }).catch(e => { if (active) { setError(e.message); setResult(null); } }); return () => { active = false; }; }, [context]);
  useEffect(() => { const log = end.current?.parentElement; if (log && (messages.length || busy || pending)) log.scrollTo({ top: log.scrollHeight, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' }); }, [messages, busy, pending]);
  const append = (role, content) => setMessages(m => [...m, { role, content }]);
  const send = async e => {
    e?.preventDefault();
    if (!input.trim() || busy || pending) return;
    const history = [...messages, { role: 'user', content: input.trim() }].slice(-24);
    setMessages(history); setInput(''); setBusy(true); setError(''); setSummary(false);
    try {
      const data = await call('/chat', { ...context, messages: history, language: ['hi', 'kn'].includes(i18n.language) ? i18n.language : 'en' });
      append('assistant', data.reply);
      if (data.requires_review) setPending(data.proposed_changes);
      setStarted(true);
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  };
  const demo = () => {
    onContext(demoContext());
    setMessages([{ role: 'user', content: 'Use the sample freelancer story: I need ₹24,000 to repair my laptop by 16 November 2026. I have ₹6,000. An overseas client owes me $400.' }, { role: 'assistant', content: 'Using the labeled demo story: you are ₹18,000 short on 16 November. Your client’s later message moves the payment from 21 to 24 November. That promise comes after the repair, so it doesn’t reduce today’s borrowing gap. Shall we test what happens if the client pays a week late?' }]);
    setStarted(true); setPending(null); setError(''); setSummary(false);
  };
  const stress = async () => {
    if (busy || pending || result?.context_gaps?.length) return;
    setBusy(true); setError(''); setSummary(false);
    const next = { ...context, late: !context.late };
    try {
      const data = await call('/calculate', next); onContext(next); setResult(data);
      append('user', next.late ? 'What if my client pays one week late?' : 'Compare the expected payment date again.');
      const bad = data.offers.find(o => o.repayment_shortfall);
      append('assistant', bad ? `The calculator finds a problem with ${bad.name}: its ${money(-bad.repayment_shortfall.amount_minor)} installment on ${bad.repayment_shortfall.date} leaves you ${money(bad.repayment_shortfall.shortfall_minor)} short. ${data.recommended ? data.recommended + ' stays above zero in this forecast.' : 'Neither offer keeps this forecast above zero.'} ${GUIDED_ONLY ? 'Open the full timeline to see each payment.' : 'Shall we review a client deposit before borrowing?'}` : `${data.recommended || 'Neither offer'}${data.recommended ? ' fits this forecast at the offered principal.' : ' fits this forecast.'} The cash gap is ${money(data.gap_minor)}. These are sample offers; I can help you compare them, but a lender must decide approval.`);
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  };
  const prepare = () => { if (result?.context_gaps?.length) return; setSummary(true); append('user', 'Prepare my summary for lender review.'); append('assistant', 'Here is a draft based on this modeled cash timeline. No loan has been sanctioned or submitted. Review the amount and minimum loan sizes before sharing it with a lender.'); };
  const safe = result?.offers.find(o => o.name === result.recommended);
  const needsReview = !result || Boolean(result.context_gaps?.length);
  return <main className="loan-chat-page"><div className="loan-chat-shell">
    <div className="loan-chat-heading"><div><span className="workspace-eyebrow">YOUR PERSONAL LOAN ADVISER</span><h1>Let’s talk about your next step.</h1><p>A conversation first. A clearer borrowing decision next.</p></div><button onClick={onOpenPlan}>{GUIDED_ONLY ? 'View repayment comparison ↗' : 'Review sources & payment ↗'}</button></div>
    <div className="loan-chat-layout"><section className="loan-chat-window" aria-label="Loan adviser conversation">
      <header className="loan-chat-top"><span className="loan-chat-avatar">a</span><div><strong>Artha Guide</strong><small>{GUIDED_ONLY ? 'Guided sample · AI and PayPal disabled' : boot?.ai_configured ? 'Live AI · calculator-backed advice' : 'Guided demo · live chat needs an API key'}</small></div><span className="loan-chat-label">Loan planning</span></header>
      <FinancialContextReview context={context} result={result} notice={notice} onContext={onContext} onReload={onReload} />
      <div className="loan-chat-messages" role="log" aria-live="polite"><div className="loan-message assistant"><span className="loan-bubble-label">ARTHA GUIDE</span><p>{welcome[i18n.language] || welcome.en}</p></div>{messages.map((m, n) => <div key={n} className={`loan-message ${m.role}`}><span className="loan-bubble-label">{m.role === 'user' ? 'YOU' : 'ARTHA GUIDE'}</span><p>{m.content}</p></div>)}
        {pending && <div className="loan-fact-review"><strong>Did I understand you correctly?</strong><p>Review these proposed facts before they change your plan.</p><dl>{Object.entries(pending).map(([key, value]) => <div key={key}><dt>{labels[key]}</dt><dd>{key === 'payment_date' ? value : key === 'late' ? value ? 'Yes' : 'No' : key === 'project_usd_minor' ? `$${(value / 100).toFixed(2)}` : money(value)}</dd></div>)}</dl><button onClick={() => { onContext({ ...context, ...pending, financial_context: { ...context.financial_context, ...(pending.cash_minor !== undefined ? { source: 'manual', balance_confirmed: true } : {}) } }); setPending(null); append('assistant', 'Thanks—those facts are now applied to your cash plan. Would you like to stress-test the repayment dates or review the client messages and loan terms?'); }}>Confirm these facts</button><button className="secondary" onClick={() => { setPending(null); append('assistant', 'I haven’t applied those changes. Please tell me which fact to correct.'); }}>Correct them</button></div>}
        {busy && <div className="loan-message assistant loan-thinking">Checking your cash timeline<span>•••</span></div>}
        {summary && result && <div className="loan-review-summary"><span>DRAFT · NOT SUBMITTED</span><h3>For lender review</h3><dl><div><dt>Financing gap</dt><dd>{money(result.gap_minor)}</dd></div><div><dt>Needed by</dt><dd>{result.repair_date}</dd></div><div><dt>Compared sample</dt><dd>{safe?.name || 'No suitable offer'}</dd></div>{safe && <><div><dt>Offered principal / minimum</dt><dd>{money(safe.principal_minor)} / {money(safe.minimum_minor)}</dd></div><div><dt>Total repayment</dt><dd>{money(safe.total_repayment_minor)}</dd></div><div><dt>Lowest forecast balance</dt><dd>{money(safe.lowest_balance_minor)}</dd></div></>}</dl><p>Sample cash-flow comparison only. No lender connection, application, credit decision, or sanction.</p>{safe && !safe.supports_gap && <strong>The sample minimum exceeds your gap. This is not a quote for the smaller amount.</strong>}</div>}
        <div ref={end}/>
      </div>
      {error && <div className="loan-chat-error" role="alert">{error}</div>}
      <div className="loan-chat-suggestions">{!started ? <button disabled={busy} onClick={demo}>Try the laptop repair story ↗</button> : <><button disabled={busy || !!pending || needsReview} onClick={stress}>{context.late ? 'Use expected payment date' : 'Client pays a week late'}</button><button onClick={onOpenPlan}>{GUIDED_ONLY ? 'View repayment comparison' : 'Review deposit & loan sources'}</button><button disabled={busy || !!pending || needsReview} onClick={prepare}>Prepare lender-review summary</button></>}</div>
      <form className="loan-chat-composer" onSubmit={send}><label className="app-visually-hidden" htmlFor="loan-chat-input">Message your loan adviser</label><textarea id="loan-chat-input" value={input} maxLength={8000} disabled={GUIDED_ONLY || busy || !!pending} onChange={e => setInput(e.target.value)} placeholder={GUIDED_ONLY ? 'Choose the sample story above to begin.' : 'Tell me what you need, or ask about repayment…'} rows="2" onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}/><button disabled={!input.trim() || busy || !!pending} type="submit" aria-label="Send message">↑</button></form><p className="loan-chat-caption">Enter to send · Shift + Enter for a new line · Loan approval stays with the lender.</p>
    </section>
    <aside className="loan-chat-context"><span className="workspace-eyebrow">YOUR WORKING PLAN</span><h2>{context.financial_context?.source === 'demo' ? 'Sample scenario preview' : needsReview ? 'Your plan needs review.' : 'Your reviewed inputs.'}</h2><p>{needsReview ? 'Confirm available cash, missing obligations, and the sample terms before relying on this comparison.' : 'A forecast based on reviewed facts. Loan offers remain synthetic.'}</p><div className="loan-chat-gap"><span>Cash short by repair date</span><strong>{context.financial_context?.balance_confirmed && result ? money(result.gap_minor) : 'Confirm cash'}</strong><small>{result?.repair_date}</small></div><dl><div><dt>Cash on hand</dt><dd>{money(context.cash_minor ?? 600000)}</dd></div><div><dt>Repair bill</dt><dd>{money(result?.repair_minor ?? 2400000)}</dd></div><div><dt>Client income expected</dt><dd>{result?.client_date}</dd></div>{!GUIDED_ONLY && <div><dt>PayPal deposit</dt><dd>{result?.deposit_verified ? 'Verified · availability modeled' : 'Not confirmed'}</dd></div>}</dl><div className="loan-chat-status"><span>Loan application status</span><strong>Not submitted</strong><p>This conversation helps prepare a decision. It cannot approve or sanction a loan.</p></div>{result && !needsReview && <div className="loan-chat-mini-offers">{result.offers.map(o => <div key={o.name}><span>SAMPLE OFFER</span><strong>{o.name}</strong><p>{money(o.total_repayment_minor)} total repayment</p><small className={o.lowest_balance_minor < 0 ? 'negative' : ''}>Lowest balance {money(o.lowest_balance_minor)}</small></div>)}</div>}<button className="loan-chat-details" onClick={onOpenPlan}>{GUIDED_ONLY ? 'Open full timeline →' : 'Open full timeline & PayPal →'}</button></aside>
    </div></div></main>;
}
