from __future__ import annotations

from ..app import db
from ..models import RecomputeJob
from .budgeting import compute_budget_daily
from .deviation import compute_deviations
from .dq import run_dq_checks


def run_recompute_jobs(session = db.session) -> dict[str, int]:
    """Run pending recompute jobs in order and mark them done."""
    jobs = session.query(RecomputeJob).filter_by(done=False).order_by(RecomputeJob.id).all()
    results = {"budget": 0, "deviation": 0}
    for job in jobs:
        if job.job == "budget":
            dq = run_dq_checks(session)
            if any(i["level"] == "error" for i in dq):
                continue
            results["budget"] = compute_budget_daily(session)
            results["deviation"] = compute_deviations(session)
        job.done = True
    session.commit()
    return results
