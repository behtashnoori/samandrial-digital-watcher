from __future__ import annotations

from pathlib import Path
import os

from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from sqlalchemy import event
from werkzeug.security import generate_password_hash


db = SQLAlchemy()
migrate = Migrate()


def create_app() -> Flask:
    app = Flask(__name__, instance_relative_config=True)
    app.config.update(
        SQLALCHEMY_DATABASE_URI='sqlite:///samandrag.db',
        SQLALCHEMY_TRACK_MODIFICATIONS=False,
    )
    Path(app.instance_path).mkdir(parents=True, exist_ok=True)

    db.init_app(app)
    migrate.init_app(app, db)

    from .api import api_bp
    app.register_blueprint(api_bp, url_prefix='/api')

    from . import models  # noqa: F401
    from .services.notify import scheduler  # noqa: F401

    with app.app_context():
        event.listen(db.engine, 'connect', lambda conn, _: conn.execute('PRAGMA journal_mode=WAL'))
        from .models import User
        if not User.query.filter_by(username='didehban').first():
            pwd = os.environ.get('ADMIN_PASSWORD', 'admin')
            user = User(
                username='didehban',
                password_hash=generate_password_hash(pwd),
                role='admin',
            )
            db.session.add(user)
            db.session.commit()

    return app


app = create_app()
