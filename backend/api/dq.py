from flask import jsonify

from . import api_bp
from ..app import db
from ..services.dq import run_dq_checks


@api_bp.post('/dq/run')
def run_dq_endpoint():
    issues = run_dq_checks(db.session)
    return jsonify(issues), 200
