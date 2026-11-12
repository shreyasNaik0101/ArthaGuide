import test from 'node:test';
import assert from 'node:assert/strict';
import { dashboardContext, demoContext, toMinor, readPlannedEvents } from '../src/services/financialContext.js';
const store = rows => ({ getItem: () => rows === null ? null : JSON.stringify(rows) });
const tx = (amount, type, date) => ({ amount, type, date, merchant: 'Test' });

test('imports only dated history through as-of date in integer paise', () => {
  const { context } = dashboardContext(store([tx(10000, 'credit', '2026-11-10'), tx(4000, 'debit', '2026-11-11'), tx(9000, 'credit', '2026-11-20')]), '2026-11-12');
  assert.equal(context.cash_minor, 600000);
  assert.equal(context.financial_context.transaction_count, 2);
  assert.equal(context.financial_context.latest_transaction_date, '2026-11-11');
  assert.equal(context.financial_context.balance_confirmed, false);
  assert.deepEqual(context.planned_events, []);
});
test('no history never silently becomes demo cash', () => {
  const { context } = dashboardContext(store(null), '2026-11-12');
  assert.equal(context.cash_minor, 0);
  assert.equal(context.financial_context.source, 'unavailable');
});
test('snapshot ID changes when a past transaction is edited', () => {
  const a = dashboardContext(store([tx(100, 'credit', '2026-11-10')]), '2026-11-12');
  const b = dashboardContext(store([tx(101, 'credit', '2026-11-10')]), '2026-11-12');
  assert.notEqual(a.context.financial_context.snapshot_id, b.context.financial_context.snapshot_id);
});
test('invalid amount, currency, date, type and negative net fail closed', () => {
  const variants = [tx(1.001, 'credit', '2026-11-10'), tx(null, 'credit', '2026-11-10'), tx(1, 'credit', '2026-02-30'), tx(1, 'other', '2026-11-10'), tx(1, 'debit', '2026-11-10'), { ...tx(1, 'credit', '2026-11-10'), currency: 'USD' }];
  for (const row of variants) assert.equal(dashboardContext(store([row]), '2026-11-12').context.financial_context.source, 'unavailable');
});
test('empty dashboard is explicitly unconfirmed zero history', () => {
  const { context } = dashboardContext(store([]), '2026-11-12');
  assert.equal(context.cash_minor, 0);
  assert.equal(context.financial_context.latest_transaction_date, null);
  assert.equal(context.financial_context.balance_confirmed, false);
});
test('seeded demo cash is used only by explicit demo selection', () => {
  assert.equal(demoContext().cash_minor, 600000);
  assert.equal(demoContext().financial_context.source, 'demo');
  assert.equal(demoContext().financial_context.bills_reviewed, true);
});
test('decimal conversion does not accept coercion or sub-paise values', () => {
  assert.equal(toMinor('10.01'), 1001);
  assert.equal(toMinor(0.1), 10);
  for (const value of [true, null, '', '-1', '1.001', Infinity, NaN]) assert.throws(() => toMinor(value));
});
test('saved future events survive navigation but past events are not imported again', () => {
  const events = [{ date: '2026-11-10', label: 'Past rent', amount_minor: -10000, kind: 'expense' }, { date: '2026-11-20', label: 'Next EMI', amount_minor: -20000, kind: 'expense' }];
  assert.deepEqual(readPlannedEvents(store(events), '2026-11-12'), [events[1]]);
});
test('malformed saved events cannot become future cash flows', () => {
  assert.throws(() => readPlannedEvents(store([{ date: '2026-11-20', label: 'Invalid', amount_minor: 2.5, kind: 'gig_income' }]), '2026-11-12'));
});
