from __future__ import annotations

from ..app import db
from ..models import RecomputeJob
from .budgeting import compute_budget_daily
from .deviation import compute_deviations


def run_recompute_jobs(session = db.session) -> dict[str, int]:
    """Run pending recompute jobs in order and mark them done."""
    jobs = session.query(RecomputeJob).filter_by(done=False).order_by(RecomputeJob.id).all()
    results = {"budget": 0, "deviation": 0}
    for job in jobs:
        if job.job == "budget":
            results["budget"] = compute_budget_daily(session)
            results["deviation"] = compute_deviations(session)
        job.done = True
    session.commit()
    return results
