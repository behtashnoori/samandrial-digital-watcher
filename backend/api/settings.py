from __future__ import annotations

from flask import jsonify, request

from . import api_bp
from ..app import db
from ..models import Setting


@api_bp.get('/settings')
def get_settings():
    setting = db.session.query(Setting).first()
    if not setting:
        setting = Setting()
        db.session.add(setting)
        db.session.commit()
    return jsonify(
        {
            'threshold': setting.threshold,
            'consecutive_days': setting.consecutive_days,
            'cooldown_days': setting.cooldown_days,
            'due_hours': setting.due_hours,
        }
    )


@api_bp.post('/settings')
def update_settings():
    data = request.get_json() or {}
    setting = db.session.query(Setting).first()
    if not setting:
        setting = Setting()
        db.session.add(setting)
    setting.threshold = data.get('threshold', setting.threshold)
    setting.consecutive_days = data.get('consecutive_days', setting.consecutive_days)
    setting.cooldown_days = data.get('cooldown_days', setting.cooldown_days)
    setting.due_hours = data.get('due_hours', setting.due_hours)
    db.session.commit()
    return jsonify({'status': 'ok'})
