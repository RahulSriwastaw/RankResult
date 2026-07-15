from flask import Blueprint, request, jsonify
from db.models import db, ExamResult, QuestionResponse, MasterQuestion
from services.scraper import fetch_html, parse_result_html
from sqlalchemy.exc import IntegrityError
from datetime import datetime
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

    # ── 1. Check if input is URL or Raw HTML ──────────────────────────────
    parsed = None
    try:
        html = None
        if url.startswith('http://') or url.startswith('https://') or url.startswith('www.'):
            print(f"[API] Fetching URL: {url}")
            html = fetch_html(url, use_curl=True)
        else:
            # Assume it's raw HTML pasted directly
            print("[API] Input does not look like a URL. Treating as raw HTML.")
            html = url

        if html:
            print("[API] Parsing HTML...")
            parsed = parse_result_html(html)
            if parsed and len(parsed.get('questions', [])) > 0:
                print(f"[API] Parsed {len(parsed['questions'])} questions OK")
            else:
                print("[API] 0 questions parsed. Invalid HTML or unsupported format.")
                parsed = None
        else:
            print("[API] Failed to fetch or receive HTML.")
            return jsonify({'error': 'Failed to load HTML from URL'}), 400

    except Exception as e:
        print(f"[API] Scraping error: {e}")
        import traceback
        traceback.print_exc()
        parsed = None

    if not parsed:
        return jsonify({'error': 'Answer key could not be parsed. Make sure the URL or HTML is correct and from a supported exam (TCS iON).'}), 400

    if not isinstance(parsed, dict):
        return jsonify({'error': 'Invalid parse structure'}), 500

    # ── 3. Save ExamResult with all candidate info ─────────────────────────
    roll_number = parsed.get('roll_number')
    registration_number = parsed.get('registration_number')

    existing_result = None
    if roll_number:
        existing_result = ExamResult.query.filter_by(exam_id=exam_id, roll_number=roll_number).first()
    elif registration_number:
        existing_result = ExamResult.query.filter_by(exam_id=exam_id, registration_number=registration_number).first()

    if existing_result:
        print(f"[API] Result already exists for roll/reg: {roll_number or registration_number}. Checking questions...")
        questions = (
            QuestionResponse.query
            .filter_by(result_id=existing_result.id)
            .order_by(QuestionResponse.question_no)
            .all()
        )
        # If questions exist, check if complete
        parsed_q_count = len(parsed.get('questions', []))
        if len(questions) > 0:
            if parsed_q_count > 0 and len(questions) != parsed_q_count:
                print(f"[API] Cached result has {len(questions)} questions but parsed has {parsed_q_count}. Deleting old cache to re-insert.")
                QuestionResponse.query.filter_by(result_id=existing_result.id).delete()
                db.session.commit()
                # fall through to re-parse and insert
            else:
                print(f"[API] Returning cached result with {len(questions)} questions")
                return jsonify({
                    'result': existing_result.to_dict(),
                    'questions': [q.to_dict() for q in questions]
                })
        # Questions missing — fall through to re-parse and insert
        print(f"[API] Cached result has 0 questions — will re-parse and insert questions")
        new_result = existing_result

    def _coerce_datetime(value):
        if isinstance(value, datetime):
            return value
        if isinstance(value, str):
            value = value.strip()
            if not value:
                return None
            try:
                return datetime.fromisoformat(value.replace('Z', '+00:00'))
            except ValueError:
                return None
        return None

    # If not found (or re-parsing cached result that has 0 questions), create/skip ExamResult
    roll_number = roll_number or str(uuid.uuid4())[:8]
    parsed_at = _coerce_datetime(parsed.get('parsed_at'))

    # new_result is set to existing_result in the re-parse path above; otherwise create fresh
    if 'new_result' not in locals():
        new_result = None

    if new_result is None:
        def _build_result(rn):
            return ExamResult(
                user_id=None,
                exam_id=exam_id,
                registration_number=registration_number,
                roll_number=rn,
                candidate_name=parsed.get('candidate_name'),
                community=parsed.get('community'),
                test_centre_name=parsed.get('test_centre_name'),
                test_date=parsed.get('test_date'),
                test_time=parsed.get('test_time'),
                subject=parsed.get('subject'),
                photo_url=parsed.get('photo_url'),
                application_photograph=parsed.get('application_photograph') or parsed.get('photo_url'),
                candidate_payload=parsed.get('candidate_payload') or {},
                source_html=parsed.get('source_html'),
                parser_version=parsed.get('parser_version', 'rankveda-parser-v1.0'),
                parsed_at=parsed_at,
                score=parsed.get('score', 0) or 0,
                rank=parsed.get('rank', 0) or 0,
                percentile=parsed.get('percentile', 0) or 0,
                category_rank=parsed.get('category_rank', 0) or 0,
                category=parsed.get('category', 'UR') or 'UR',
                section_wise=parsed.get('section_wise', {}) or {},
                total_correct=parsed.get('total_correct', 0),
                total_wrong=parsed.get('total_wrong', 0),
                total_unattempted=parsed.get('total_unattempted', 0)
            )
        try:
            new_result = _build_result(roll_number)
            db.session.add(new_result)
            db.session.commit()
        except IntegrityError:
            db.session.rollback()
            roll_number = str(uuid.uuid4())[:12]
            new_result = _build_result(roll_number)
            db.session.add(new_result)
            db.session.commit()

    # ── 4. Save QuestionResponses with master question mapping ─────────────
    saved_qnos = set()
    current_shift = {
        'exam_id': exam_id,
        'test_date': parsed.get('test_date'),
        'test_time': parsed.get('test_time'),
        'subject': parsed.get('subject')
    }

    questions_list = parsed.get('questions')
    if not isinstance(questions_list, list):
        questions_list = []

    for q in questions_list:
        if not isinstance(q, dict):
            continue
        qno = q.get('qno')
        correct = q.get('correct_answer') or '—'

        # Skip if duplicate qno (missing correct answer uses placeholder '—' to avoid skipping)
        if qno in saved_qnos:
            continue
        saved_qnos.add(qno)

        try:
            db.session.begin_nested()
            q_text = q.get('question_text') or ''
            q_hash = MasterQuestion.generate_hash(q_text)
            q_id_html = q.get('question_id_html')

            # Find existing master question
            mq = None
            if q_id_html:
                mq = MasterQuestion.query.filter_by(question_id_html=q_id_html).first()
            if not mq:
                mq = MasterQuestion.query.filter_by(question_hash=q_hash).first()

            if mq:
                mq.reference_count += 1
                shifts_list = mq.shifts or []
                is_new_shift = True
                for s in shifts_list:
                    if (s.get('exam_id') == current_shift['exam_id'] and
                        s.get('test_date') == current_shift['test_date'] and
                        s.get('test_time') == current_shift['test_time'] and
                        s.get('subject') == current_shift['subject']):
                        is_new_shift = False
                        break
                if is_new_shift:
                    mq.shifts = shifts_list + [current_shift]
                    mq.shift_count = len(mq.shifts)
            else:
                mq = MasterQuestion(
                    question_id_html=q_id_html,
                    question_hash=q_hash,
                    question_text=q_text,
                    correct_answer=correct,
                    parsed_payload=q,
                    correct_option_text=q.get('correct_option_text'),
                    option_a_id=q.get('option_a_id'),
                    option_b_id=q.get('option_b_id'),
                    option_c_id=q.get('option_c_id'),
                    option_d_id=q.get('option_d_id'),
                    option_a_text=q.get('option_a_text'),
                    option_b_text=q.get('option_b_text'),
                    option_c_text=q.get('option_c_text'),
                    option_d_text=q.get('option_d_text'),
                    reference_count=1,
                    shifts=[current_shift],
                    shift_count=1
                )
                db.session.add(mq)
                db.session.flush()

            qr = QuestionResponse(
                result_id=new_result.id,
                question_no=qno,
                master_question_id=mq.id,
                option_id=q.get('option_id'),
                parsed_payload=q,
                student_answer=(q.get('student_answer') or '')[:10],
                student_option_text=q.get('student_option_text'),
                marks_awarded=q.get('marks', 0) or 0,
                status=q.get('status', 'unattempted')
            )
            # Set correct_answer directly for DB NOT NULL compat
            try:
                qr.correct_answer = (mq.correct_answer or correct or '0')[:10]
            except Exception:
                pass
            db.session.add(qr)
            db.session.flush()
        except Exception as ex:
            db.session.rollback() # Rolls back only to SAVEPOINT
            print(f"[API] Question insert error: {ex}")
            continue

    try:
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        print(f"[API] Question insert error (partial save): {e}")

    # ── 5. Build response with all data ────────────────────────────────────
    questions = (
        QuestionResponse.query
        .filter_by(result_id=new_result.id)
        .order_by(QuestionResponse.question_no)
        .all()
    )

    return jsonify({
        'result': new_result.to_dict(),
        'questions': [q.to_dict() for q in questions]
    })


# ── Live Rank Endpoint ────────────────────────────────────────────────────────

@results_bp.route('/rank', methods=['GET'])
def get_live_rank():
    """Calculate live rank based on score among all results for an exam."""
    from db.models import ExamResult
    try:
        exam_id = request.args.get('exam_id', 1, type=int)
        score = request.args.get('score', type=float)
        if score is None:
            return jsonify({'error': 'score required'}), 400

        # Count total results for this exam
        total = ExamResult.query.filter_by(exam_id=exam_id).count()

        # Count how many scored higher
        higher = ExamResult.query.filter(
            ExamResult.exam_id == exam_id,
            ExamResult.score > score
        ).count()

        rank = higher + 1
        percentile = round((1 - higher / max(total, 1)) * 100, 2)

        return jsonify({
            'rank': rank,
            'total_appeared': total,
            'percentile': percentile,
            'score': score,
        })
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500
