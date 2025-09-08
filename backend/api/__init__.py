from flask import Blueprint, jsonify

api_bp = Blueprint('api', __name__)

@api_bp.route('/ping')
def ping() -> tuple[dict[str, str], int]:
    return jsonify({'status': 'ok'}), 200


from . import (
    compute,
    imports,
    org,
    responses,
    settings,
    triggers,
    dashboard,
    rag,
    auth,
    notify,
    budget,
    dq,
)  # noqa: F401
