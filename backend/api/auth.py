from __future__ import annotations

from flask import jsonify, request
import secrets
import bcrypt

from ..models import User
from . import api_bp


@api_bp.post('/auth/login')
def login():
    data = request.get_json() or {}
    username = data.get('username')
    password = data.get('password')
    if not username or not password:
        return jsonify({'error': 'نام کاربری یا رمز عبور وارد نشده است'}), 400
    user = User.query.filter_by(username=username).first()
    if not user or not bcrypt.checkpw(password.encode(), user.password_hash.encode()):
        return jsonify({'error': 'ورود ناموفق'}), 401
    csrf = secrets.token_hex(16)
    resp = jsonify({'username': user.username, 'role': user.role})
    resp.set_cookie('csrf_token', csrf, httponly=True)
    return resp
