import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import GeneralAdvisor from './GeneralAdvisor';
import CashRunway from './CashRunway';
import LoanConversation from './LoanConversation';
import { dashboardContext, CONTEXT_EVENT, PLANNED_EVENTS_KEY, readPlannedEvents } from '../services/financialContext';
import './FreelancerAdvisor.css';

const BASE = import.meta.env.VITE_FREELANCER_API_URL || '/api/freelancer';
async function api(path, body) {
  const response = await fetch(BASE + path, body === undefined ? {} : { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const data = await response.json();
  if (!response.ok) throw new Error(typeof data.detail === 'string' ? data.detail : 'Please check the entered amounts and dates.');
  return data;
}
const money = n => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: n % 100 ? 2 : 0 }).format(n / 100);
const day = d => new Date(d + 'T12:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
const words = {
  en: { title: 'Keep your work moving.', gap: 'Cash short by repair date', late: 'Client pays one week late', compare: 'Find a repayment you can manage', intake: 'Turn messages into a plan', deposit: 'Borrow less with a client deposit' },
  hi: { title: 'आपका काम चलता रहे।', gap: 'मरम्मत की तारीख तक पैसों की कमी', late: 'क्लाइंट एक सप्ताह देर से भुगतान करे', compare: 'ऐसी किस्त चुनें जो आप चुका सकें', intake: 'संदेशों से बनाएं योजना', deposit: 'क्लाइंट की जमा राशि से कम उधार लें' },
  kn: { title: 'ನಿಮ್ಮ ಕೆಲಸ ಮುಂದುವರಿಯಲಿ.', gap: 'ದುರಸ್ತಿ ದಿನಕ್ಕೆ ಹಣದ ಕೊರತೆ', late: 'ಗ್ರಾಹಕರು ಒಂದು ವಾರ ತಡವಾಗಿ ಪಾವತಿಸುತ್ತಾರೆ', compare: 'ನೀವು ಪಾವತಿಸಬಹುದಾದ ಕಂತು ಆರಿಸಿ', intake: 'ಸಂದೇಶಗಳಿಂದ ಯೋಜನೆ ರೂಪಿಸಿ', deposit: 'ಗ್ರಾಹಕರ ಮುಂಗಡದಿಂದ ಕಡಿಮೆ ಸಾಲ ಪಡೆಯಿರಿ' },
};

function Fact({ label, fact, monetary = false }) {
  const missing = monetary ? fact?.value_minor == null || !fact?.currency : !fact?.value;
  return <div className={'fa-fact' + (missing ? ' fa-missing' : '')}><span>{label}</span><strong>{missing ? 'Missing · review needed' : monetary ? `${fact.currency} ${(fact.value_minor / 100).toLocaleString('en-IN')}` : fact.value}</strong>{fact?.source && <blockquote>“{fact.source}”</blockquote>}</div>;
}

export default function Advisor() {
  const [view, setView] = useState('chat');
  const [initial] = useState(() => {
    const snapshot = dashboardContext(localStorage);
    try { snapshot.context.planned_events = readPlannedEvents(localStorage, snapshot.context.financial_context.as_of); }
    catch (e) { snapshot.notice += ' ' + e.message; }
    return snapshot;
  });
  const [context, setContext] = useState(initial.context);
  const [notice, setNotice] = useState(initial.notice);
  useEffect(() => {
    if (context.financial_context?.source !== 'demo' && Array.isArray(context.planned_events)) {
      try { localStorage.setItem(PLANNED_EVENTS_KEY, JSON.stringify(context.planned_events)); }
      catch { setNotice('Could not save the future cash plan in this browser. Keep this adviser open while reviewing it.'); }
    }
  }, [context.planned_events, context.financial_context?.source]);
  const reload = () => {
    const next = dashboardContext(localStorage);
    setNotice(next.notice);
    let events = context.planned_events || [];
    if (context.financial_context?.source === 'demo') {
      try { events = readPlannedEvents(localStorage, next.context.financial_context.as_of); }
      catch (e) { setNotice(next.notice + ' ' + e.message); events = []; }
    }
    setContext(previous => ({ ...previous, ...next.context, planned_events: events.filter(e => e.date > next.context.financial_context.as_of) }));
  };
  useEffect(() => {
    const sync = event => {
      if (event?.type === 'storage' && event.key !== 'arthaguide_transactions' && event.key !== null) return;
      const next = dashboardContext(localStorage);
      setContext(previous => {
        const old = previous.financial_context;
        if (old?.source === 'demo' || (old?.snapshot_id === next.context.financial_context.snapshot_id && old?.as_of === next.context.financial_context.as_of)) return previous;
        setNotice('Dashboard history changed. ' + next.notice + ' Please confirm the refreshed cash and review again.');
        return { ...previous, ...next.context, planned_events: (previous.planned_events || []).filter(e => e.date > next.context.financial_context.as_of) };
      });
    };
    window.addEventListener('storage', sync); window.addEventListener(CONTEXT_EVENT, sync); window.addEventListener('focus', sync);
    return () => { window.removeEventListener('storage', sync); window.removeEventListener(CONTEXT_EVENT, sync); window.removeEventListener('focus', sync); };
  }, []);
  return <><div hidden={view !== 'chat'}><LoanConversation context={context} notice={notice} onReload={reload} onContext={setContext} onOpenPlan={() => setView('plan')} /></div>{view === 'plan' && <RepaymentPlan key={context.financial_context?.snapshot_id} context={context} onReturn={next => { setContext(next); setView('chat'); }} />}</>;
}

function RepaymentPlan({ context, onReturn }) {
  const { i18n } = useTranslation();
  const w = words[i18n.language] || words.en;
  const [tab, setTab] = useState('plan');
  const [boot, setBoot] = useState(null);
  const [result, setResult] = useState(null);
  const [late, setLate] = useState(context.late || false);
  const [cash, setCash] = useState(context.cash_minor ?? 600000);
  const [cashSource, setCashSource] = useState(context.financial_context?.source === 'demo' ? 'Synthetic freelancer balance' : 'Imported or user-confirmed cash · ' + (context.financial_context?.as_of || 'review needed'));
  const [available, setAvailable] = useState(context.availability_date || '2026-11-16');
  const [client, setClient] = useState('');
  const [loans, setLoans] = useState('');
  const [extraction, setExtraction] = useState(null);
  const [review, setReview] = useState(context.review_id || null);
  const [invoice, setInvoice] = useState(null);
  const [approved, setApproved] = useState(false);
  const [selected, setSelected] = useState(0);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [explanation, setExplanation] = useState('');
  const [calculating, setCalculating] = useState(false);
  const [revision, setRevision] = useState(0);
  const sequence = useRef(0);
  useEffect(() => { api('/bootstrap').then(data => { setBoot(data); setClient(data.client_messages); setLoans(data.loan_offers); setInvoice(data.paypal); }).catch(e => setError('Start the backend on port 8000. ' + e.message)); }, []);
  useEffect(() => {
    if (!boot) return;
    const seq = ++sequence.current;
    setCalculating(true); setExplanation('');
    api('/calculate', { ...context, late, availability_date: available, cash_minor: cash, review_id: review }).then(data => { if (seq === sequence.current) { setResult(data); setCalculating(false); } }).catch(e => { if (seq === sequence.current) { setError(e.message); setResult(null); setCalculating(false); } });
  }, [boot, late, cash, available, review, revision]);
  const run = async (name, action) => { setBusy(name); setError(''); try { await action(); } catch (e) { setError(e.message); } finally { setBusy(''); } };
  const editSource = (setter, value) => { setter(value); setExtraction(null); setReview(null); setExplanation(''); };
  const useDashboard = () => { const next = dashboardContext(localStorage); onReturn({ ...context, ...next.context }); };
  if (tab === 'general') return <><div className="fa-return"><button onClick={() => setTab('plan')}>← Back to repair & repayment plan</button></div><GeneralAdvisor /></>;
  const offer = result?.offers[selected];
  const trouble = result?.offers.find(o => o.repayment_shortfall);
  const projectMatchesDeposit = !context.project_usd_minor || context.project_usd_minor === 40000;
  const configured = boot && projectMatchesDeposit && Object.values(boot.paypal_config).every(Boolean);
  const blocked = Boolean(busy) || calculating;
  return <main className={'fa-page' + (import.meta.env.VITE_GUIDED_ONLY === 'true' ? ' guided-only' : '')}><div className="fa-shell">
    <button className="loan-back-chat" onClick={() => onReturn({ ...context, cash_minor: cash, late, availability_date: available, review_id: review })}>← Back to our conversation</button>
    <>{result?.context_gaps?.length > 0 && <div className="fa-minimum"><strong>Financial context needs review</strong><p>{result.context_gaps[0]}</p><button onClick={() => onReturn({ ...context, cash_minor: cash, late, availability_date: available, review_id: review })}>Return to chat and complete the review →</button></div>}</>
    <header className="fa-header"><div><div className="fa-eyebrow"><span className="fa-logo">a</span> ARTHA GUIDE <span>/</span> LOAN ADVISER</div><h1>{w.title}</h1><p>A laptop repair today. A client payment later. Let’s make the numbers work.</p></div><span className="fa-demo"><span /> {import.meta.env.VITE_GUIDED_ONLY === 'true' ? 'GUIDED SAMPLE' : 'PAYPAL SANDBOX DEMO'}</span></header>
    <nav className="fa-tabs" aria-label="Adviser workflow"><button className="active">Repair & repayment</button><button onClick={() => setTab('general')}>General loan advice ↗</button><span>Sample freelancer · India · INR</span></nav>
    {error && <div className="fa-error" role="alert"><strong>Something needs attention</strong><p>{error}</p><button onClick={() => setError('')} aria-label="Dismiss error">×</button></div>}
    {!boot && <div className="fa-panel fa-loading">{error ? 'Waiting for the local backend…' : 'Getting your plan ready…'}</div>}
    {boot && <>
      <div className="fa-section-title"><div><span className="fa-step">01</span><h2>{w.compare}</h2></div><label className="fa-toggle"><input type="checkbox" checked={late} disabled={blocked} onChange={e => setLate(e.target.checked)} /><span className="fa-switch" /><span>{w.late}<small>{late ? 'Stress test · latest promise + 7 days' : 'Use the latest client promise'}</small></span></label></div>
      <div className={'fa-summary-grid' + (calculating ? ' fa-updating' : '')} aria-busy={calculating}>
        <section className="fa-gap-card"><div className="fa-card-kicker">{w.gap}</div><div className="fa-gap-value">{result ? money(result.gap_minor) : '…'}</div><p>needed by <strong>{result ? day(result.repair_date) : '16 Nov 2026'}</strong></p><div className="fa-gap-divider" /><dl><div><dt>Laptop repair</dt><dd>{money(result?.repair_minor ?? 2400000)}</dd></div><div><dt>Cash on hand</dt><dd>{money(cash)}</dd></div><div><dt>Deposit available by repair</dt><dd>{result && invoice?.verified && available <= result.repair_date ? money(result.deposit_net_minor) : '₹0'}</dd></div></dl><span className="fa-gap-note">Promises and pending payments don’t close this gap.</span></section>
        {result?.offers.map((o, n) => <section key={o.name} className={'fa-loan-card ' + (o.name === result.recommended ? 'fa-recommended' : '')}><div className="fa-loan-top"><span className="fa-card-kicker">SAMPLE OFFER {n === 0 ? 'A' : 'B'}</span><span className={'fa-badge ' + (o.lowest_balance_minor < 0 ? 'danger' : 'safe')}>{o.lowest_balance_minor < 0 ? 'Cash shortfall' : o.name === result.recommended ? 'Lower-cost fit' : 'Stays above zero'}</span></div><h3>{o.name}</h3><p className="fa-loan-principal">{money(o.principal_minor)} <span>borrowed</span></p><dl className="fa-loan-stats"><div><dt>Total repayment</dt><dd>{money(o.total_repayment_minor)}</dd></div><div><dt>All-in fee</dt><dd>{money(o.fee_minor)}</dd></div><div><dt>Lowest balance</dt><dd className={o.lowest_balance_minor < 0 ? 'fa-red' : 'fa-green'}>{money(o.lowest_balance_minor)}</dd></div></dl><div className="fa-installments">{o.timeline.filter(e => e.kind === 'installment').map(e => <div key={e.date}><span>{day(e.date)}</span><strong>{money(-e.amount_minor)}</strong></div>)}</div><button className={'fa-outline ' + (selected === n ? 'chosen' : '')} onClick={() => setSelected(n)}>{selected === n ? 'Viewing cash timeline ↓' : 'View cash timeline ↓'}</button></section>)}
      </div>
      {result && !result.context_gaps?.length && <><div className={'fa-verdict ' + (trouble ? 'warning' : 'calm')} role="status"><span className="fa-verdict-icon">{trouble ? '!' : '✓'}</span><div><strong>{trouble ? `${trouble.name}: ${money(trouble.repayment_shortfall.shortfall_minor)} short on ${day(trouble.repayment_shortfall.date)}` : result.recommended ? `${result.recommended} fits this cash timeline` : 'Neither offer covers this plan'}</strong><p>{trouble ? `${money(-trouble.repayment_shortfall.amount_minor)} installment ${trouble.repayment_shortfall.caused_shortfall ? 'creates' : 'deepens'} a negative balance. ${result.recommended ? result.recommended + ' stays above zero through ' + day(result.horizon) + '.' : 'Review the plan before borrowing.'}` : 'The comparison includes the repair, living costs, gig income, and every installment. Future income remains an assumption.'}</p></div></div>{result.gap_minor < Math.min(...result.offers.map(o => o.minimum_minor)) && <div className="fa-minimum" role="status"><strong>You need {money(result.gap_minor)}. Neither sample offer supports that amount.</strong><p>Both have a {money(Math.min(...result.offers.map(o => o.minimum_minor)))} minimum. The cards still model the full offered principal; this is not a smaller loan quote.</p></div>}</>}
      <CashRunway result={result} />
      <div className="fa-work-grid">
        <section className="fa-panel fa-timeline"><div className="fa-panel-heading"><div><span className="fa-eyebrow">EVERY RUPEE, IN DATE ORDER</span><h2>Your cash timeline</h2></div><span className="fa-muted">{offer?.name}</span></div><div className="fa-context"><span>{cashSource} · {money(cash)}</span><button disabled={blocked} onClick={useDashboard}>Use dashboard balance</button>{cash !== 600000 && context.financial_context?.source === 'demo' && <button disabled={blocked} onClick={() => { setCash(600000); setCashSource('Synthetic freelancer balance'); }}>Restore ₹6,000 sample</button>}</div>
          {offer && <><div className="fa-table-wrap"><table><caption className="fa-sr">Cash timeline for {offer.name}, all amounts in INR</caption><thead><tr><th>Date & event</th><th>In / out</th><th>Balance</th></tr></thead><tbody>{offer.timeline.map((e, i) => <tr key={i} className={e.balance_minor < 0 ? 'negative' : e.kind === 'client' ? 'expected' : ''}><td><span className="fa-date">{day(e.date)}</span><strong>{e.label}</strong><small>{e.certainty}</small></td><td className={e.amount_minor > 0 ? 'fa-green' : ''}>{e.amount_minor > 0 ? '+' : '−'}{money(Math.abs(e.amount_minor))}</td><td className={e.balance_minor < 0 ? 'fa-red' : ''}>{money(e.balance_minor)}</td></tr>)}</tbody></table></div><p className="fa-footnote">Forecast through {day(result.horizon)}. Same-day bills and installments run before expected income. The full {money(offer.principal_minor)} loan is modeled on the repair date.</p></>}
        </section>
        <aside className="fa-panel fa-paypal"><span className="fa-paypal-wordmark">Pay<span>Pal</span> <small>SANDBOX</small></span><span className="fa-step">02</span><h2>{w.deposit}</h2><p>Ask your overseas client for a 40% deposit on the $400 video project.</p><div className="fa-invoice-preview"><div><span>Project deposit</span><strong>$160.00 <small>USD</small></strong></div><dl><div><dt>Test recipient</dt><dd>{boot.recipient || 'Not configured'}</dd></div><div><dt>Project remaining after payment</dt><dd>$240.00 USD</dd></div></dl></div>
          {!projectMatchesDeposit && <p className="fa-setup">The deposit invoice is scoped to the $400 demo project. Restore that project to issue it.</p>}
          {!Object.values(boot.paypal_config).every(Boolean) && <p className="fa-setup">Sandbox setup needed: {Object.entries(boot.paypal_config).filter(([, v]) => !v).map(([k]) => k).join(', ')} in backend/.env. Restart the backend after saving.</p>}
          {!invoice?.invoice_id && <><label className="fa-approval"><input type="checkbox" checked={approved} onChange={e => setApproved(e.target.checked)} disabled={!configured || !!busy} /><span>I approve <strong>$160.00 USD</strong> to the test recipient shown above. Issue a hosted sandbox invoice.</span></label><button className="fa-primary" disabled={!approved || !configured || !!busy} onClick={() => run('issue', async () => { setInvoice(await api('/invoice/issue', { amount_minor: 16000, currency: 'USD', recipient: boot.recipient, approved })); setRevision(r => r + 1); })}>{busy === 'issue' ? 'Issuing sandbox invoice…' : 'Approve & issue deposit invoice ↗'}</button></>}
          {invoice?.invoice_id && <div className="fa-payment-actions"><small>Invoice {invoice.invoice_id}</small>{invoice.payer_url ? <a className="fa-primary" target="_blank" rel="noreferrer" href={invoice.payer_url}>Open hosted payer link ↗</a> : <button className="fa-outline" disabled={!!busy} onClick={() => run('issue', async () => { setInvoice(await api('/invoice/issue', { amount_minor: 16000, currency: 'USD', recipient: boot.recipient, approved: true })); setRevision(r => r + 1); })}>Retry issue / retrieve payer link</button>}<button className="fa-outline" disabled={!!busy} onClick={() => run('check', async () => { try { setInvoice(await api('/invoice/check')); } finally { const data = await api('/bootstrap'); setInvoice(data.paypal); setRevision(r => r + 1); } })}>{busy === 'check' ? 'Checking with PayPal…' : '↻ Check payment'}</button></div>}
          <div className="fa-payment-status" aria-live="polite"><span>PayPal payment status</span><strong className={invoice?.verified ? 'fa-green' : ''}>{invoice?.status?.replaceAll('_', ' ') || 'NOT CREATED'}</strong><small>{invoice?.verified ? 'Matching $160 USD PayPal transaction verified.' : 'No confirmed deposit included in your cash.'}</small>{invoice?.checked_at && <small>Last fetched: {new Date(invoice.checked_at).toLocaleTimeString()}</small>}</div>
          <div className="fa-assumptions"><strong>Demo estimate · separate from PayPal status</strong><p>($160 − $10 modeled fee) × ₹80/USD = <b>₹12,000</b>. These are demo assumptions, not PayPal’s quoted fees or exchange rate.</p><label>Estimated date available to spend<input type="date" min="2026-11-15" value={available} disabled={blocked} onChange={e => { if (e.target.value) setAvailable(e.target.value); }} /></label><p>{invoice?.verified ? available <= '2026-11-16' ? 'Modeled as spendable by repair: included in the gap.' : 'After the repair: the repair-date gap stays unchanged.' : 'A promise or pending payment leaves the gap unchanged.'}</p></div>
        </aside>
      </div>
      <section className="fa-panel fa-intake"><div className="fa-panel-heading"><div><span className="fa-eyebrow">LIVE AI · YOU REVIEW THE EVIDENCE</span><h2><span className="fa-step">03</span>{w.intake}</h2><p>Paste the client conversation and both loan offers. Review the extracted facts before applying them.</p></div><span className={'fa-badge ' + (review ? 'safe' : '')}>{review ? 'Reviewed AI terms in use' : 'Labeled sample terms in use'}</span></div><div className="fa-input-grid"><label>Client messages<textarea rows="8" value={client} disabled={!!busy} onChange={e => editSource(setClient, e.target.value)} /></label><label>Two loan offers<textarea rows="8" value={loans} disabled={!!busy} onChange={e => editSource(setLoans, e.target.value)} /></label></div><div className="fa-intake-actions"><button className="fa-primary" disabled={!!busy || !client.trim() || !loans.trim()} onClick={() => run('extract', async () => { setExtraction(await api('/extract', { client_messages: client, loan_offers: loans })); setReview(null); })}>{busy === 'extract' ? 'Reading dates & loan terms…' : 'Extract terms with live AI →'}</button><span>{boot.ai_configured ? `Server-side ${boot.ai_model} · synthetic inputs` : 'Live AI needs OPENAI_API_KEY in backend/.env. Calculator works now.'}</span></div>
        {!review && !extraction && <div className="fa-revision-note"><strong>Sample payment date revised · 21 Nov → 24 Nov</strong><blockquote>“{boot.client_messages.split('\n')[1]}”</blockquote><small>Prefilled sample source. The late switch moves the latest promise from 24 Nov to 1 Dec.</small></div>}
        {extraction && <div className="fa-review"><h3>Review what the AI found</h3><p className="fa-muted">Live {extraction.provider} · {extraction.model}. Quotes below are checked against your pasted inputs.</p>{[...extraction.extraction.warnings, ...extraction.errors].map((message, n) => <p className="fa-review-warning" key={n}>{message}</p>)}<div className="fa-facts-grid"><Fact label="Full project value" monetary fact={extraction.extraction.project} /><Fact label="Original payment date" fact={extraction.extraction.original_payment_date} /><Fact label="Revised payment date" fact={extraction.extraction.revised_payment_date} /></div><Fact label="Message that supersedes the earlier date" fact={extraction.extraction.superseding_message} />{extraction.extraction.offers.map((o, n) => <details key={n} open><summary>Sample offer {n + 1} · {o.name.value || 'Missing name'}</summary><div className="fa-facts-grid"><Fact label="Principal" monetary fact={o.principal} /><Fact label="All-in fee" monetary fact={o.fee} /><Fact label="Minimum loan" monetary fact={o.minimum} /><Fact label="Disbursal date" fact={o.disbursal_date} /><Fact label="Fee timing" fact={o.fee_timing} /></div>{o.installments.map((inst, i) => <div className="fa-facts-grid" key={i}><Fact label={`Installment ${i + 1} date`} fact={inst.date} /><Fact label={`Installment ${i + 1} amount`} monetary fact={inst.amount} /></div>)}</details>)}<button className="fa-primary" disabled={!!busy || extraction.errors.length > 0 || review === extraction.review_id} onClick={() => setReview(extraction.review_id)}>{review ? '✓ Reviewed terms applied' : 'I reviewed the sources · apply these terms'}</button>{extraction.errors.length > 0 && <p className="fa-red">Resolve missing or conflicting terms in the pasted text, then extract again.</p>}</div>}
      </section>
      <section className="fa-panel fa-explanation"><div><span className="fa-eyebrow">ADVICE GROUNDED IN YOUR CALCULATOR</span><h2>What does this mean for me?</h2><p>{explanation || 'Ask the AI to explain the current dates, installment shortfall, and minimum loan amounts. It receives the same calculator results shown above.'}</p></div><button className="fa-outline" disabled={blocked || !result} onClick={() => run('explain', async () => { const data = await api('/explain', { ...context, late, availability_date: available, cash_minor: cash, review_id: review, language: ['hi', 'kn'].includes(i18n.language) ? i18n.language : 'en' }); setExplanation(data.explanation); })}>{busy === 'explain' ? 'Explaining your plan…' : 'Explain this comparison →'}</button></section>
      <p className="fa-bottom-note">Synthetic loan offers for comparison. No loan application or automatic repayment. {result?.assumptions}</p>
    </>}
  </div></main>;
}
