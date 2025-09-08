from flask import jsonify

from . import api_bp
from ..app import db
from ..services.budgeting import compute_budget_daily
from ..services.deviation import compute_deviations
from ..services.recompute import run_recompute_jobs
from ..services.dq import run_dq_checks


@api_bp.post("/compute/budget-daily")
def compute_budget_daily_endpoint():
    dq = run_dq_checks(db.session)
    if any(i["level"] == "error" for i in dq):
        return jsonify({"dq": dq}), 400
    processed, samples = compute_budget_daily(db.session)
    return jsonify({"processed": processed, "samples": samples, "dq": dq})


@api_bp.post("/compute/deviations")
def compute_deviations_endpoint():
    dq = run_dq_checks(db.session)
    if any(i["level"] == "error" for i in dq):
        return jsonify({"dq": dq}), 400
    created, samples = compute_deviations(db.session)
    return jsonify({"created": created, "samples": samples, "dq": dq})


@api_bp.post("/recompute")
def run_recompute_endpoint():
    result = run_recompute_jobs(db.session)
    return jsonify(result)
