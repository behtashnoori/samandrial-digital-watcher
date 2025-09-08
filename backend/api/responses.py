from __future__ import annotations

import hashlib
import os
import time
from datetime import datetime

from flask import current_app, jsonify, request
from werkzeug.utils import secure_filename

from ..app import db
from ..models import Attachment, AuditLog, Response, TriggerEvent, OneTimeToken
from ..services import rag as rag_service
from . import api_bp


@api_bp.route('/responses', methods=['POST'])
def create_response() -> tuple[dict, int]:
    data = request.get_json() or {}
    free_text: str | None = data.get('free_text')
    if not free_text:
        return jsonify({'message': 'free_text required'}), 400
    if len(free_text) > 1000:
        return jsonify({'message': 'free_text too long'}), 400

    trigger_id = data.get('trigger_id')
    token_str = data.get('token')
    if trigger_id is None and token_str:
        ott = OneTimeToken.query.filter_by(token=token_str).first()
        if not ott or ott.used_at or ott.expires_at < datetime.utcnow():
            return jsonify({'message': 'invalid token'}), 400
        trigger_id = ott.trigger_id
        ott.used_at = datetime.utcnow()
    if trigger_id is None:
        return jsonify({'message': 'trigger_id required'}), 400

    actions = data.get('actions')
    if actions:
        if not isinstance(actions, list) or len(actions) > 3:
            return jsonify({'message': 'max 3 actions'}), 400
        for a in actions:
            if not all(a.get(k) for k in ('text', 'owner', 'due_date')):
                return jsonify({'message': 'action fields required'}), 400
    resp = Response(
        trigger_id=trigger_id,
        free_text=free_text,
        sample_ref=data.get('sample_ref'),
        actions_json=actions,
        submitted_at=datetime.utcnow(),
        submitted_by=data.get('submitted_by'),
    )
    db.session.add(resp)
    db.session.flush()
    db.session.add(
        AuditLog(
            entity='response',
            entity_id=str(resp.id),
            action='create',
            actor=data.get('submitted_by', ''),
            diff_json=data,
        )
    )
    db.session.commit()

    trig = TriggerEvent.query.get(trigger_id)
    if trig:
        parts = [free_text]
        if data.get('sample_ref'):
            parts.append(data['sample_ref'])
        if actions:
            for a in actions:
                parts.append(f"{a['text']} {a['owner']} {a['due_date']}")
        full_text = "\n".join(parts)
        rag_service.index_response(
            full_text,
            {
                'service_code': trig.service_code,
                'unit_id': trig.unit_id,
                'period': trig.date.isoformat(),
                'severity': trig.severity,
                'head_id': trig.assigned_head_id,
                'response_id': resp.id,
            },
        )

    return jsonify({'id': resp.id}), 201


@api_bp.route('/responses', methods=['GET'])
def list_responses() -> tuple[list[dict], int]:
    items = []
    for r in Response.query.order_by(Response.submitted_at.desc()).all():
        items.append({
            'id': r.id,
            'trigger_id': r.trigger_id,
            'free_text': r.free_text,
            'sample_ref': r.sample_ref,
            'actions': r.actions_json,
            'submitted_at': r.submitted_at.isoformat(),
            'attachments': [
                {
                    'id': a.id,
                    'file_name': a.file_name,
                    'uri': a.uri,
                }
                for a in r.attachments
            ],
        })
    return jsonify(items), 200


@api_bp.route('/responses/<int:response_id>/attachments', methods=['POST'])
def upload_attachment(response_id: int):
    file = request.files.get('file')
    if file is None:
        return jsonify({'message': 'no file'}), 400

    allowed_ext = {'.xlsx', '.pdf', '.jpg', '.jpeg', '.png'}
    filename = secure_filename(file.filename)
    ext = os.path.splitext(filename)[1].lower()
    if ext not in allowed_ext:
        return jsonify({'message': 'invalid file type'}), 400

    existing = Attachment.query.filter_by(response_id=response_id).count()
    if existing >= 3:
        return jsonify({'message': 'max 3 attachments'}), 400

    content = file.read()
    if len(content) > 5 * 1024 * 1024:
        return jsonify({'message': 'file too large'}), 400

    storage_dir = os.path.join(current_app.root_path, 'storage')
    os.makedirs(storage_dir, exist_ok=True)
    unique_name = f"{int(time.time())}_{filename}"
    path = os.path.join(storage_dir, unique_name)
    with open(path, 'wb') as f:
        f.write(content)

    sha256 = hashlib.sha256(content).hexdigest()
    attachment = Attachment(
        response_id=response_id,
        uri=path,
        file_name=filename,
        sha256=sha256,
        uploaded_by=request.form.get('uploaded_by'),
    )
    db.session.add(attachment)
    db.session.flush()
    db.session.add(
        AuditLog(
            entity='attachment',
            entity_id=str(attachment.id),
            action='create',
            actor=request.form.get('uploaded_by', ''),
        )
    )
    db.session.commit()
    resp = Response.query.get(response_id)
    trig = TriggerEvent.query.get(resp.trigger_id) if resp else None
    if trig:
        rag_service.index_response(
            "",
            {
                'service_code': trig.service_code,
                'unit_id': trig.unit_id,
                'period': trig.date.isoformat(),
                'severity': trig.severity,
                'head_id': trig.assigned_head_id,
                'response_id': resp.id if resp else None,
            },
            attachments=[path],
        )
    return (
        jsonify({'id': attachment.id, 'uri': attachment.uri, 'file_name': filename}),
        201,
    )
