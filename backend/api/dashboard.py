from __future__ import annotations

import json
from collections import Counter
from datetime import date, timedelta

from flask import jsonify

from . import api_bp
from ..app import db
from ..models import Response, TriggerEvent


@api_bp.get("/dashboard")
def dashboard_summary():
    today = date.today()
    week_ago = today - timedelta(days=7)

    total_open = db.session.query(TriggerEvent).filter_by(status="open").count()
    high_open = (
        db.session.query(TriggerEvent)
        .filter_by(status="open", severity="High")
        .count()
    )
    total_triggers = db.session.query(TriggerEvent).count()
    responded = db.session.query(Response).count()
    response_rate = (responded / total_triggers * 100) if total_triggers else 0

    weekly_trigs = (
        db.session.query(TriggerEvent)
        .filter(TriggerEvent.date >= week_ago)
        .order_by(db.desc(db.func.abs(TriggerEvent.deviation_value)))
        .limit(5)
        .all()
    )
    top_deviations = [
        {
            "service_code": t.service_code,
            "unit_id": t.unit_id,
            "deviation": t.deviation_value,
            "updated": t.updated_by_new_budget,
        }
        for t in weekly_trigs
    ]

    words: list[str] = []
    responses = db.session.query(Response).filter(Response.submitted_at >= week_ago).all()
    for r in responses:
        words.extend(r.free_text.split())
    freq = Counter(w for w in words if len(w) > 3)
    causes = [w for w, _ in freq.most_common(5)]

    open_actions = 0
    for r in responses:
        try:
            actions = json.loads(r.actions_json or "[]")
            open_actions += len(actions)
        except Exception:
            pass

    return jsonify(
        {
            "open_triggers": total_open,
            "high_triggers": high_open,
            "response_rate": response_rate,
            "weekly": {
                "top_deviations": top_deviations,
                "causes": causes,
                "open_actions": open_actions,
            },
        }
    )
