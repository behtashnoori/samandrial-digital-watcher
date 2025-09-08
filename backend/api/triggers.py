from flask import jsonify
from sqlalchemy import and_

from . import api_bp
from ..app import db
from ..models import (
    TriggerEvent,
    DeviationDaily,
    Service,
    Unit,
    Management,
    Head,
)


@api_bp.get("/triggers")
def list_triggers():
    rows = (
        db.session.query(
            TriggerEvent,
            DeviationDaily,
            Service.name.label("service_name"),
            Unit.name.label("unit_name"),
            Management.name.label("management_name"),
            Head.full_name.label("head_name"),
        )
        .join(
            DeviationDaily,
            and_(
                TriggerEvent.date == DeviationDaily.date,
                TriggerEvent.service_code == DeviationDaily.service_code,
                TriggerEvent.unit_id == DeviationDaily.unit_id,
            ),
        )
        .join(Service, Service.code == TriggerEvent.service_code)
        .join(Unit, Unit.id == TriggerEvent.unit_id)
        .join(Management, Management.id == Unit.management_id)
        .outerjoin(Head, Head.id == TriggerEvent.assigned_head_id)
        .all()
    )

    result = []
    for t, dev, svc_name, unit_name, mgmt_name, head_name in rows:
        result.append(
            {
                "id": t.id,
                "date": t.date.isoformat(),
                "service_code": t.service_code,
                "service_name": svc_name,
                "management": mgmt_name,
                "unit": unit_name,
                "budget": dev.budget_value,
                "actual": dev.actual_value,
                "deviation_pct": dev.deviation_pct,
                "severity": t.severity,
                "due_at": t.due_at.isoformat() if t.due_at else None,
                "head_name": head_name,
                "assigned_head_id": t.assigned_head_id,
                "updated": t.updated_by_new_budget,
            }
        )
    return jsonify(result)


@api_bp.get('/triggers/<int:trigger_id>')
def get_trigger(trigger_id: int):
    t = (
        db.session.query(
            TriggerEvent,
            DeviationDaily,
            Service.name.label('service_name'),
            Unit.name.label('unit_name'),
            Management.name.label('management_name'),
            Head.full_name.label('head_name'),
        )
        .join(
            DeviationDaily,
            and_(
                TriggerEvent.date == DeviationDaily.date,
                TriggerEvent.service_code == DeviationDaily.service_code,
                TriggerEvent.unit_id == DeviationDaily.unit_id,
            ),
        )
        .join(Service, Service.code == TriggerEvent.service_code)
        .join(Unit, Unit.id == TriggerEvent.unit_id)
        .join(Management, Management.id == Unit.management_id)
        .outerjoin(Head, Head.id == TriggerEvent.assigned_head_id)
        .filter(TriggerEvent.id == trigger_id)
        .first()
    )
    if not t:
        return jsonify({'message': 'not found'}), 404
    trig, dev, svc_name, unit_name, mgmt_name, head_name = t
    return (
        jsonify(
            {
                'id': trig.id,
                'date': trig.date.isoformat(),
                'service_code': trig.service_code,
                'service_name': svc_name,
                'management': mgmt_name,
                'unit': unit_name,
                'budget': dev.budget_value,
                'actual': dev.actual_value,
                'deviation_pct': dev.deviation_pct,
                'severity': trig.severity,
                'due_at': trig.due_at.isoformat() if trig.due_at else None,
                'head_name': head_name,
                'assigned_head_id': trig.assigned_head_id,
                'updated': trig.updated_by_new_budget,
            }
        ),
        200,
    )


@api_bp.get('/triggers/impacted')
def triggers_impacted():
    snapshot = request.args.get('snapshot', type=int)
    rows = TriggerEvent.query.filter_by(updated_by_new_budget=True).all()
    return jsonify([
        {
            'id': t.id,
            'service_code': t.service_code,
            'unit_id': t.unit_id,
            'severity': t.severity,
        }
        for t in rows
    ])
