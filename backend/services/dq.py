from __future__ import annotations

from datetime import date
from typing import List, Dict

from sqlalchemy import func, or_

from ..models import (
    CalendarDim,
    SeasonalityMonth,
    OpsActualDaily,
    BudgetAnnual,
    HeadTenure,
    ServiceAssignment,
)


def run_dq_checks(session) -> List[Dict[str, str]]:
    issues: List[Dict[str, str]] = []

    # Calendar completeness
    cal_count = session.scalar(func.count(CalendarDim.id)) or 0
    if cal_count not in (365, 366):
        issues.append({"level": "error", "message": "تقویم ناقص است"})

    # Seasonality months
    months = {m for m, in session.query(SeasonalityMonth.month).all()}
    if len(months) != 12:
        issues.append({"level": "error", "message": "وزن فصلی ناقص است"})

    # Ops actual without service/unit
    bad_ops = session.scalar(
        func.count(OpsActualDaily.id).filter(
            or_(OpsActualDaily.service_code == None, OpsActualDaily.unit_id == None)
        )
    )
    if bad_ops:
        issues.append({"level": "error", "message": "عملکرد بدون کد خدمت یا واحد"})

    # Negative annual budgets
    neg_budget = session.scalar(
        func.count(BudgetAnnual.id).filter(
            or_(BudgetAnnual.annual_qty < 0, BudgetAnnual.annual_fin < 0)
        )
    )
    if neg_budget:
        issues.append({"level": "error", "message": "مقدار منفی در بودجه سالانه"})

    # Head tenure overlaps
    tenures = (
        session.query(HeadTenure)
        .order_by(HeadTenure.head_id, HeadTenure.unit_id, HeadTenure.valid_from)
        .all()
    )
    by_pair: Dict[tuple, List[HeadTenure]] = {}
    for t in tenures:
        by_pair.setdefault((t.head_id, t.unit_id), []).append(t)
    for arr in by_pair.values():
        arr.sort(key=lambda t: t.valid_from)
        for a, b in zip(arr, arr[1:]):
            end_a = a.valid_to or date.max
            if end_a > b.valid_from:
                issues.append({"level": "error", "message": "هم‌پوشانی بازه ریاست"})
                break

    # Service assignment overlaps
    assigns = (
        session.query(ServiceAssignment)
        .order_by(ServiceAssignment.service_code, ServiceAssignment.valid_from)
        .all()
    )
    by_service: Dict[str, List[ServiceAssignment]] = {}
    for s in assigns:
        by_service.setdefault(s.service_code, []).append(s)
    for arr in by_service.values():
        arr.sort(key=lambda s: s.valid_from)
        for a, b in zip(arr, arr[1:]):
            end_a = a.valid_to or date.max
            if end_a > b.valid_from:
                issues.append({"level": "error", "message": "هم‌پوشانی نگاشت خدمت"})
                break

    if not issues:
        issues.append({"level": "success", "message": "هیچ مشکلی یافت نشد"})

    return issues
