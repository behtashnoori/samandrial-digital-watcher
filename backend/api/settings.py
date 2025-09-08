from __future__ import annotations

from flask import jsonify, request

from . import api_bp
from ..app import db
from ..models import Setting, MessageTemplate, TemplateAssign, OneTimeToken


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


@api_bp.get('/message-templates')
def get_message_templates():
    templates = MessageTemplate.query.all()
    assign = TemplateAssign.query.first()
    return jsonify(
        {
            'templates': [
                {
                    'id': t.id,
                    'name': t.name,
                    'variant': t.variant,
                    'body_fa': t.body_fa,
                    'status': t.status,
                }
                for t in templates
            ],
            'assign_rule': assign.rule if assign else 'random',
        }
    )


@api_bp.post('/message-templates')
def save_message_templates():
    data = request.get_json() or {}
    for item in data.get('templates', []):
        variant = item.get('variant')
        tmpl = MessageTemplate.query.filter_by(variant=variant).first()
        if not tmpl:
            tmpl = MessageTemplate(variant=variant)
            db.session.add(tmpl)
        tmpl.name = item.get('name', '')
        tmpl.body_fa = item.get('body_fa', '')
        tmpl.status = item.get('status', 'active')
    rule = data.get('assign_rule')
    if rule:
        assign = TemplateAssign.query.first()
        if not assign:
            assign = TemplateAssign(rule=rule)
            db.session.add(assign)
        else:
            assign.rule = rule
    db.session.commit()
    return jsonify({'status': 'ok'})


@api_bp.get('/message-templates/stats')
def message_template_stats():
    from datetime import datetime, timedelta

    since = datetime.utcnow() - timedelta(days=30)
    tokens = OneTimeToken.query.filter(OneTimeToken.created_at >= since).all()
    stats = {}
    for v in ['A', 'B']:
        total = len([t for t in tokens if t.variant == v])
        used = len([t for t in tokens if t.variant == v and t.used_at])
        stats[v] = (used / total * 100) if total else 0
    return jsonify(stats)
