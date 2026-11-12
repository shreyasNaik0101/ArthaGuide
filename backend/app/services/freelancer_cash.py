"""Deterministic calendar-day cash model; every monetary value is integer paise/cents."""
from datetime import date, timedelta
from typing import Literal
from pydantic import BaseModel, ConfigDict, Field, StrictInt, model_validator


class Model(BaseModel):
    model_config = ConfigDict(extra="forbid")


class Installment(Model):
    date: date
    amount_minor: StrictInt = Field(gt=0, le=100_000_000)


class Offer(Model):
    name: str = Field(min_length=1, max_length=120)
    currency: Literal["INR"]
    principal_minor: StrictInt = Field(gt=0, le=100_000_000)
    fee_minor: StrictInt = Field(ge=0, le=100_000_000)
    minimum_minor: StrictInt = Field(gt=0, le=100_000_000)
    installments: list[Installment] = Field(min_length=1, max_length=12)

    @model_validator(mode="after")
    def terms(self):
        if self.principal_minor < self.minimum_minor:
            raise ValueError("Principal is below the stated minimum loan amount")
        if sum(x.amount_minor for x in self.installments) != self.principal_minor + self.fee_minor:
            raise ValueError("Installments must equal principal plus fees (fees paid through installments)")
        if [x.date for x in self.installments] != sorted(x.date for x in self.installments):
            raise ValueError("Installments must be in date order")
        return self


class CashEvent(Model):
    date: date
    label: str = Field(min_length=1, max_length=120)
    amount_minor: StrictInt = Field(ge=-100_000_000, le=100_000_000)
    kind: Literal["gig_income", "expense"]

    @model_validator(mode="after")
    def sign(self):
        if (self.kind == "expense" and self.amount_minor >= 0) or (self.kind == "gig_income" and self.amount_minor <= 0):
            raise ValueError("Expense must be negative; gig income must be positive")
        return self


class Scenario(Model):
    opening_date: date
    repair_date: date
    cash_minor: StrictInt = Field(ge=0, le=100_000_000)
    repair_minor: StrictInt = Field(gt=0, le=100_000_000)
    project_usd_minor: StrictInt = Field(ge=16000, le=10_000_000)
    original_payment_date: date
    payment_date: date
    offers: list[Offer] = Field(min_length=2, max_length=2)
    events: list[CashEvent] = Field(max_length=50)

    @model_validator(mode="after")
    def calendar(self):
        if not self.opening_date <= self.repair_date < self.payment_date:
            raise ValueError("This workflow requires client payment after the repair date")
        if any(i.date < self.repair_date for o in self.offers for i in o.installments):
            raise ValueError("Installments cannot precede loan disbursement on the repair date")
        if any(e.date < self.opening_date for e in self.events):
            raise ValueError("Cash events cannot precede the opening balance")
        if any(e.date > max(i.date for o in self.offers for i in o.installments) for e in self.events):
            raise ValueError("Cash events must be within the repayment horizon")
        return self


CLIENT_THREAD = """2026-11-12 | Alex, overseas client: The video editing project total is $400 USD. I will pay the full $400 USD on 2026-11-21.
2026-11-14 | Alex, overseas client: Our finance team has moved the payment. Please replace 2026-11-21 with 2026-11-24 as the payment date for the $400 USD project. This supersedes my earlier message.
2026-11-14 | Freelancer: Could you pay a separate $160 USD deposit against that $400 USD total? The remaining amount would be $240 USD. This is a request, not a confirmed payment."""

LOAN_TEXT = """SAMPLE OFFER A — Quick Bridge (synthetic, not a real lender): Currency INR. Principal INR 20,000. Minimum loan INR 20,000. Full principal disbursed on 2026-11-16. All-in fee INR 1,200, included in installments, no upfront deduction. Repay INR 10,600 on 2026-11-27 and INR 10,600 on 2026-12-10. Total repayment INR 21,200. No other interest or fees.
SAMPLE OFFER B — Steady Bridge (synthetic, not a real lender): Currency INR. Principal INR 20,000. Minimum loan INR 20,000. Full principal disbursed on 2026-11-16. All-in fee INR 2,400, included in installments, no upfront deduction. Repay INR 11,200 on 2026-12-03 and INR 11,200 on 2026-12-17. Total repayment INR 22,400. No other interest or fees."""


def fixture():
    return Scenario.model_validate({
        "opening_date": "2026-11-15", "repair_date": "2026-11-16", "cash_minor": 600000, "repair_minor": 2400000,
        "project_usd_minor": 40000, "original_payment_date": "2026-11-21", "payment_date": "2026-11-24",
        "offers": [
            {"name": "Quick Bridge", "currency": "INR", "principal_minor": 2000000, "fee_minor": 120000, "minimum_minor": 2000000, "installments": [{"date": "2026-11-27", "amount_minor": 1060000}, {"date": "2026-12-10", "amount_minor": 1060000}]},
            {"name": "Steady Bridge", "currency": "INR", "principal_minor": 2000000, "fee_minor": 240000, "minimum_minor": 2000000, "installments": [{"date": "2026-12-03", "amount_minor": 1120000}, {"date": "2026-12-17", "amount_minor": 1120000}]}
        ],
        "events": [
            {"date": "2026-11-18", "label": "Local editing gig", "amount_minor": 800000, "kind": "gig_income"},
            {"date": "2026-11-19", "label": "Groceries & transport", "amount_minor": -300000, "kind": "expense"},
            {"date": "2026-11-29", "label": "Internet & phone", "amount_minor": -150000, "kind": "expense"},
            {"date": "2026-12-05", "label": "Rent contribution", "amount_minor": -400000, "kind": "expense"},
            {"date": "2026-12-07", "label": "Local filming gig", "amount_minor": 600000, "kind": "gig_income"},
            {"date": "2026-12-12", "label": "Groceries", "amount_minor": -200000, "kind": "expense"}
        ]})


def calculate(scenario, late=False, deposit_verified=False, availability_date=None):
    s = scenario
    available = availability_date or s.repair_date
    # Demo assumptions: USD 10 fee on the deposit only; INR 80 per USD.
    deposit_minor = 1200000 if deposit_verified else 0
    outstanding_usd = s.project_usd_minor - (16000 if deposit_verified else 0)
    client_date = s.payment_date + timedelta(days=7 if late else 0)
    base = [{"date": s.opening_date.isoformat(), "label": "Cash on hand", "amount_minor": s.cash_minor, "kind": "opening", "certainty": "available"}]
    if deposit_verified:
        base.append({"date": available.isoformat(), "label": "PayPal deposit · modeled net", "amount_minor": deposit_minor, "kind": "deposit", "certainty": "estimated availability"})
    base.append({"date": s.repair_date.isoformat(), "label": "Laptop repair", "amount_minor": -s.repair_minor, "kind": "repair", "certainty": "planned expense"})
    base.append({"date": client_date.isoformat(), "label": f"Client project balance · ${outstanding_usd // 100} USD", "amount_minor": outstanding_usd * 80, "kind": "client", "certainty": "expected income"})
    base.extend({"date": e.date.isoformat(), "label": e.label, "amount_minor": e.amount_minor, "kind": e.kind, "certainty": "expected income" if e.kind == "gig_income" else "planned expense"} for e in s.events)
    # Repair gap excludes borrowing, promises, and funds available after the repair.
    repair_cash = s.cash_minor + sum(e.amount_minor for e in s.events if e.date <= s.repair_date and e.kind == "expense")
    if deposit_verified and available <= s.repair_date:
        repair_cash += deposit_minor
    gap = max(0, s.repair_minor - repair_cash)
    order = {"opening": 0, "deposit": 1, "loan": 2, "repair": 3, "expense": 4, "installment": 5, "gig_income": 6, "client": 7}
    comparisons = []
    for offer in s.offers:
        events = base + [{"date": s.repair_date.isoformat(), "label": offer.name + " disbursal", "amount_minor": offer.principal_minor, "kind": "loan", "certainty": "modeled borrowing"}]
        events += [{"date": i.date.isoformat(), "label": f"{offer.name} · installment {n + 1}", "amount_minor": -i.amount_minor, "kind": "installment", "certainty": "repayment due"} for n, i in enumerate(offer.installments)]
        events.sort(key=lambda e: (e["date"], order[e["kind"]]))
        balance, low, first, repayment = 0, None, None, None
        rows = []
        for event in events:
            before = balance
            balance += event["amount_minor"]
            low = balance if low is None else min(low, balance)
            row = {**event, "balance_minor": balance}
            rows.append(row)
            if balance < 0 and first is None:
                first = {**row, "shortfall_minor": -balance}
            if event["kind"] == "installment" and balance < 0 and repayment is None:
                repayment = {**row, "shortfall_minor": -balance, "caused_shortfall": before >= 0}
        comparisons.append({"name": offer.name, "principal_minor": offer.principal_minor, "fee_minor": offer.fee_minor,
            "minimum_minor": offer.minimum_minor, "total_repayment_minor": sum(i.amount_minor for i in offer.installments),
            "lowest_balance_minor": low, "first_shortfall": first, "repayment_shortfall": repayment,
            "supports_gap": offer.minimum_minor <= gap <= offer.principal_minor, "timeline": rows})
    safe = [o for o in comparisons if o["lowest_balance_minor"] >= 0 and o["principal_minor"] >= gap]
    best = min(safe, key=lambda o: o["total_repayment_minor"]) if safe else None
    return {"gap_minor": gap, "cash_by_repair_minor": repair_cash, "repair_minor": s.repair_minor, "repair_date": s.repair_date.isoformat(),
        "client_date": client_date.isoformat(), "late": late, "outstanding_project_usd_minor": outstanding_usd,
        "deposit_net_minor": deposit_minor, "deposit_verified": deposit_verified, "availability_date": available.isoformat(),
        "recommended": best["name"] if best else None, "offers": comparisons,
        "horizon": max(row["date"] for offer in comparisons for row in offer["timeline"]),
        "assumptions": "Calendar dates in India. Same-day expenses and installments run before expected income. Loan disbursal and modeled deposit availability run before repair. Future income is a promise, not available cash. Deposit fee $10; conversion ₹80/USD; no other modeled conversion fees."}
