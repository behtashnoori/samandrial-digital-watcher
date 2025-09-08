from __future__ import annotations

from collections import defaultdict
from datetime import date
from decimal import Decimal, ROUND_HALF_UP
from typing import Dict, List, Tuple

from ..app import db
from ..models import (
    BudgetAnnual,
    BudgetDaily,
    BudgetSnapshot,
    CalendarDim,
    SeasonalityMonth,
    TriggerEvent,
)


def compute_budget_daily(session=db.session, year: int = 1404) -> int:
    """Distribute published annual budgets into daily records using month and day weights."""

    # fetch seasonality weights and normalize
    season_rows = session.query(SeasonalityMonth).all()
    if season_rows:
        total = sum(r.season_weight for r in season_rows) or 1.0
        month_factors: Dict[int, float] = {
            r.month: r.season_weight / total for r in season_rows
        }
    else:
        month_factors = {m: 1 / 12 for m in range(1, 13)}

    # fetch calendar weights grouped by month
    cal_rows = (
        session.query(CalendarDim)
        .filter(CalendarDim.date_shamsi.like(f"{year}%"))
        .all()
    )
    cal_by_month: Dict[int, List[Tuple[date, float]]] = defaultdict(list)
    for c in cal_rows:
        try:
            d = date.fromisoformat(c.date_shamsi.replace("/", "-"))
        except Exception:
            continue
        cal_by_month[c.jalali_month].append((d, c.weight_raw))

    day_factors: Dict[int, List[Tuple[date, float]]] = {}
    for month, items in cal_by_month.items():
        total = sum(w for _, w in items) or 1.0
        day_factors[month] = [(d, w / total) for d, w in items]

    # delete existing daily budgets for the year
    session.query(BudgetDaily).filter(
        BudgetDaily.date.between(date(year, 1, 1), date(year, 12, 31))
    ).delete(synchronize_session=False)

    budgets = (
        session.query(BudgetAnnual)
        .join(BudgetSnapshot, BudgetAnnual.snapshot_id == BudgetSnapshot.id)
        .filter(BudgetSnapshot.year == year, BudgetSnapshot.status == "published")
        .all()
    )

    created = 0
    for b in budgets:
        for month in range(1, 13):
            month_share = month_factors.get(month, 0)
            days = day_factors.get(month, [])
            if month_share == 0 or not days:
                continue

            qty_month = Decimal(str(b.annual_qty or 0)) * Decimal(str(month_share))
            fin_month = Decimal(str(b.annual_fin or 0)) * Decimal(str(month_share))

            qty_values = (
                [qty_month * Decimal(str(w)) for _, w in days]
                if b.annual_qty is not None
                else [None] * len(days)
            )
            fin_values = (
                [fin_month * Decimal(str(w)) for _, w in days]
                if b.annual_fin is not None
                else [None] * len(days)
            )

            if b.annual_qty is not None:
                rounded = [v.quantize(Decimal("0.01"), ROUND_HALF_UP) for v in qty_values]
                diff = qty_month - sum(rounded)
                order = sorted(range(len(days)), key=lambda i: days[i][1], reverse=True)
                idx = 0
                while diff > Decimal("0") and idx < len(order):
                    rounded[order[idx]] += Decimal("0.01")
                    diff -= Decimal("0.01")
                    idx += 1
                qty_values = rounded

            if b.annual_fin is not None:
                rounded = [v.quantize(Decimal("0.01"), ROUND_HALF_UP) for v in fin_values]
                diff = fin_month - sum(rounded)
                order = sorted(range(len(days)), key=lambda i: days[i][1], reverse=True)
                idx = 0
                while diff > Decimal("0") and idx < len(order):
                    rounded[order[idx]] += Decimal("0.01")
                    diff -= Decimal("0.01")
                    idx += 1
                fin_values = rounded

            for (day, _), q, f in zip(days, qty_values, fin_values):
                session.add(
                    BudgetDaily(
                        date=day,
                        service_code=b.service_code,
                        unit_id=b.unit_id,
                        qty=float(q) if q is not None else None,
                        fin=float(f) if f is not None else None,
                    )
                )
                created += 1

    session.query(TriggerEvent).filter(TriggerEvent.status == "open").update(
        {TriggerEvent.updated_by_new_budget: True}, synchronize_session=False
    )
    session.commit()
    return created
