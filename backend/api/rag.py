from __future__ import annotations

from flask import jsonify, request

from . import api_bp
from ..services import rag as rag_service


@api_bp.route('/rag/search', methods=['POST'])
def rag_search():
    data = request.get_json() or {}
    query: str | None = data.get('q')
    if not query:
        return jsonify({'message': 'پرس‌وجو خالی است'}), 400
    results = rag_service.search(query)
    return jsonify(results), 200
