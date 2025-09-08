from __future__ import annotations

from datetime import datetime, timedelta
from secrets import token_urlsafe

from flask import jsonify

from . import api_bp
from ..app import db
from ..models import OneTimeToken, TriggerEvent
from ..services.notify import schedule_reminder


@api_bp.post('/notify/trigger/<int:trigger_id>')
def notify_trigger(trigger_id: int):
    trigger = TriggerEvent.query.get_or_404(trigger_id)
    head_id = trigger.assigned_head_id
    # invalidate old tokens
    OneTimeToken.query.filter_by(trigger_id=trigger_id, head_id=head_id, used_at=None).update(
        {"expires_at": datetime.utcnow()}
    )
    tok = token_urlsafe(32)
    expires = datetime.utcnow() + timedelta(hours=48)
    ott = OneTimeToken(token=tok, trigger_id=trigger_id, head_id=head_id, expires_at=expires)
    db.session.add(ott)
    db.session.commit()
    url = f"/token/{tok}"
    schedule_reminder(trigger)
    return jsonify({"url": url})


@api_bp.get('/token/<token>')
def get_token(token: str):
    ott = OneTimeToken.query.filter_by(token=token).first_or_404()
    if ott.used_at or ott.expires_at < datetime.utcnow():
        return jsonify({"error": "invalid"}), 400
    return jsonify({"trigger_id": ott.trigger_id, "head_id": ott.head_id})
