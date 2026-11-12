export const TRANSACTIONS_KEY = 'arthaguide_transactions';
export const CONTEXT_EVENT = 'arthaguide:transactions-changed';
export const PLANNED_EVENTS_KEY = 'arthaguide_planned_events';
export const todayISO = () => {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
};
export function toMinor(value) {
  if (!['number', 'string'].includes(typeof value) || !/^\d+(\.\d{1,2})?$/.test(String(value))) throw new Error('Amounts must be non-negative INR values with at most two decimals.');
  const [whole, fraction = ''] = String(value).split('.');
  const minor = Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
  if (!Number.isSafeInteger(minor) || minor > 100000000) throw new Error('Amount is outside this demo’s supported range.');
  return minor;
}
export function validDate(value) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value)) && new Date(value + 'T12:00:00Z').toISOString().slice(0, 10) === value;
}
export function dashboardContext(storage, asOf = todayISO()) {
  const base = { late: false, availability_date: '2026-11-16', planned_events: [], cash_minor: 0,
    financial_context: { source: 'unavailable', as_of: asOf, latest_transaction_date: null, transaction_count: 0, snapshot_id: '', balance_confirmed: false, bills_reviewed: false, debts_reviewed: false, income_reviewed: false, sample_terms_confirmed: false } };
  try {
    const raw = storage.getItem(TRANSACTIONS_KEY);
    if (!raw) return { context: base, notice: 'No saved transactions yet. Enter the cash you can actually spend, or open Dashboard to review its sample entries.' };
    const rows = JSON.parse(raw);
    if (!Array.isArray(rows)) throw new Error('Dashboard history is not a transaction list.');
    let net = 0, latest = null, count = 0;
    for (const tx of rows) {
      if (!validDate(tx.date)) throw new Error('A dashboard transaction has an invalid date.');
      if (tx.currency && tx.currency !== 'INR') throw new Error('Dashboard history contains a non-INR transaction.');
      if (!['credit', 'debit'].includes(tx.type)) throw new Error('A dashboard transaction has an invalid type.');
      const amount = toMinor(tx.amount);
      if (tx.date > asOf) continue;
      net += amount * (tx.type === 'credit' ? 1 : -1);
      latest = !latest || tx.date > latest ? tx.date : latest;
      count++;
    }
    if (net < 0 || !Number.isSafeInteger(net) || net > 100000000) throw new Error('Transaction net is negative or outside the supported range. Confirm available cash manually.');
    let hash = 2166136261;
    for (const character of raw) hash = Math.imul(hash ^ character.charCodeAt(0), 16777619);
    base.cash_minor = net;
    base.financial_context = { ...base.financial_context, source: 'dashboard', latest_transaction_date: latest, transaction_count: count, snapshot_id: (hash >>> 0).toString(16) + '-' + asOf };
    return { context: base, notice: 'Imported dashboard transaction net, assuming a zero starting balance. This may include the dashboard’s sample entries. Confirm your actual spendable cash before relying on it.' };
  } catch (error) { return { context: base, notice: 'Could not use dashboard history: ' + error.message }; }
}
export function demoContext() {
  return { cash_minor: 600000, late: false, availability_date: '2026-11-16', financial_context: { source: 'demo', as_of: '2026-11-15', latest_transaction_date: null, transaction_count: 0, snapshot_id: 'laptop-demo', balance_confirmed: true, bills_reviewed: true, debts_reviewed: true, income_reviewed: true, sample_terms_confirmed: true } };
}

export function readPlannedEvents(storage, asOf) {
  const raw = storage.getItem(PLANNED_EVENTS_KEY);
  if (!raw) return [];
  const events = JSON.parse(raw);
  if (!Array.isArray(events) || events.length > 40) throw new Error('Saved planned events need review.');
  for (const e of events) {
    if (!validDate(e.date) || e.date > '2026-12-17' || !['expense', 'gig_income'].includes(e.kind) || !Number.isSafeInteger(e.amount_minor) || Math.abs(e.amount_minor) > 100000000 || !e.amount_minor || (e.kind === 'expense' ? e.amount_minor >= 0 : e.amount_minor <= 0) || typeof e.label !== 'string' || !e.label.trim() || e.label.length > 120) throw new Error('A saved planned event has invalid dates, amounts, or currency units.');
  }
  return events.filter(e => e.date > asOf).map(({ date, label, amount_minor, kind }) => ({ date, label, amount_minor, kind }));
}
