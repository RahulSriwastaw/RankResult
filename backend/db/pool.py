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

        db.create_all()
        if db.engine.dialect.name == 'sqlite':
            _ensure_columns('exams', {
                'price': 'price INTEGER DEFAULT 0',
                'description': 'description TEXT',
                'disclaimer': 'disclaimer TEXT',
            })
            _ensure_columns('user_points', {
                'total_earned': 'total_earned INTEGER DEFAULT 0',
                'total_spent': 'total_spent INTEGER DEFAULT 0',
            })
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
                'question_text_hin': 'question_text_hin TEXT',
                'question_text_eng': 'question_text_eng TEXT',
                'subject': 'subject VARCHAR(100)',
                'chapter': 'chapter VARCHAR(200)',
                'question_type': 'question_type VARCHAR(50)',
                'difficulty': 'difficulty VARCHAR(20)',
                'option_a_hin': 'option_a_hin TEXT',
                'option_a_eng': 'option_a_eng TEXT',
                'option_b_hin': 'option_b_hin TEXT',
                'option_b_eng': 'option_b_eng TEXT',
                'option_c_hin': 'option_c_hin TEXT',
                'option_c_eng': 'option_c_eng TEXT',
                'option_d_hin': 'option_d_hin TEXT',
                'option_d_eng': 'option_d_eng TEXT',
                'solution_hin': 'solution_hin TEXT',
                'solution_eng': 'solution_eng TEXT',
            })
            _ensure_columns('ai_solutions', {
                'user_id': 'user_id INTEGER REFERENCES users(id) ON DELETE SET NULL',
                'likes': 'likes INTEGER DEFAULT 0',
            })

        # Seed default exam if empty
        from .models import Exam
        if Exam.query.count() == 0:
            from datetime import date
            default_exam = Exam(
                id=1,
                name="RRB NTPC CBT 1",
                date=date.today(),
                total_questions=100,
                price=0,
                description="Default NTPC Exam"
            )
            db.session.add(default_exam)
            db.session.commit()