import { useEffect, useState } from 'react';
import { toMinor } from '../services/financialContext';
import './FinancialContextReview.css';

export default function FinancialContextReview({ context, result, notice, onContext, onReload }) {
  const meta = context.financial_context;
  const [cash, setCash] = useState(String((context.cash_minor ?? 0) / 100));
  const [error, setError] = useState('');
  const [entry, setEntry] = useState({ kind: 'bill', label: '', amount: '', date: '' });
  useEffect(() => setCash(String((context.cash_minor ?? 0) / 100)), [context.cash_minor]);
  if (!meta) return null;
  const setReview = (key, value) => onContext({ ...context, financial_context: { ...meta, [key]: value } });
  const demo = meta.source === 'demo';
  const money = n => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(n / 100);
  const confirmCash = e => {
    e.preventDefault(); setError('');
    try {
      const value = toMinor(cash);
      onContext({ ...context, cash_minor: value, financial_context: { ...meta, source: meta.source === 'dashboard' && value === context.cash_minor ? 'dashboard' : 'manual', balance_confirmed: true } });
    } catch (e) { setError(e.message); }
  };
  const add = e => {
    e.preventDefault(); setError('');
    try {
      const amount = toMinor(entry.amount);
      if (!amount || !entry.label.trim() || !entry.date || entry.date <= meta.as_of || entry.date > '2026-12-17') throw new Error('Add a name, positive INR amount, and a date after the balance snapshot, through 17 Dec 2026.');
      const prefix = entry.kind === 'debt' ? 'Existing debt · ' : '';
      const event = { date: entry.date, label: (prefix + entry.label.trim()).slice(0, 120), amount_minor: amount * (entry.kind === 'income' ? 1 : -1), kind: entry.kind === 'income' ? 'gig_income' : 'expense' };
      const events = [...(context.planned_events || []), event].sort((a, b) => a.date.localeCompare(b.date));
      if (events.length > 40) throw new Error('This focused plan supports up to 40 planned events.');
      onContext({ ...context, planned_events: events });
      setEntry({ ...entry, label: '', amount: '', date: '' });
    } catch (e) { setError(e.message); }
  };
  return <section className="context-review" aria-label="Review financial context"><div className="context-review-title"><strong>{demo ? 'Labeled sample story' : 'Your dashboard context'}</strong><button type="button" onClick={onReload}>{demo ? 'Use my dashboard instead' : 'Refresh dashboard'}</button></div>
    <p>{demo ? '₹6,000 and all living costs/income are synthetic demo inputs. They are separate from your dashboard.' : notice}</p>
    <div className="context-provenance"><span>Source: {meta.source === 'dashboard' ? 'Dashboard transaction net' : meta.source === 'manual' ? 'Cash you entered' : meta.source === 'demo' ? 'Synthetic fixture' : 'Balance unavailable'}</span><span>As of: {meta.as_of}</span>{meta.latest_transaction_date && <span>Latest transaction: {meta.latest_transaction_date} · {meta.transaction_count} entries</span>}</div>
    {!demo && <><form className="context-cash-form" onSubmit={confirmCash}><label>Cash actually available (INR)<input inputMode="decimal" value={cash} onChange={e => setCash(e.target.value)} aria-label="Available cash in INR" /></label><button type="submit">{meta.balance_confirmed ? 'Update cash' : 'Confirm available cash'}</button></form>
      {result?.history_age_days > 30 && <p className="context-stale">History is {result.history_age_days} days old. Confirm today’s cash and add missing transactions on Dashboard.</p>}
      <details open={!meta.bills_reviewed || !meta.debts_reviewed || !meta.income_reviewed}><summary>Missing bills, debts, and expected income</summary><p>Past transactions are already included in the imported net. Add only future events here. The sample living costs and local gig income are removed in dashboard mode.</p><p>Client project: ${((context.project_usd_minor ?? 40000) / 100).toFixed(2)} USD; forecast receipt: {result?.client_date || 'review date'}. This project income is already modeled—do not add it again below. Future income is a promise, not available cash.</p>
        <form className="context-event-form" onSubmit={add}><label>Type<select value={entry.kind} onChange={e => setEntry({ ...entry, kind: e.target.value })}><option value="bill">Bill / living cost</option><option value="debt">Existing debt installment</option><option value="income">Other expected income</option></select></label><label>Description<input value={entry.label} maxLength={90} onChange={e => setEntry({ ...entry, label: e.target.value })} placeholder="e.g. rent, existing EMI" /></label><label>INR amount<input inputMode="decimal" value={entry.amount} onChange={e => setEntry({ ...entry, amount: e.target.value })} /></label><label>Date<input type="date" min={meta.as_of} max="2026-12-17" value={entry.date} onChange={e => setEntry({ ...entry, date: e.target.value })} /></label><button type="submit">Add to plan</button></form>
        {(context.planned_events || []).map((event, n) => <div className="context-event" key={n}><span>{event.date} · {event.label}</span><strong>{money(event.amount_minor)}</strong><button type="button" aria-label={`Remove ${event.label}`} onClick={() => onContext({ ...context, planned_events: context.planned_events.filter((_, i) => i !== n) })}>×</button></div>)}
      </details><div className="context-checks">{[['bills_reviewed', 'I included all upcoming bills and living costs, or have none to add.'], ['debts_reviewed', 'I included existing debt repayments, or have none.'], ['income_reviewed', 'I reviewed expected income and the client payment date; none is guaranteed cash.'], ['sample_terms_confirmed', 'I want to compare the shown repair/project and two sample loan offers.']].map(([key, label]) => <label key={key}><input type="checkbox" checked={meta[key]} onChange={e => setReview(key, e.target.checked)} /><span>{label}</span></label>)}</div></>}
    {error && <p className="context-stale" role="alert">{error}</p>}
    <div className={'context-completeness ' + (result && !result.context_gaps?.length ? 'complete' : '')}>{!result ? 'Checking your current inputs…' : result.context_gaps?.length ? 'Complete the review before a borrowing recommendation. ' + result.context_gaps[0] : demo ? 'Sample inputs ready for the demo comparison.' : 'Inputs reviewed. Forecast still depends on expected income.'}</div>
  </section>;
}
