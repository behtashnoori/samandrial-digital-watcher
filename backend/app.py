from __future__ import annotations

from pathlib import Path

from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from sqlalchemy import event


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

    with app.app_context():
        event.listen(db.engine, 'connect', lambda conn, _: conn.execute('PRAGMA journal_mode=WAL'))

    return app


app = create_app()
