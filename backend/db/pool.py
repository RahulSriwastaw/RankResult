from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import inspect, text
from .models import db


def _ensure_columns(table_name, columns):
    inspector = inspect(db.engine)
    existing_columns = {col['name'] for col in inspector.get_columns(table_name)}
    for column_name, column_definition in columns.items():
        if column_name not in existing_columns:
            db.session.execute(text(f'ALTER TABLE {table_name} ADD COLUMN {column_definition}'))
    db.session.commit()


def init_db(app):
    db.init_app(app)
    with app.app_context():
        db.create_all()
        if db.engine.dialect.name == 'sqlite':
            from sqlalchemy import event
            from sqlalchemy.engine import Engine
            import sqlite3

            @event.listens_for(Engine, "connect")
            def set_sqlite_pragma(dbapi_connection, connection_record):
                if isinstance(dbapi_connection, sqlite3.Connection):
                    cursor = dbapi_connection.cursor()
                    cursor.execute("PRAGMA foreign_keys=ON")
                    cursor.close()

            _ensure_columns('exam_results', {
                'application_photograph': 'application_photograph VARCHAR(500)',
                'candidate_payload': 'candidate_payload JSON',
                'source_html': 'source_html TEXT',
                'parser_version': 'parser_version VARCHAR(50)',
                'parsed_at': 'parsed_at DATETIME',
            })
            _ensure_columns('question_responses', {
                'parsed_payload': 'parsed_payload JSON',
            })
            _ensure_columns('master_questions', {
                'parsed_payload': 'parsed_payload JSON',
            })