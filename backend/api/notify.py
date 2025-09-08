from __future__ import annotations

from datetime import datetime, timedelta
from secrets import token_urlsafe

from flask import jsonify
import random

from . import api_bp
from ..app import db, limiter
from ..models import OneTimeToken, TriggerEvent, MessageTemplate, TemplateAssign, AuditLog
from ..services.notify import schedule_reminder


@api_bp.post('/notify/trigger/<int:trigger_id>')
@limiter.limit('5/hour') if limiter else (lambda f: f)
def notify_trigger(trigger_id: int):
    trigger = TriggerEvent.query.get_or_404(trigger_id)
    head_id = trigger.assigned_head_id
    # invalidate old tokens
    OneTimeToken.query.filter_by(trigger_id=trigger_id, head_id=head_id, used_at=None).update(
        {"expires_at": datetime.utcnow()}
    )
    tok = token_urlsafe(32)
    expires = datetime.utcnow() + timedelta(hours=48)

    assign = TemplateAssign.query.first()
    rule = assign.rule if assign else 'random'
    if rule == 'severity':
        variant = 'A' if trigger.severity == 'High' else 'B'
    elif rule == 'unit':
        variant = 'A' if (trigger.unit_id or 0) % 2 == 0 else 'B'
    else:
        variant = random.choice(['A', 'B'])
    template = MessageTemplate.query.filter_by(variant=variant).first()

    ott = OneTimeToken(
        token=tok,
        trigger_id=trigger_id,
        head_id=head_id,
        expires_at=expires,
        variant=variant,
    )
    db.session.add(ott)
    db.session.add(
        AuditLog(
            entity='message_template',
            entity_id=str(template.id) if template else variant,
            action='send',
            actor='',
            diff_json={'trigger_id': trigger_id, 'variant': variant},
        )
    )
    db.session.commit()
    url = f"/token/{tok}"
    schedule_reminder(trigger)
    return jsonify({"url": url})


@api_bp.get('/token/<token>')
def get_token(token: str):
    ott = OneTimeToken.query.filter_by(token=token).first()
    if not ott:
        return jsonify({"error": "یافت نشد"}), 404
    if ott.used_at:
        return jsonify({"error": "لینک استفاده شده"}), 400
    if ott.expires_at < datetime.utcnow():
        return jsonify({"error": "لینک منقضی شده"}), 400
    return jsonify({"trigger_id": ott.trigger_id, "head_id": ott.head_id})
