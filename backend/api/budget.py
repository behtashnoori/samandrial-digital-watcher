from __future__ import annotations

from flask import jsonify, request

from . import api_bp
from ..models import BudgetSnapshot, BudgetAnnual


@api_bp.get('/budget/snapshots')
def list_snapshots():
    snaps = BudgetSnapshot.query.order_by(BudgetSnapshot.created_at.desc()).all()
    return jsonify([
        {
            'id': s.id,
            'year': s.year,
            'scenario': s.scenario,
            'status': s.status,
            'created_at': s.created_at.isoformat(),
        }
        for s in snaps
    ])


@api_bp.get('/budget/diff')
def budget_diff():
    from_id = request.args.get('from', type=int)
    to_id = request.args.get('to', type=int)
    if not from_id or not to_id:
        return jsonify({'error': 'missing ids'}), 400
    from_rows = BudgetAnnual.query.filter_by(snapshot_id=from_id).all()
    to_rows = BudgetAnnual.query.filter_by(snapshot_id=to_id).all()
    from_map = {
        (r.service_code, r.unit_id): r for r in from_rows
    }
    to_map = {
        (r.service_code, r.unit_id): r for r in to_rows
    }
    added = []
    removed = []
    changed = []
    for key, row in to_map.items():
        if key not in from_map:
            added.append({'service_code': row.service_code, 'unit_id': row.unit_id})
        else:
            prev = from_map[key]
            if (
                prev.annual_qty != row.annual_qty
                or prev.annual_fin != row.annual_fin
            ):
                changed.append({'service_code': row.service_code, 'unit_id': row.unit_id})
    for key in from_map:
        if key not in to_map:
            prev = from_map[key]
            removed.append({'service_code': prev.service_code, 'unit_id': prev.unit_id})
    return jsonify({'added': added, 'removed': removed, 'changed': changed})
