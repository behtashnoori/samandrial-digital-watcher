from __future__ import annotations

from datetime import datetime, timedelta
from secrets import token_urlsafe
import random

from apscheduler.schedulers.background import BackgroundScheduler

from ..app import db
from ..models import (
    OneTimeToken,
    TriggerEvent,
    Response,
    MessageTemplate,
    TemplateAssign,
    AuditLog,
)

scheduler = BackgroundScheduler()
scheduler.start()


def schedule_reminder(trigger: TriggerEvent):
    if not trigger.due_at:
        return
    run_time = trigger.due_at - timedelta(hours=24)
    if run_time <= datetime.utcnow():
        return
    scheduler.add_job(send_reminder, 'date', run_date=run_time, args=[trigger.id])


def send_reminder(trigger_id: int):
    trig = TriggerEvent.query.get(trigger_id)
    if not trig or Response.query.filter_by(trigger_id=trigger_id).first():
        return
    OneTimeToken.query.filter_by(trigger_id=trigger_id, used_at=None).update(
        {"expires_at": datetime.utcnow()}
    )
    tok = token_urlsafe(32)
    expires = datetime.utcnow() + timedelta(hours=48)
    assign = TemplateAssign.query.first()
    rule = assign.rule if assign else 'random'
    if rule == 'severity':
        variant = 'A' if trig.severity == 'High' else 'B'
    elif rule == 'unit':
        variant = 'A' if (trig.unit_id or 0) % 2 == 0 else 'B'
    else:
        variant = random.choice(['A', 'B'])
    template = MessageTemplate.query.filter_by(variant=variant).first()
    ott = OneTimeToken(
        token=tok,
        trigger_id=trigger_id,
        head_id=trig.assigned_head_id,
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
    trig.status = 'reminded'
    db.session.commit()
    # placeholder for sending notification
