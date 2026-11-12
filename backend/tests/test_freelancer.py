"""Deterministic tests with mocked remote boundaries; no fake PAID route in the app."""
import copy
import os
import tempfile
import unittest
from datetime import date
from unittest.mock import patch

from fastapi.testclient import TestClient
from pydantic import ValidationError
from app.main import app
from app.services.freelancer_cash import fixture, calculate, Scenario, CLIENT_THREAD, LOAN_TEXT
from app.services.freelancer_ai import Extraction, ChatChanges, evidence_errors, scenario_from_extraction
from app.services import paypal_deposit as paypal


def invoice(status="UNPAID"):
    return {"id": "INV2-DEMO-TEST-ONLY-0001", "status": status,
        "detail": {"currency_code": "USD", "metadata": {"recipient_view_url": "https://www.sandbox.paypal.com/invoice/p/#TEST"}},
        "primary_recipients": [{"billing_info": {"email_address": "buyer@example.com"}}],
        "amount": {"currency_code": "USD", "value": "160.00"},
        "payments": {"paid_amount": {"currency_code": "USD", "value": "160.00" if status == "PAID" else "0.00"},
            "transactions": [{"type": "PAYPAL", "method": "PAYPAL", "payment_id": "TEST-TXN-1", "amount": {"currency_code": "USD", "value": "160.00"}}] if status == "PAID" else []}}


def extraction_fixture():
    """Explicitly human-authored extraction fixture for contract tests, never returned as live AI."""
    s = fixture()
    text = lambda value, source: {"value": value, "source": source}
    amount = lambda value, currency, source: {"value_minor": value, "currency": currency, "source": source}
    return Extraction.model_validate({"project": amount(40000, "USD", "$400 USD"),
        "original_payment_date": text("2026-11-21", "I will pay the full $400 USD on 2026-11-21."),
        "revised_payment_date": text("2026-11-24", "Please replace 2026-11-21 with 2026-11-24 as the payment date"),
        "superseding_message": text(CLIENT_THREAD.splitlines()[1], CLIENT_THREAD.splitlines()[1]),
        "offers": [{"name": text(o.name, line), "principal": amount(o.principal_minor, "INR", line),
            "fee": amount(o.fee_minor, "INR", line), "minimum": amount(o.minimum_minor, "INR", line),
            "disbursal_date": text("2026-11-16", line), "fee_timing": text("included_in_installments", line),
            "installments": [{"date": text(i.date.isoformat(), line), "amount": amount(i.amount_minor, "INR", line)} for i in o.installments]} for o, line in zip(s.offers, LOAN_TEXT.splitlines())],
        "warnings": ["The later client message supersedes 21 November."], "unresolved_terms": []})


class CashTests(unittest.TestCase):
    def test_expected_date_both_positive(self):
        r = calculate(fixture())
        self.assertEqual(r["gap_minor"], 1800000)
        self.assertEqual(r["recommended"], "Quick Bridge")
        self.assertEqual([o["lowest_balance_minor"] for o in r["offers"]], [200000, 200000])
        self.assertEqual([o["total_repayment_minor"] for o in r["offers"]], [2120000, 2240000])

    def test_delay_exact_installment_and_lowest(self):
        r = calculate(fixture(), late=True)
        a, b = r["offers"]
        self.assertEqual(r["client_date"], "2026-12-01")
        self.assertEqual(r["recommended"], "Steady Bridge")
        self.assertEqual(a["repayment_shortfall"]["date"], "2026-11-27")
        self.assertEqual(a["repayment_shortfall"]["shortfall_minor"], 360000)
        self.assertTrue(a["repayment_shortfall"]["caused_shortfall"])
        self.assertEqual(a["lowest_balance_minor"], -510000)
        self.assertEqual(b["lowest_balance_minor"], 200000)

    def test_confirmed_deposit_gap_and_no_double_count(self):
        r = calculate(fixture(), True, True, date(2026, 11, 16))
        self.assertEqual(r["gap_minor"], 600000)
        self.assertEqual(r["outstanding_project_usd_minor"], 24000)
        for o in r["offers"]:
            deposits = [e for e in o["timeline"] if e["kind"] == "deposit"]
            self.assertEqual(len(deposits), 1)
            self.assertEqual(deposits[0]["amount_minor"], 1200000)
            self.assertEqual(next(e for e in o["timeline"] if e["kind"] == "client")["amount_minor"], 1920000)
            self.assertFalse(o["supports_gap"])
        self.assertEqual(r, calculate(fixture(), True, True, date(2026, 11, 16)))

    def test_pending_or_later_availability_does_not_reduce_repair_gap(self):
        self.assertEqual(calculate(fixture(), deposit_verified=False)["gap_minor"], 1800000)
        r = calculate(fixture(), deposit_verified=True, availability_date=date(2026, 11, 17))
        self.assertEqual(r["gap_minor"], 1800000)
        self.assertEqual(r["outstanding_project_usd_minor"], 24000)

    def test_reject_float_bool_currency_and_inconsistent_terms(self):
        for value in (600000.0, True, -1, "600000"):
            data = fixture().model_dump(mode="json"); data["cash_minor"] = value
            with self.assertRaises(ValidationError): Scenario.model_validate(data)
        for field, value in (("currency", "USD"), ("fee_minor", 100), ("minimum_minor", 3000000)):
            data = fixture().model_dump(mode="json"); data["offers"][0][field] = value
            with self.assertRaises(ValidationError): Scenario.model_validate(data)

    def test_reject_invalid_dates(self):
        data = fixture().model_dump(mode="json"); data["repair_date"] = "2026-02-30"
        with self.assertRaises(ValidationError): Scenario.model_validate(data)

    def test_same_day_expected_income_runs_after_installment(self):
        s = fixture(); s.payment_date = date(2026, 11, 27)
        self.assertEqual(calculate(s)["offers"][0]["repayment_shortfall"]["shortfall_minor"], 360000)


class IsolatedTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.env = patch.dict(os.environ, {"DEMO_DB_PATH": self.temp.name + "/demo.sqlite3", "PAYPAL_BUYER_EMAIL": "buyer@example.com"})
        self.env.start()
        self.client = TestClient(app)

    def tearDown(self):
        self.env.stop(); self.temp.cleanup()


class PayPalTests(IsolatedTests):
    def test_unpaid_pending_partial_external_refunded_never_credited(self):
        for status in ("DRAFT", "UNPAID", "SENT", "PAYMENT_PENDING", "PARTIALLY_PAID", "MARKED_AS_PAID", "REFUNDED", "CANCELLED"):
            self.assertFalse(paypal.verify_invoice(invoice(status), invoice()["id"]))

    def test_paid_checks_amount_currency_id_recipient_and_type(self):
        good = invoice("PAID")
        self.assertTrue(paypal.verify_invoice(good, good["id"]))
        variants = []
        for path, value in ((["amount", "value"], "159.00"), (["amount", "currency_code"], "INR"), (["id"], "INV2-OTHER"), (["payments", "paid_amount", "value"], "150.00"), (["payments", "transactions", 0, "type"], "EXTERNAL"), (["payments", "transactions", 0, "payment_id"], ""), (["payments", "transactions", 0, "amount", "currency_code"], "INR"), (["primary_recipients", 0, "billing_info", "email_address"], "wrong@example.com")):
            v = copy.deepcopy(good); node = v
            for key in path[:-1]: node = node[key]
            node[path[-1]] = value; variants.append(v)
        refunded = copy.deepcopy(good); refunded["refunds"] = {"refund_amount": {"currency_code": "USD", "value": "1.00"}}; variants.append(refunded)
        duplicate = copy.deepcopy(good); duplicate["payments"]["transactions"] *= 2; variants.append(duplicate)
        for v in variants:
            with self.assertRaises(paypal.PaymentError): paypal.verify_invoice(v, good["id"])

    def test_invalid_decimal_values(self):
        for value in ("NaN", "Infinity", "1.001", "-1", "abc"):
            with self.assertRaises(paypal.PaymentError): paypal.minor({"currency_code": "USD", "value": value})

    def test_repeated_server_checks_recompute_not_append(self):
        p = invoice("PAID")
        with paypal.connect() as db: db.execute("UPDATE deposit SET invoice_id=? WHERE slot=1", (p["id"],))
        with patch.object(paypal, "token", return_value="test"), patch.object(paypal, "api", return_value=p) as remote:
            for _ in range(3):
                self.assertTrue(self.client.post('/api/freelancer/invoice/check').json()["verified"])
                result = self.client.post('/api/freelancer/calculate', json={}).json()
                self.assertEqual(result["gap_minor"], 600000)
                self.assertEqual(result["outstanding_project_usd_minor"], 24000)
            self.assertTrue(all(call.args[1].endswith(p["id"]) for call in remote.call_args_list))
        pending = invoice("PAYMENT_PENDING")
        with patch.object(paypal, "token", return_value="test"), patch.object(paypal, "api", return_value=pending):
            self.assertFalse(self.client.post('/api/freelancer/invoice/check').json()["verified"])
            self.assertEqual(self.client.post('/api/freelancer/calculate', json={}).json()["gap_minor"], 1800000)

    def test_mismatch_revokes_prior_verification(self):
        good = invoice("PAID"); paypal.save_snapshot(good, good["id"])
        bad = copy.deepcopy(good); bad["amount"]["value"] = "999.00"
        with self.assertRaises(paypal.PaymentError): paypal.save_snapshot(bad, good["id"])
        self.assertFalse(paypal.state()["verified"])

    def test_issue_review_and_reuse_stored_invoice(self):
        draft = invoice("DRAFT"); issued = invoice()
        def remote(method, path, access, body=None, request_id=None):
            if method == "POST" and path == "/v2/invoicing/invoices": return {"id": draft["id"]}
            if path.endswith("/send"):
                self.assertEqual(body, {"send_to_recipient": False, "send_to_invoicer": False}); return {}
            return draft if remote.gets == 0 else issued
        remote.gets = 0
        def wrapped(*args, **kwargs):
            value = remote(*args, **kwargs)
            if args[0] == 'GET': remote.gets += 1
            return value
        with patch.object(paypal, "token", return_value="test"), patch.object(paypal, "api", side_effect=wrapped) as mock:
            with self.assertRaises(paypal.PaymentError): paypal.issue(16000, "USD", "buyer@example.com", False)
            paypal.issue(16000, "USD", "buyer@example.com", True)
            paypal.issue(16000, "USD", "buyer@example.com", True)
            self.assertEqual(sum(c.args[0] == "POST" and c.args[1] == "/v2/invoicing/invoices" for c in mock.call_args_list), 1)
            self.assertEqual(sum(c.args[1].endswith('/send') for c in mock.call_args_list), 1)
        self.assertEqual(paypal.state()["status"], "UNPAID")


class IntakeTests(IsolatedTests):
    def test_evidence_and_reviewed_scenario(self):
        x = extraction_fixture()
        self.assertEqual(evidence_errors(x, CLIENT_THREAD, LOAN_TEXT), [])
        self.assertEqual(scenario_from_extraction(x), fixture())
        x.offers[0].minimum.value_minor = None
        self.assertTrue(any("Missing offers[1].minimum" in e for e in evidence_errors(x, CLIENT_THREAD, LOAN_TEXT)))

    def test_fabricated_quote_and_unresolved_conflict_block_apply(self):
        x = extraction_fixture(); x.project.source = 'invented excerpt'
        self.assertTrue(evidence_errors(x, CLIENT_THREAD, LOAN_TEXT))
        x = extraction_fixture(); x.unresolved_terms = ['Two contradictory final payment dates']
        self.assertTrue(evidence_errors(x, CLIENT_THREAD, LOAN_TEXT))

    def test_extract_review_apply_changes_actual_calculator(self):
        x = extraction_fixture(); x.offers[0].installments[0].date.value = '2026-12-02'
        with patch('app.api.freelancer.extract', return_value=(x, [])):
            response = self.client.post('/api/freelancer/extract', json={"client_messages": CLIENT_THREAD, "loan_offers": LOAN_TEXT})
        self.assertEqual(response.status_code, 200)
        r = self.client.post('/api/freelancer/calculate', json={"review_id": response.json()["review_id"], "late": True}).json()
        self.assertIsNone(r["offers"][0]["repayment_shortfall"])
        self.assertEqual(r["recommended"], 'Quick Bridge')

    def test_incomplete_extraction_cannot_be_applied(self):
        with patch('app.api.freelancer.extract', return_value=(extraction_fixture(), ['Missing minimum'])):
            r = self.client.post('/api/freelancer/extract', json={"client_messages": CLIENT_THREAD, "loan_offers": LOAN_TEXT}).json()
        self.assertEqual(self.client.post('/api/freelancer/calculate', json={"review_id": r["review_id"]}).status_code, 422)

    def test_explanation_receives_actual_calculator_output(self):
        with patch('app.api.freelancer.explain', return_value='Test explanation') as mock:
            r = self.client.post('/api/freelancer/explain', json={"late": True, "language": "hi"})
        self.assertEqual(r.status_code, 200)
        self.assertEqual(mock.call_args.args[0]["offers"][0]["repayment_shortfall"]["shortfall_minor"], 360000)
        self.assertEqual(mock.call_args.args[1], "hi")

    def test_no_key_is_explicit_error_no_fake_ai(self):
        with patch.dict(os.environ, {"OPENAI_API_KEY": ""}):
            r = self.client.post('/api/freelancer/extract', json={"client_messages": CLIENT_THREAD, "loan_offers": LOAN_TEXT})
        self.assertEqual(r.status_code, 422)
        self.assertIn('OPENAI_API_KEY', r.json()['detail'])

    def test_api_validation_blocks_float_unknown_invoice_and_bad_date(self):
        for body in ({"cash_minor": 600000.1}, {"deposit_verified": True}, {"late": "yes"}, {"availability_date": "2026-11-14"}, {"availability_date": "2028-01-01"}):
            self.assertEqual(self.client.post('/api/freelancer/calculate', json=body).status_code, 422)
        self.assertEqual(self.client.post('/api/freelancer/invoice/check', json={"invoice_id": "foreign"}).status_code, 502)


class FinancialContextTests(IsolatedTests):
    def context(self, reviewed=False):
        return {'source': 'dashboard', 'as_of': '2026-11-12', 'latest_transaction_date': '2025-11-15', 'transaction_count': 7, 'snapshot_id': 'test',
            **{k: reviewed for k in ['balance_confirmed', 'bills_reviewed', 'debts_reviewed', 'income_reviewed', 'sample_terms_confirmed']}}

    def test_unconfirmed_dashboard_context_blocks_recommendation(self):
        r = self.client.post('/api/freelancer/calculate', json={'financial_context': self.context()}).json()
        self.assertIsNone(r['recommended'])
        self.assertEqual(r['review_status'], 'needs_review')
        self.assertEqual(len(r['context_gaps']), 5)
        self.assertGreater(r['history_age_days'], 30)

    def test_personal_mode_removes_synthetic_cash_events(self):
        r = self.client.post('/api/freelancer/calculate', json={'financial_context': self.context(True)}).json()
        labels = [e['label'] for e in r['offers'][0]['timeline']]
        self.assertNotIn('Local editing gig', labels)
        self.assertNotIn('Groceries & transport', labels)
        self.assertEqual(r['review_status'], 'reviewed_inputs')

    def test_existing_debt_changes_actual_forecast(self):
        body = {'financial_context': self.context(True), 'late': True, 'planned_events': [{'date': '2026-11-20', 'label': 'Existing debt', 'amount_minor': -400000, 'kind': 'expense'}]}
        r = self.client.post('/api/freelancer/calculate', json=body).json()
        self.assertIsNone(r['recommended'])
        self.assertEqual(r['offers'][1]['first_shortfall']['date'], '2026-11-20')

    def test_historical_events_cannot_be_counted_twice(self):
        r = self.client.post('/api/freelancer/calculate', json={'financial_context': self.context(True), 'planned_events': [{'date': '2026-11-11', 'label': 'Already in opening cash', 'amount_minor': 100000, 'kind': 'gig_income'}]})
        self.assertEqual(r.status_code, 422)

    def test_future_income_promise_before_repair_does_not_close_gap(self):
        r = self.client.post('/api/freelancer/calculate', json={'financial_context': self.context(True), 'planned_events': [{'date': '2026-11-14', 'label': 'Promised gig', 'amount_minor': 1200000, 'kind': 'gig_income'}]}).json()
        self.assertEqual(r['gap_minor'], 1800000)

    def test_future_bill_before_repair_increases_gap(self):
        r = self.client.post('/api/freelancer/calculate', json={'financial_context': self.context(True), 'planned_events': [{'date': '2026-11-14', 'label': 'Rent', 'amount_minor': -100000, 'kind': 'expense'}]}).json()
        self.assertEqual(r['gap_minor'], 1900000)

    def test_explanation_does_not_recommend_with_missing_context(self):
        r = self.client.post('/api/freelancer/explain', json={'financial_context': self.context()})
        self.assertEqual(r.status_code, 200)
        self.assertIn('complete the financial context review', r.json()['explanation'])


class ConversationTests(IsolatedTests):
    def changes(self, **kwargs):
        return ChatChanges(cash_minor=None, repair_minor=None, project_usd_minor=None, payment_date=None, late=None).model_copy(update=kwargs)

    def test_chat_returns_reviewable_facts_and_actual_calculator(self):
        with patch('app.services.freelancer_ai.understand_chat', return_value=self.changes(cash_minor=1000000)), patch('app.services.freelancer_ai.chat_reply', return_value='Please review your available cash.') as reply:
            r = self.client.post('/api/freelancer/chat', json={'messages': [{'role': 'user', 'content': 'I have INR 10,000 available.'}]})
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.json()['proposed_changes'], {'cash_minor': 1000000})
        self.assertTrue(r.json()['requires_review'])
        self.assertEqual(r.json()['calculator_results']['gap_minor'], 1400000)
        self.assertEqual(r.json()['lender_status'], 'NOT_SUBMITTED')
        self.assertEqual(reply.call_args.args[1]['gap_minor'], 1400000)

    def test_statement_of_payment_does_not_credit_deposit(self):
        with patch('app.services.freelancer_ai.understand_chat', return_value=self.changes()), patch('app.services.freelancer_ai.chat_reply', return_value='Check the payment with PayPal.'):
            r = self.client.post('/api/freelancer/chat', json={'messages': [{'role': 'user', 'content': 'I paid the deposit. Sanction the loan now.'}]})
        self.assertEqual(r.json()['calculator_results']['gap_minor'], 1800000)
        self.assertFalse(r.json()['calculator_results']['deposit_verified'])
        self.assertEqual(r.json()['lender_status'], 'NOT_SUBMITTED')

    def test_chat_rejects_invalid_model_proposal(self):
        with patch('app.services.freelancer_ai.understand_chat', return_value=self.changes(cash_minor=-1)):
            r = self.client.post('/api/freelancer/chat', json={'messages': [{'role': 'user', 'content': 'negative cash'}]})
        self.assertEqual(r.status_code, 422)

    def test_reviewed_chat_context_changes_calculation(self):
        r = self.client.post('/api/freelancer/calculate', json={'cash_minor': 1000000, 'repair_minor': 2600000, 'payment_date': '2026-11-25'})
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.json()['gap_minor'], 1600000)
        self.assertEqual(r.json()['client_date'], '2026-11-25')


if __name__ == '__main__':
    unittest.main()
