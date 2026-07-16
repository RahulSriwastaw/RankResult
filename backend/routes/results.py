from flask import Blueprint, request, jsonify
from db.models import db, ExamResult, QuestionResponse, MasterQuestion
from services.scraper import fetch_html, parse_result_html
from sqlalchemy.exc import IntegrityError
from datetime import datetime
import uuid
from flask import render_template, make_response
import pdfkit

results_bp = Blueprint('results', __name__, url_prefix='/api/results')


@results_bp.route('', methods=['POST'])
@results_bp.route('/', methods=['POST'])
def get_result_from_url():
    from routes.auth import get_current_user
    current_user = get_current_user()
    unlocked_mq_ids = set()
    if current_user:
        from db.models import UserUnlockedQuestion
        unlocked = UserUnlockedQuestion.query.filter_by(user_id=current_user.id).all()
        unlocked_mq_ids = {u.master_question_id for u in unlocked}

    data = request.get_json()
    if not data:
        return jsonify({'error': 'JSON body required'}), 400

    url = data.get('url')
    try:
        exam_id = int(data.get('exam_id', 1))
    except (ValueError, TypeError):
        exam_id = 1

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
                    'questions': [q.to_dict(unlocked_mq_ids) for q in questions]
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
            q_id_html = q.get('question_id_html')
            q_hash = MasterQuestion.generate_hash(q_text, q_id_html)

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
        'questions': [q.to_dict(unlocked_mq_ids) for q in questions]
    })


# ── PDF Export (server-rendered HTML -> PDF) ─────────────────────────────────
@results_bp.route('/<int:result_id>/pdf', methods=['GET'])
def download_result_pdf(result_id):
    from db.models import ExamResult, QuestionResponse
    res = ExamResult.query.get_or_404(result_id)
    questions = QuestionResponse.query.filter_by(result_id=res.id).order_by(QuestionResponse.question_no).all()

    # Build data structures similar to frontend `MarksheetCard` props
    candidate = {
        'name': res.candidate_name,
        'registration_no': res.registration_number,
        'roll_number': res.roll_number,
        'community': res.community,
        'test_centre_name': res.test_centre_name,
        'test_date': res.test_date,
        'test_time': res.test_time,
        'exam_name': res.exam.name if getattr(res, 'exam', None) else '',
        'subject': res.subject,
    }

    # sections: prefer section_wise mapping -> convert to list of simple objects
    sections = []
    sw = res.section_wise or {}
    if isinstance(sw, dict):
        for k, v in sw.items():
            sections.append({ 'name': k, 'total': None, 'na': None, 'right': None, 'wrong': None, 'marks': float(v) if v is not None else None })
    elif isinstance(sw, list):
        for s in sw:
            # if list of dicts
            if isinstance(s, dict):
                sections.append({ 'name': s.get('name') or s.get('section') or 'Section', 'total': s.get('total'), 'na': s.get('na'), 'right': s.get('right') or s.get('correct'), 'wrong': s.get('wrong'), 'marks': float(s.get('marks')) if s.get('marks') is not None else None })
            else:
                sections.append({ 'name': str(s), 'total': None, 'na': None, 'right': None, 'wrong': None, 'marks': None })

    score = {
        'total_marks': float(res.score) if res.score is not None else None,
        'correct': res.total_correct or 0,
        'wrong': res.total_wrong or 0,
        'unattempted': res.total_unattempted or 0,
        'max_marks': None,
        'sections': sections,
    }

    rank = {
        'rank': res.rank,
        'total_appeared': None,
        'percentile': float(res.percentile) if res.percentile is not None else None,
    }

    # Render a printable template matching MarksheetCard layout
    html = render_template('marksheet_pdf.html', candidate=candidate, score=score, rank=rank)

    # pdfkit requires wkhtmltopdf binary available on the system PATH
    options = {
        'encoding': 'UTF-8',
        'page-size': 'A4',
        'margin-top': '10mm',
        'margin-bottom': '10mm',
        'margin-left': '10mm',
        'margin-right': '10mm',
        'enable-local-file-access': None,
    }
    try:
        # Configure wkhtmltopdf binary path if provided via env or common Windows install location
        import os
        wkpath = os.environ.get('WKHTMLTOPDF_PATH')
        if not wkpath and os.name == 'nt':
            # Common installation path on Windows
            possible = [
                r"C:\Program Files\wkhtmltopdf\bin\wkhtmltopdf.exe",
                r"C:\Program Files (x86)\wkhtmltopdf\bin\wkhtmltopdf.exe"
            ]
            for p in possible:
                if os.path.exists(p):
                    wkpath = p
                    break
        if wkpath:
            config = pdfkit.configuration(wkhtmltopdf=wkpath)
            pdf = pdfkit.from_string(html, False, options=options, configuration=config)
        else:
            pdf = pdfkit.from_string(html, False, options=options)
    except Exception as e:
        print(f"[PDF] generation failed: {e}")
        # Try WeasyPrint fallback (produces selectable text PDF)
        try:
            from weasyprint import HTML, CSS
            print('[PDF] Falling back to WeasyPrint')
            pdf = HTML(string=html).write_pdf(stylesheets=[CSS(string='@page { size: A4; margin: 10mm; }')])
        except Exception as e2:
            print(f"[PDF] WeasyPrint fallback failed: {e2}")
            # Try headless Chromium via pyppeteer as a robust fallback
            try:
                import asyncio
                from pyppeteer import launch

                async def _pdf_from_html_pypp(html_str):
                    browser = await launch(args=['--no-sandbox'])
                    page = await browser.newPage()
                    await page.setContent(html_str, waitUntil='networkidle0')
                    pdf_bytes = await page.pdf({'format': 'A4', 'printBackground': True,
                                                'margin': {'top': '10mm', 'bottom': '10mm', 'left': '10mm', 'right': '10mm'}})
                    await browser.close()
                    return pdf_bytes

                loop = asyncio.new_event_loop()
                asyncio.set_event_loop(loop)
                pdf = loop.run_until_complete(_pdf_from_html_pypp(html))
                try:
                    loop.close()
                except Exception:
                    pass
            except Exception as e3:
                print(f"[PDF] pyppeteer fallback failed: {e3}")
                pyppeteer_error = str(e3)

            # As a final attempt, try headless Chrome/Chromium CLI (print-to-pdf)
            try:
                import tempfile, os, subprocess
                chrome_candidates = [
                    r"C:\Program Files\Google\Chrome\Application\chrome.exe",
                    r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
                    r"C:\Program Files\Chromium\Application\chrome.exe",
                ]
                chrome_bin = None
                for p in chrome_candidates:
                    if os.path.exists(p):
                        chrome_bin = p
                        break
                if not chrome_bin:
                    raise RuntimeError('No Chrome/Chromium binary found')

                with tempfile.TemporaryDirectory() as tmpdir:
                    html_file = os.path.join(tmpdir, 'page.html')
                    pdf_file = os.path.join(tmpdir, 'out.pdf')
                    with open(html_file, 'w', encoding='utf-8') as fh:
                        fh.write(html)
                    cmd = [chrome_bin, '--headless', '--disable-gpu', f'--print-to-pdf={pdf_file}', html_file]
                    proc = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=30)
                    if proc.returncode != 0 or not os.path.exists(pdf_file):
                        raise RuntimeError(f'Chrome PDF failed: rc={proc.returncode} stderr={proc.stderr.decode(errors="ignore")}')
                    with open(pdf_file, 'rb') as fh:
                        pdf = fh.read()
            except Exception as e4:
                print(f"[PDF] Chrome CLI fallback failed: {e4}")
                from flask import current_app
                if current_app.debug:
                    return jsonify({'error': 'PDF generation failed on server (all renderers failed)', 'detail': str(e4)}), 500
                return jsonify({'error': 'PDF generation failed on server (all renderers failed)'}), 500

    response = make_response(pdf)
    response.headers['Content-Type'] = 'application/pdf'
    filename = f"RankVeda_Scorecard_{res.roll_number or res.id}.pdf"
    response.headers['Content-Disposition'] = f'attachment; filename="{filename}"'
    return response


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
