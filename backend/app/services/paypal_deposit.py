"""One persistent, sandbox-only deposit. Never accept an invoice ID from the browser."""
import os
import re
import sqlite3
import threading
import uuid
from datetime import datetime, timezone
from decimal import Decimal, InvalidOperation
from pathlib import Path
from urllib.parse import urlparse

import httpx

BASE = "https://api-m.sandbox.paypal.com"
LOCK = threading.RLock()


class PaymentError(ValueError):
    pass


class ClosingConnection(sqlite3.Connection):
    def __exit__(self, *args):
        try:
            return super().__exit__(*args)
        finally:
            self.close()


def connect():
    path = Path(os.getenv("DEMO_DB_PATH", str(Path(__file__).resolve().parents[2] / "data" / "demo.sqlite3")))
    path.parent.mkdir(parents=True, exist_ok=True)
    db = sqlite3.connect(path, factory=ClosingConnection)
    db.row_factory = sqlite3.Row
    db.execute("CREATE TABLE IF NOT EXISTS deposit (slot INTEGER PRIMARY KEY CHECK(slot=1), request_id TEXT NOT NULL, invoice_id TEXT, status TEXT NOT NULL DEFAULT 'NOT_CREATED', verified INTEGER NOT NULL DEFAULT 0, payer_url TEXT, checked_at TEXT, payment_id TEXT)")
    if "payment_id" not in {row[1] for row in db.execute("PRAGMA table_info(deposit)")}:
        db.execute("ALTER TABLE deposit ADD COLUMN payment_id TEXT")
    db.execute("INSERT OR IGNORE INTO deposit(slot, request_id) VALUES(1, ?)", (str(uuid.uuid4()),))
    db.commit()
    return db


def state():
    with connect() as db:
        result = dict(db.execute("SELECT * FROM deposit WHERE slot=1").fetchone())
    result.pop("request_id")
    result["verified"] = bool(result["verified"])
    return result


def configured():
    return {key: bool(os.getenv(key)) for key in ("PAYPAL_CLIENT_ID", "PAYPAL_CLIENT_SECRET", "PAYPAL_BUYER_EMAIL")}


def token():
    if not all(configured().values()):
        raise PaymentError("Missing sandbox configuration: " + ", ".join(k for k, v in configured().items() if not v))
    try:
        r = httpx.post(BASE + "/v1/oauth2/token", auth=(os.environ["PAYPAL_CLIENT_ID"], os.environ["PAYPAL_CLIENT_SECRET"]), data={"grant_type": "client_credentials"}, timeout=30)
        if r.status_code != 200:
            raise PaymentError(f"PayPal sandbox authentication failed (HTTP {r.status_code}). Check merchant app credentials.")
        return r.json()["access_token"]
    except httpx.RequestError as exc:
        raise PaymentError("Cannot reach PayPal sandbox. Check network access.") from exc


def api(method, path, access, body=None, request_id=None):
    headers = {"Authorization": "Bearer " + access, "Content-Type": "application/json", "Prefer": "return=representation"}
    if request_id:
        headers["PayPal-Request-Id"] = request_id
    try:
        response = httpx.request(method, BASE + path, headers=headers, json=body, timeout=35)
    except httpx.RequestError as exc:
        raise PaymentError("PayPal request timed out or could not connect. Retry; the saved request ID prevents a new invoice.") from exc
    if response.status_code >= 400:
        try:
            data = response.json()
            name = data.get("name", "API_ERROR")
            debug = data.get("debug_id", "unavailable")
        except ValueError:
            name, debug = "API_ERROR", "unavailable"
        raise PaymentError(f"PayPal sandbox {name} (HTTP {response.status_code}; debug ID {debug}).")
    return response.json() if response.content else {}


def minor(money):
    if not isinstance(money, dict) or money.get("currency_code") != "USD":
        raise PaymentError("PayPal currency mismatch; deposit was not credited.")
    try:
        value = Decimal(str(money["value"])) * 100
        if not value.is_finite() or value != value.to_integral_value() or value < 0:
            raise ValueError()
        return int(value)
    except (KeyError, ValueError, InvalidOperation) as exc:
        raise PaymentError("Invalid PayPal amount; deposit was not credited.") from exc


def verify_invoice(invoice, invoice_id):
    if invoice.get("id") != invoice_id:
        raise PaymentError("PayPal invoice ID mismatch.")
    if invoice.get("detail", {}).get("currency_code") != "USD":
        raise PaymentError("PayPal invoice currency mismatch.")
    amount = invoice.get("amount", {})
    if minor(amount.get("total_amount", amount)) != 16000:
        raise PaymentError("PayPal invoice total does not match the approved $160.00 USD.")
    recipients = invoice.get("primary_recipients", [])
    expected = os.environ.get("PAYPAL_BUYER_EMAIL", "").lower()
    if len(recipients) != 1 or recipients[0].get("billing_info", {}).get("email_address", "").lower() != expected:
        raise PaymentError("PayPal recipient does not match the approved sandbox buyer.")
    # A manual MARKED_AS_PAID or pending payment is never proof of a PayPal payment.
    if invoice.get("status") != "PAID":
        return False
    payments = invoice.get("payments", {})
    if minor(payments.get("paid_amount", {})) != 16000:
        raise PaymentError("PayPal payment total does not match $160.00 USD.")
    transactions = payments.get("transactions", [])
    paypal_transactions = [t for t in transactions if t.get("type") == "PAYPAL" and t.get("payment_id")]
    if len({t["payment_id"] for t in paypal_transactions}) != len(paypal_transactions):
        raise PaymentError("Duplicate PayPal transaction IDs; deposit was not credited.")
    paypal_paid = sum(minor(t.get("amount", {})) for t in paypal_transactions)
    if paypal_paid != 16000:
        raise PaymentError("A matching PayPal transaction is not yet present. No deposit credited.")
    refunds = invoice.get("refunds", {})
    if refunds.get("transactions") or (refunds.get("refund_amount") and minor(refunds["refund_amount"]) != 0):
        raise PaymentError("This deposit has a refund; it cannot be modeled as available.")
    return True


def save_snapshot(invoice, invoice_id):
    # Fail closed: a mismatch must also revoke an earlier verified snapshot.
    with connect() as db:
        db.execute("UPDATE deposit SET verified=0, payment_id=NULL WHERE slot=1")
    verified = verify_invoice(invoice, invoice_id)
    url = invoice.get("detail", {}).get("metadata", {}).get("recipient_view_url")
    if not url:
        url = next((link.get("href") for link in invoice.get("links", []) if link.get("rel") == "payer-view"), None)
    if url:
        parsed = urlparse(url)
        if parsed.scheme != "https" or parsed.hostname not in ("www.sandbox.paypal.com", "sandbox.paypal.com"):
            raise PaymentError("PayPal returned a non-sandbox payer link.")
    with connect() as db:
        payment_id = ", ".join(t["payment_id"] for t in invoice.get("payments", {}).get("transactions", []) if t.get("type") == "PAYPAL" and t.get("payment_id")) if verified else None
        db.execute("UPDATE deposit SET status=?, verified=?, payer_url=COALESCE(?, payer_url), checked_at=?, payment_id=? WHERE slot=1", (invoice.get("status", "UNKNOWN"), int(verified), url, datetime.now(timezone.utc).isoformat(), payment_id))
    return state()


def issue(amount_minor, currency, recipient, approved):
    if approved is not True or amount_minor != 16000 or currency != "USD" or recipient.lower() != os.getenv("PAYPAL_BUYER_EMAIL", "").lower() or not recipient:
        raise PaymentError("Review and approve $160.00 USD and the configured sandbox recipient before issuing.")
    with LOCK:
        access = token()
        with connect() as db:
            row = dict(db.execute("SELECT * FROM deposit WHERE slot=1").fetchone())
        invoice_id = row["invoice_id"]
        if not invoice_id:
            draft = api("POST", "/v2/invoicing/invoices", access, {
                "detail": {"invoice_number": "AG-" + row["request_id"][:20], "currency_code": "USD", "reference": "ARTHA-VIDEO-DEPOSIT", "note": "Sandbox demo: $160 deposit against a $400 video editing project. Remaining project amount: $240.", "payment_term": {"term_type": "DUE_ON_RECEIPT"}},
                "invoicer": {"name": {"given_name": "Artha", "surname": "Freelancer"}},
                "primary_recipients": [{"billing_info": {"email_address": recipient}}],
                "items": [{"name": "Video editing project deposit (40% of $400)", "quantity": "1", "unit_amount": {"currency_code": "USD", "value": "160.00"}}],
                "configuration": {"allow_tip": False, "partial_payment": {"allow_partial_payment": False}}
            }, row["request_id"])
            invoice_id = draft.get("id") or draft.get("href", "").rstrip("/").split("/")[-1]
            if not re.fullmatch(r"INV2-[A-Z0-9-]+", invoice_id or ""):
                raise PaymentError("PayPal did not return a valid invoice ID. Retry with the saved request ID.")
            with connect() as db:
                db.execute("UPDATE deposit SET invoice_id=?, status='DRAFT' WHERE slot=1", (invoice_id,))
        invoice = api("GET", "/v2/invoicing/invoices/" + invoice_id, access)
        verify_invoice(invoice, invoice_id)
        if invoice.get("status") == "DRAFT":
            api("POST", f"/v2/invoicing/invoices/{invoice_id}/send", access, {"send_to_recipient": False, "send_to_invoicer": False}, row["request_id"] + "-send")
            invoice = api("GET", "/v2/invoicing/invoices/" + invoice_id, access)
        return save_snapshot(invoice, invoice_id)


def check():
    with LOCK:
        invoice_id = state()["invoice_id"]
        if not invoice_id:
            raise PaymentError("Issue the deposit invoice first.")
        invoice = api("GET", "/v2/invoicing/invoices/" + invoice_id, token())
        return save_snapshot(invoice, invoice_id)
