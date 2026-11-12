import json
import os
import uuid
from datetime import date
from typing import Literal
from fastapi import APIRouter, HTTPException
from pydantic import Field, StrictInt, StrictBool
from app.services.freelancer_cash import Model, Scenario, CashEvent, fixture, calculate, CLIENT_THREAD, LOAN_TEXT
from app.services import paypal_deposit as paypal
from app.services.freelancer_ai import extract, explain

router = APIRouter(prefix="/freelancer")


class FinancialContext(Model):
    source: Literal["dashboard", "manual", "demo", "unavailable"]
    as_of: date
    latest_transaction_date: date | None = None
    transaction_count: StrictInt = Field(default=0, ge=0)
    snapshot_id: str = Field(default="", max_length=80)
    balance_confirmed: StrictBool = False
    bills_reviewed: StrictBool = False
    debts_reviewed: StrictBool = False
    income_reviewed: StrictBool = False
    sample_terms_confirmed: StrictBool = False


class CalculationRequest(Model):
    review_id: str | None = None
    late: StrictBool = False
    availability_date: date = date(2026, 11, 16)
    cash_minor: StrictInt = Field(default=600000, ge=0, le=100_000_000)
    repair_minor: StrictInt | None = Field(default=None, gt=0, le=100_000_000)
    payment_date: date | None = None
    project_usd_minor: StrictInt | None = Field(default=None, ge=16000, le=10_000_000)
    financial_context: FinancialContext | None = None
    planned_events: list[CashEvent] | None = Field(default=None, max_length=40)


class IntakeRequest(Model):
    client_messages: str = Field(min_length=20, max_length=16000)
    loan_offers: str = Field(min_length=20, max_length=16000)


class ExplainRequest(CalculationRequest):
    language: Literal["en", "hi", "kn"] = "en"


class InvoiceRequest(Model):
    amount_minor: StrictInt
    currency: Literal["USD"]
    recipient: str = Field(min_length=3, max_length=254)
    approved: StrictBool


class ChatMessage(Model):
    role: Literal["user", "assistant"]
    content: str = Field(min_length=1, max_length=8000)


class ChatRequest(CalculationRequest):
    messages: list[ChatMessage] = Field(min_length=1, max_length=24)
    language: Literal["en", "hi", "kn"] = "en"


def review_db():
    db = paypal.connect()
    db.execute("CREATE TABLE IF NOT EXISTS reviews (id TEXT PRIMARY KEY, extraction TEXT NOT NULL, scenario TEXT, errors TEXT NOT NULL)")
    db.commit()
    return db


def scenario_for(request):
    s = fixture()
    if request.review_id:
        with review_db() as db:
            row = db.execute("SELECT scenario FROM reviews WHERE id=?", (request.review_id,)).fetchone()
        if not row or not row["scenario"]:
            raise HTTPException(422, "The extraction is missing, expired, or has unresolved terms. Run intake and review again.")
        s = Scenario.model_validate_json(row["scenario"])
    s.cash_minor = request.cash_minor
    if request.financial_context and request.financial_context.source != "demo":
        s.opening_date = request.financial_context.as_of
        # Historical transactions are already included in opening cash. They are
        # never inserted as future income/expenses, and sample living costs are removed.
        s.events = request.planned_events or []
        if any(e.date <= s.opening_date for e in s.events):
            raise HTTPException(422, "Planned events must be after the balance snapshot date; historical transactions cannot be counted twice")
    elif request.planned_events is not None:
        s.events = request.planned_events
    if request.repair_minor is not None:
        s.repair_minor = request.repair_minor
    if request.payment_date is not None:
        s.payment_date = request.payment_date
    if request.project_usd_minor is not None:
        s.project_usd_minor = request.project_usd_minor
    try:
        s = Scenario.model_validate(s.model_dump())
    except ValueError as exc:
        raise HTTPException(422, "The proposed dates or amounts do not fit this cash timeline. Please review them.") from exc
    if not s.opening_date <= request.availability_date <= max(i.date for o in s.offers for i in o.installments):
        raise HTTPException(422, "Funds availability must fall within the displayed cash timeline")
    return s


def results_for(request):
    results = calculate(scenario_for(request), request.late, paypal.state()["verified"], request.availability_date)
    context = request.financial_context
    gaps = []
    if context:
        for field, question in (
            ("balance_confirmed", "Confirm the amount actually available to spend; dashboard transaction net is not a verified bank balance."),
            ("bills_reviewed", "Review upcoming living costs and bills, including any not in the dashboard."),
            ("debts_reviewed", "Review existing debt installments and other repayments."),
            ("income_reviewed", "Review expected income, its dates, and the client payment promise."),
            ("sample_terms_confirmed", "Confirm that the displayed repair, project, and sample loan terms are the scenario you want to compare."),
        ):
            if not getattr(context, field):
                gaps.append(question)
        if context.source == "unavailable":
            gaps.insert(0, "No usable dashboard balance is available. Enter and confirm available cash.")
        results["financial_context"] = context.model_dump(mode="json")
        latest = context.latest_transaction_date
        results["history_age_days"] = max(0, (context.as_of - latest).days) if latest else None
    results["context_gaps"] = gaps
    results["review_status"] = "needs_review" if gaps else "reviewed_demo" if context and context.source == "demo" else "reviewed_inputs" if context else "sample_preview"
    if gaps:
        results["recommended"] = None
    return results


@router.get("/bootstrap")
def bootstrap():
    return {"scenario": fixture().model_dump(mode="json"), "client_messages": CLIENT_THREAD, "loan_offers": LOAN_TEXT,
        "paypal": paypal.state(), "paypal_config": paypal.configured(), "recipient": os.getenv("PAYPAL_BUYER_EMAIL", ""),
        "ai_configured": bool(os.getenv("OPENAI_API_KEY")) and not os.getenv("OPENAI_API_KEY", "").startswith("your-"),
        "ai_model": os.getenv("OPENAI_MODEL", "gpt-4o-mini")}


@router.post("/calculate")
def calculator(request: CalculationRequest):
    return results_for(request)


@router.post("/extract")
def intake(request: IntakeRequest):
    try:
        result, errors = extract(request.client_messages, request.loan_offers)
        from app.services.freelancer_ai import scenario_from_extraction
        scenario = None if errors else scenario_from_extraction(result).model_dump_json()
        review_id = str(uuid.uuid4())
        with review_db() as db:
            db.execute("INSERT INTO reviews VALUES (?, ?, ?, ?)", (review_id, result.model_dump_json(), scenario, json.dumps(errors)))
        return {"review_id": review_id, "extraction": result.model_dump(), "errors": errors, "provider": "OpenAI", "model": os.getenv("OPENAI_MODEL", "gpt-4o-mini")}
    except ValueError as exc:
        raise HTTPException(422, str(exc)) from exc


@router.post("/explain")
def explanation(request: ExplainRequest):
    results = results_for(request)
    try:
        return {"explanation": explain(results, request.language), "calculator_results": results}
    except ValueError as exc:
        raise HTTPException(422, str(exc)) from exc


@router.post("/chat")
def loan_conversation(request: ChatRequest):
    from app.services.freelancer_ai import understand_chat, chat_reply
    if request.messages[-1].role != "user":
        raise HTTPException(422, "The final message must be from the user")
    try:
        changes = understand_chat(request.messages[-1].content)
        proposed = request.model_copy(deep=True)
        patch = {}
        for key in ("cash_minor", "repair_minor", "project_usd_minor", "payment_date", "late"):
            value = getattr(changes, key)
            if value is not None:
                patch[key] = value
                setattr(proposed, key, value)
        # Revalidate model-proposed fields rather than trusting schema-shaped output.
        proposed = ChatRequest.model_validate(proposed.model_dump())
        results = results_for(proposed)
        reply = chat_reply(request.messages, results, patch, request.language)
        return {"reply": reply, "proposed_changes": patch, "calculator_results": results,
            "lender_status": "NOT_SUBMITTED", "requires_review": bool(patch), "mode": "live_ai"}
    except ValueError as exc:
        raise HTTPException(422, str(exc)) from exc


@router.post("/invoice/issue")
def issue_invoice(request: InvoiceRequest):
    try:
        return paypal.issue(request.amount_minor, request.currency, request.recipient, request.approved)
    except paypal.PaymentError as exc:
        raise HTTPException(502, str(exc)) from exc


@router.post("/invoice/check")
def check_payment():
    try:
        return paypal.check()
    except paypal.PaymentError as exc:
        raise HTTPException(502, str(exc)) from exc
