from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import inspect, text
from .models import db, BlogPost, Exam, MasterQuestion, ExamResult, User, UserPoints, ExamPurchase, PointsPack


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
                'slug': 'slug VARCHAR(100)',
                'status': "status VARCHAR(50) DEFAULT 'active'",
                'full_name': 'full_name VARCHAR(200)',
                'year': 'year VARCHAR(50)',
                'icon': 'icon VARCHAR(50)',
                'badge': 'badge VARCHAR(50)',
                'color': 'color VARCHAR(200)',
                'border': 'border VARCHAR(200)',
                'badge_color': 'badge_color VARCHAR(200)',
                'theme_color': 'theme_color VARCHAR(50)',
                'conducted_by': 'conducted_by VARCHAR(200)',
                'body_text': 'body_text TEXT',
                'desc_card': 'desc_card TEXT',
                'sections': 'sections JSON',
                'highlights': 'highlights JSON',
                'features': 'features JSON',
                'faq': 'faq JSON',
                'seo': 'seo JSON',
                'marketplace_config': 'marketplace_config JSON',
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

        # Seed default exam if empty, or populate from seed_exams.json
        import json
        import os
        from datetime import date
        from .models import Exam

        seed_path = os.path.join(os.path.dirname(__file__), 'seed_exams.json')
        if os.path.exists(seed_path):
            try:
                with open(seed_path, 'r', encoding='utf-8') as f:
                    seed_exams = json.load(f)
                for item in seed_exams:
                    exam_id = item.get('examId') or item.get('id')
                    if not exam_id:
                        continue
                    existing = Exam.query.get(exam_id)
                    if not existing:
                        exam = Exam(
                            id=exam_id,
                            name=item.get('name'),
                            date=date.today(),
                            total_questions=item.get('total_questions') or 100,
                            price=item.get('marketplace', {}).get('defaultPackPrice', 0) if item.get('marketplace') else 0,
                            description=item.get('marketplace', {}).get('folderDescription', '') if item.get('marketplace') else '',
                            disclaimer=item.get('marketplace', {}).get('disclaimer', '') if item.get('marketplace') else '',
                            slug=item.get('slug'),
                            status=item.get('status', 'active'),
                            full_name=item.get('fullName'),
                            year=item.get('year'),
                            icon=item.get('icon'),
                            badge=item.get('badge'),
                            color=item.get('color'),
                            border=item.get('border'),
                            badge_color=item.get('badgeColor'),
                            theme_color=item.get('themeColor'),
                            conducted_by=item.get('conductedBy'),
                            body_text=item.get('bodyText'),
                            desc_card=item.get('descCard'),
                            sections=item.get('sections'),
                            highlights=item.get('highlights'),
                            features=item.get('features'),
                            faq=item.get('faq'),
                            seo=item.get('seo'),
                            marketplace_config=item.get('marketplace')
                        )
                        db.session.add(exam)
                    else:
                        # Sync new properties if they are missing
                        if not existing.slug:
                            existing.slug = item.get('slug')
                        if not existing.status:
                            existing.status = item.get('status', 'active')
                        if not existing.full_name:
                            existing.full_name = item.get('fullName')
                        if not existing.year:
                            existing.year = item.get('year')
                        if not existing.icon:
                            existing.icon = item.get('icon')
                        if not existing.badge:
                            existing.badge = item.get('badge')
                        if not existing.color:
                            existing.color = item.get('color')
                        if not existing.border:
                            existing.border = item.get('border')
                        if not existing.badge_color:
                            existing.badge_color = item.get('badgeColor')
                        if not existing.theme_color:
                            existing.theme_color = item.get('themeColor')
                        if not existing.conducted_by:
                            existing.conducted_by = item.get('conductedBy')
                        if not existing.body_text:
                            existing.body_text = item.get('bodyText')
                        if not existing.desc_card:
                            existing.desc_card = item.get('descCard')
                        if not existing.sections:
                            existing.sections = item.get('sections')
                        if not existing.highlights:
                            existing.highlights = item.get('highlights')
                        if not existing.features:
                            existing.features = item.get('features')
                        if not existing.faq:
                            existing.faq = item.get('faq')
                        if not existing.seo:
                            existing.seo = item.get('seo')
                        if not existing.marketplace_config:
                            existing.marketplace_config = item.get('marketplace')
                db.session.commit()
            except Exception as se:
                print(f"Error seeding exams: {se}")
                db.session.rollback()
        else:
            if Exam.query.count() == 0:
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