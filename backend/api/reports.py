from __future__ import annotations

from datetime import date, timedelta
from flask import request, send_file
from io import BytesIO
import openpyxl

from . import api_bp
from ..app import db
from ..models import TriggerEvent

@api_bp.get('/reports/weekly.xlsx')
def weekly_report():
    week = int(request.args.get('week', 0))
    mgmt = request.args.get('management')
    today = date.today() - timedelta(weeks=week)
    start = today - timedelta(days=today.weekday())
    end = start + timedelta(days=6)
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.append(['service_code', 'unit_id', 'deviation', 'severity'])
    rows = (
        db.session.query(TriggerEvent)
        .filter(TriggerEvent.date >= start, TriggerEvent.date <= end)
        .order_by(db.desc(db.func.abs(TriggerEvent.deviation_value)))
        .limit(10)
        .all()
    )
    for r in rows:
        ws.append([r.service_code, r.unit_id, r.deviation_value, r.severity])
    buf = BytesIO()
    wb.save(buf)
    buf.seek(0)
    return send_file(
        buf,
        mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        as_attachment=True,
        download_name='weekly.xlsx',
    )
