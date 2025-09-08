from __future__ import annotations

from pathlib import Path
import os

from flask import Flask, g, request
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from sqlalchemy import event
import bcrypt
import uuid


db = SQLAlchemy()
migrate = Migrate()

try:
    from flask_limiter import Limiter
    from flask_limiter.util import get_remote_address
    limiter = Limiter(get_remote_address, default_limits=[])
except Exception:  # pragma: no cover
    limiter = None


def create_app() -> Flask:
    app = Flask(__name__, instance_relative_config=True)
    app.config.update(
        SECRET_KEY=os.environ.get('SECRET_KEY', 'dev'),
        SQLALCHEMY_DATABASE_URI='sqlite:///samandrag.db',
        SQLALCHEMY_TRACK_MODIFICATIONS=False,
    )
    Path(app.instance_path).mkdir(parents=True, exist_ok=True)

    db.init_app(app)
    migrate.init_app(app, db)
    if limiter:
        limiter.init_app(app)

    from .api import api_bp
    app.register_blueprint(api_bp, url_prefix='/api')

    from . import models  # noqa: F401
    from .services.notify import scheduler  # noqa: F401

    with app.app_context():
        event.listen(db.engine, 'connect', lambda conn, _: conn.execute('PRAGMA journal_mode=WAL'))
        from .models import User
        if not User.query.filter_by(username='didehban').first():
            pwd = os.environ.get('ADMIN_PASSWORD', 'admin').encode()
            hashed = bcrypt.hashpw(pwd, bcrypt.gensalt()).decode()
            user = User(
                username='didehban',
                password_hash=hashed,
                role='admin',
            )
            db.session.add(user)
            db.session.commit()

    @app.before_request
    def add_request_id():
        g.request_id = uuid.uuid4().hex
        if request.method in {'POST', 'PUT', 'PATCH', 'DELETE'} and request.path != '/api/auth/login':
            token = request.headers.get('X-CSRFToken')
            if not token or token != request.cookies.get('csrf_token'):
                return 'bad csrf', 400

    @app.after_request
    def log_request(resp):
        resp.headers['X-Request-ID'] = g.request_id
        app.logger.info('%s %s %s %s', g.request_id, request.method, request.path, resp.status_code)
        return resp

    return app


app = create_app()
