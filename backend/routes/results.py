from flask import Blueprint, request, jsonify
from db.models import db, ExamResult, QuestionResponse
from services.scraper import fetch_html, parse_result_html
from sqlalchemy.exc import IntegrityError
import uuid

results_bp = Blueprint('results', __name__, url_prefix='/api/results')


@results_bp.route('', methods=['POST'])
@results_bp.route('/', methods=['POST'])
def get_result_from_url():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'JSON body required'}), 400

    url = data.get('url')
    exam_id = data.get('exam_id', 1)

    if not url:
        return jsonify({'error': 'URL is required'}), 400

    # ── 1. Try real scraping ──────────────────────────────────────────────
    parsed = None
    print(f"[API] Fetching URL: {url}")
    try:
        html = fetch_html(url, use_curl=True)
        if html:
            print("[API] HTML fetched, parsing...")
            parsed = parse_result_html(html)
            if parsed and len(parsed.get('questions', [])) > 0:
                print(f"[API] Parsed {len(parsed['questions'])} questions ✅")
            else:
                print("[API] 0 questions parsed, falling back to mock")
                parsed = None
        else:
            print("[API] Failed to fetch HTML, using mock data")
    except Exception as e:
        print(f"[API] Scraping error: {e}")
        parsed = None

    # ── 2. Fallback to mock ───────────────────────────────────────────────
    if not parsed:
        print("[API] Using MOCK DATA")
        parsed = _get_mock_result()

    # ── 3. Save ExamResult ────────────────────────────────────────────────
    roll_number = parsed.get('roll_number') or str(uuid.uuid4())[:8]

    try:
        new_result = ExamResult(
            user_id=None,
            exam_id=exam_id,
            roll_number=roll_number,
            score=parsed.get('score', 0) or 0,
            rank=parsed.get('rank', 0) or 0,
            percentile=parsed.get('percentile', 0) or 0,
            category_rank=parsed.get('category_rank', 0) or 0,
            category=parsed.get('category', 'UR') or 'UR',
            section_wise=parsed.get('section_wise', {}) or {}
        )
        db.session.add(new_result)
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        # Roll number already exists — generate a unique one and retry
        roll_number = str(uuid.uuid4())[:12]
        new_result = ExamResult(
            user_id=None,
            exam_id=exam_id,
            roll_number=roll_number,
            score=parsed.get('score', 0) or 0,
            rank=parsed.get('rank', 0) or 0,
            percentile=parsed.get('percentile', 0) or 0,
            category_rank=parsed.get('category_rank', 0) or 0,
            category=parsed.get('category', 'UR') or 'UR',
            section_wise=parsed.get('section_wise', {}) or {}
        )
        db.session.add(new_result)
        db.session.commit()

    # ── 4. Save QuestionResponses ─────────────────────────────────────────
    saved_qnos = set()
    for q in parsed.get('questions', []):
        qno = q.get('qno')
        correct = q.get('correct_answer')

        # Skip if no correct answer (DB requires it) or duplicate qno
        if not correct or qno in saved_qnos:
            continue
        saved_qnos.add(qno)

        try:
            qr = QuestionResponse(
                result_id=new_result.id,
                question_no=qno,
                question_text=q.get('question_text'),
                student_answer=q.get('student_answer'),
                correct_answer=correct,
                marks_awarded=q.get('marks', 0) or 0
            )
            db.session.add(qr)
            db.session.flush()  # catch constraint errors per row
        except IntegrityError:
            db.session.rollback()
            # Re-open session after rollback
            db.session.add(new_result)

    try:
        db.session.commit()
    except IntegrityError as e:
        db.session.rollback()
        print(f"[API] Question insert error (partial save): {e}")

    # ── 5. Build response ─────────────────────────────────────────────────
    questions = (
        QuestionResponse.query
        .filter_by(result_id=new_result.id)
        .order_by(QuestionResponse.question_no)
        .all()
    )

    return jsonify({
        'result': {
            'id': new_result.id,
            'roll_number': new_result.roll_number,
            'score': float(new_result.score),
            'rank': new_result.rank,
            'percentile': float(new_result.percentile) if new_result.percentile else 0,
            'category_rank': new_result.category_rank or 0,
            'category': new_result.category or 'UR',
            'section_wise': new_result.section_wise or {},
            'user_id': new_result.user_id
        },
        'questions': [{
            'id': q.id,
            'question_no': q.question_no,
            'question_text': q.question_text,
            'student_answer': q.student_answer,
            'correct_answer': q.correct_answer,
            'marks_awarded': float(q.marks_awarded) if q.marks_awarded is not None else 0
        } for q in questions]
    })


def _get_mock_result():
    mock_questions = [
        "निम्नलिखित में से कौन सा संविधान का मूल ढांचा नहीं है?",
        "भारत का राष्ट्रपति किस अनुच्छेद के तहत अध्यादेश जारी कर सकता है?",
        "संविधान के किस भाग में मूल कर्तव्यों का उल्लेख है?",
        "लोकसभा की अधिकतम सदस्य संख्या कितनी है?",
        "भारत के प्रथम मुख्य चयन आयुक्त कौन थे?"
    ]
    alt = ['1', '2']
    return {
        'score': 85.5,
        'rank': 245,
        'percentile': 92.4,
        'category_rank': 67,
        'category': 'UR',
        'roll_number': None,
        'section_wise': {'english': 20, 'maths': 25, 'reasoning': 22, 'gk': 18.5},
        'questions': [
            {
                'qno': i,
                'question_text': mock_questions[i % len(mock_questions)],
                'student_answer': alt[i % 2],
                'correct_answer': '1',
                'marks': 1 if alt[i % 2] == '1' else -1/3
            }
            for i in range(1, 101)
        ]
    }