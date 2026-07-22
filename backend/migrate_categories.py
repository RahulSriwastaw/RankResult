from app import create_app
from db.models import db, ExamResult

app = create_app()
with app.app_context():
    # Update category to match community for all records where category is UR or null or empty
    results = ExamResult.query.all()
    updated_count = 0
    for r in results:
        if r.community and r.category != r.community:
            r.category = r.community
            updated_count += 1
    db.session.commit()
    print(f"Successfully migrated {updated_count} exam results categories.")
