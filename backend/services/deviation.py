from __future__ import annotations

from datetime import datetime, timedelta
from typing import Dict, Tuple, Any

from sqlalchemy import and_, or_

from ..app import db
from ..models import (
    BudgetDaily,
    OpsActualDaily,
    DeviationDaily,
    TriggerEvent,
    ServiceAssignment,
    HeadTenure,
    Setting,
)


def _find_head(session, service_code: str, unit_id: int, day) -> int | None:
    assignment = (
        session.query(ServiceAssignment)
        .filter(
            ServiceAssignment.service_code == service_code,
            ServiceAssignment.unit_id == unit_id,
            ServiceAssignment.valid_from <= day,
            or_(ServiceAssignment.valid_to == None, ServiceAssignment.valid_to >= day),
        )
        .first()
    )
    if assignment and assignment.head_id:
        return assignment.head_id
    tenure = (
        session.query(HeadTenure)
        .filter(
            HeadTenure.unit_id == unit_id,
            HeadTenure.valid_from <= day,
            or_(HeadTenure.valid_to == None, HeadTenure.valid_to >= day),
        )
        .first()
    )
    return tenure.head_id if tenure else None


def compute_deviations(session = db.session) -> tuple[int, list[dict[str, Any]]]:
    setting = session.query(Setting).first()
    threshold = (setting.threshold if setting else 10.0) / 100
    consecutive_days = setting.consecutive_days if setting else 2
    cooldown_days = setting.cooldown_days if setting else 5
    due_hours = setting.due_hours if setting else 24

    session.query(DeviationDaily).delete(synchronize_session=False)

    data = (
        session.query(BudgetDaily, OpsActualDaily)
        .join(
            OpsActualDaily,
            and_(
                BudgetDaily.date == OpsActualDaily.date,
                BudgetDaily.service_code == OpsActualDaily.service_code,
                BudgetDaily.unit_id == OpsActualDaily.unit_id,
            ),
        )
        .order_by(BudgetDaily.service_code, BudgetDaily.unit_id, BudgetDaily.date)
        .all()
    )
    created = 0
    samples: list[dict[str, Any]] = []
    last_trigger: Dict[Tuple[str, int], None | tuple] = {}
    streak: Dict[Tuple[str, int], int] = {}
    last_date: Dict[Tuple[str, int], None | object] = {}
    for bd, actual in data:
        key = (bd.service_code, bd.unit_id or 0)
        budget_val = bd.qty if bd.qty is not None else bd.fin
        actual_val = actual.qty if actual.qty is not None else actual.fin
        if budget_val in (None, 0) or actual_val is None:
            continue
        deviation = (actual_val - budget_val) / budget_val

        session.add(
            DeviationDaily(
                date=bd.date,
                service_code=bd.service_code,
                unit_id=bd.unit_id,
                budget_value=budget_val,
                actual_value=actual_val,
                deviation_pct=deviation * 100,
            )
        )

        if abs(deviation) <= threshold:
            streak[key] = 0
            last_date[key] = bd.date
            continue
        prev_date = last_date.get(key)
        if prev_date and (bd.date - prev_date).days == 1:
            streak[key] = streak.get(key, 0) + 1
        else:
            streak[key] = 1
        last_date[key] = bd.date
        cooldown_until = last_trigger.get(key)
        if cooldown_until and bd.date <= cooldown_until:
            continue
        if streak[key] >= consecutive_days:
            head_id = _find_head(session, bd.service_code, bd.unit_id, bd.date)
            due_at = datetime.combine(bd.date, datetime.min.time()) + timedelta(hours=due_hours)
            trig = TriggerEvent(
                date=bd.date,
                service_code=bd.service_code,
                unit_id=bd.unit_id,
                deviation_value=deviation * 100,
                severity="High",
                threshold_used=threshold * 100,
                status="open",
                assigned_head_id=head_id,
                due_at=due_at,
            )
            session.add(trig)
            created += 1
            if len(samples) < 5:
                samples.append(
                    {
                        "date": bd.date.isoformat(),
                        "service_code": bd.service_code,
                        "unit_id": bd.unit_id,
                        "deviation_pct": deviation * 100,
                        "assigned_head_id": head_id,
                    }
                )
            last_trigger[key] = bd.date + timedelta(days=cooldown_days)
            streak[key] = 0
    session.commit()
    return created, samples
