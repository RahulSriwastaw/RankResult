from flask import Blueprint, request, jsonify
from db.models import db, ExamResult, QuestionResponse, MasterQuestion
from services.scraper import fetch_html, parse_result_html, truncate_float
from sqlalchemy.exc import IntegrityError
from datetime import datetime
import uuid
import re
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
            parsed = parse_result_html(html, base_url=url if url.startswith('http') else None)
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
                parser_version=parsed.get('parser_version', 'rankresult-parser-v1.0'),
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
                if not mq.question_id_html and q_id_html:
                    mq.question_id_html = q_id_html
                if not mq.option_a_id and q.get('option_a_id'):
                    mq.option_a_id = q.get('option_a_id')
                if not mq.option_b_id and q.get('option_b_id'):
                    mq.option_b_id = q.get('option_b_id')
                if not mq.option_c_id and q.get('option_c_id'):
                    mq.option_c_id = q.get('option_c_id')
                if not mq.option_d_id and q.get('option_d_id'):
                    mq.option_d_id = q.get('option_d_id')
                if not mq.correct_option_text and q.get('correct_option_text'):
                    mq.correct_option_text = q.get('correct_option_text')

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

            # Check if this roll_number already contributed to this MasterQuestion's stats
            existing_response = QuestionResponse.query.join(ExamResult).filter(
                QuestionResponse.master_question_id == mq.id,
                ExamResult.roll_number == new_result.roll_number
            ).first()

            if not existing_response:
                status = q.get('status', 'unattempted')
                if status == 'correct':
                    mq.correct_count = (mq.correct_count or 0) + 1
                elif status == 'wrong':
                    mq.wrong_count = (mq.wrong_count or 0) + 1
                else:
                    mq.unattempted_count = (mq.unattempted_count or 0) + 1
                mq.update_difficulty()

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
    filename = f"RankResult_Scorecard_{res.roll_number or res.id}.pdf"
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


# ── PDF Parse and Upload Endpoint ─────────────────────────────────────────────

def parse_pdf_text(text):
    result = {
        'candidate_name': None,
        'registration_number': None,
        'roll_number': None,
        'community': None,
        'test_centre_name': None,
        'test_date': None,
        'test_time': None,
        'subject': None,
        'questions': []
    }

    # ── Candidate Info ────────────────────────────────────────────────────────
    # PDF format: "Registration Number T82401 1 13424" (space in reg number, no colon)
    # We take just the first token after "Registration Number"
    reg_match = re.search(r"Registration\s+Number\s*:?\s*(\S+)", text, re.I)
    if reg_match:
        result['registration_number'] = reg_match.group(1)

    roll_match = re.search(r"Roll\s+Number\s*:?\s*(\S+)", text, re.I)
    if roll_match:
        result['roll_number'] = roll_match.group(1)

    name_match = re.search(r"Candidate\s+Name\s*:?\s*(.+?)(?=\n|Community|Registration|$)", text, re.I)
    if name_match:
        result['candidate_name'] = ' '.join(name_match.group(1).strip().split())

    comm_match = re.search(r"Community\s*:?\s*(\S+)", text, re.I)
    if comm_match:
        result['community'] = comm_match.group(1).strip()

    # "T est Center Name" — PDF splits "Test" into "T est"
    center_match = re.search(r"T\s*est\s+C\s*ent(?:er|re)\s+Name\s*:?\s*(.+?)(?=\n|T\s*est\s+Date|$)", text, re.I)
    if center_match:
        result['test_centre_name'] = ' '.join(center_match.group(1).strip().split())

    # "T est Date 05/12/2025"
    date_match = re.search(r"T\s*est\s+Date\s*:?\s*(\d{1,2}/\d{1,2}/\d{4})", text, re.I)
    if date_match:
        result['test_date'] = date_match.group(1).strip()

    # "T est T ime 4:30 PM - 6:00 PM"
    time_match = re.search(r"T\s*est\s+T\s*ime\s*:?\s*(.+?)(?=\n|Subject|$)", text, re.I)
    if time_match:
        result['test_time'] = ' '.join(time_match.group(1).strip().split())

    sub_match = re.search(r"Subject\s*:?\s*(.+?)(?=\n|Application|$)", text, re.I)
    if sub_match:
        result['subject'] = ' '.join(sub_match.group(1).strip().split())

    # ── Questions ─────────────────────────────────────────────────────────────
    # Split on "Question ID :" — each segment starts with the ID digits
    segments = re.split(r"Question\s+ID\s*:\s*", text, flags=re.I)
    for idx, seg in enumerate(segments[1:]):
        # Question ID may have spaces injected by PDF renderer, e.g. "441009370651 1"
        # Grab digits (with possible spaces) at the start and collapse them
        q_id_match = re.match(r"^([\d\s]+)", seg)
        if not q_id_match:
            continue
        q_id = re.sub(r'\s+', '', q_id_match.group(1)).strip()
        if not q_id:
            continue

        # Option IDs — also may contain spaces inside the digit string
        def _get_opt_id(label, segment):
            m = re.search(rf"Option\s+{label}\s+ID\s*:\s*([\d\s]+)", segment, re.I)
            if m:
                return re.sub(r'\s+', '', m.group(1)).strip()
            return None

        opt1 = _get_opt_id('1', seg)
        opt2 = _get_opt_id('2', seg)
        opt3 = _get_opt_id('3', seg)
        opt4 = _get_opt_id('4', seg)

        # Chosen Option: "A", "B", "C", "D", or "--" (not answered)
        chosen_m = re.search(r"Chosen\s+Option\s*:\s*([A-D\-]+)", seg, re.I)
        chosen_raw = chosen_m.group(1).strip() if chosen_m else None
        chosen = None if (not chosen_raw or chosen_raw == '--') else chosen_raw.upper()

        # Status
        status_m = re.search(r"Status\s*:\s*([^\r\n]+)", seg, re.I)
        status_str = status_m.group(1).strip() if status_m else ''

        q_data = {
            'question_no': idx + 1,
            'question_id_html': q_id,
            'option_a_id': opt1,
            'option_b_id': opt2,
            'option_c_id': opt3,
            'option_d_id': opt4,
            'chosen_option': chosen,
            'status': status_str,
        }
        result['questions'].append(q_data)

    return result


@results_bp.route('/upload-pdf', methods=['POST'])
def upload_pdf_result():
    from routes.auth import get_current_user
    current_user = get_current_user()
    unlocked_mq_ids = set()
    if current_user:
        from db.models import UserUnlockedQuestion
        unlocked = UserUnlockedQuestion.query.filter_by(user_id=current_user.id).all()
        unlocked_mq_ids = {u.master_question_id for u in unlocked}

    if 'file' not in request.files:
        return jsonify({'error': 'No file uploaded'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400
        
    try:
        exam_id = int(request.form.get('exam_id', 1))
    except (ValueError, TypeError):
        exam_id = 1

    if not file.filename.lower().endswith('.pdf'):
        return jsonify({'error': 'Only PDF files are supported'}), 400

    try:
        from pypdf import PdfReader
        reader = PdfReader(file)
        full_text = ""
        for page in reader.pages:
            page_text = page.extract_text()
            if page_text:
                full_text += page_text + "\n"
        
        if not full_text.strip():
            return jsonify({'error': 'The uploaded PDF is empty or contains only scanned images. Only text-searchable PDFs printed from the candidate portal are supported.'}), 400
            
        print(f"[API PDF] Extracted {len(full_text)} characters.")
        
        parsed_data = parse_pdf_text(full_text)
        
        if not parsed_data['questions']:
            return jsonify({'error': 'No questions could be parsed from the PDF. Make sure the PDF is printed from a supported candidate response sheet (TCS iON).'}), 400

        print(f"[API PDF] Parsed {len(parsed_data['questions'])} questions.")
        
        matched_questions = []
        correct_count = 0
        wrong_count = 0
        unattempted_count = 0
        
        current_shift = {
            'exam_id': exam_id,
            'test_date': parsed_data.get('test_date') or '',
            'test_time': parsed_data.get('test_time') or '',
            'subject': parsed_data.get('subject') or '',
        }
        
        for q in parsed_data['questions']:
            q_id = q['question_id_html']
            chosen_opt = q['chosen_option']
            status_str = q['status'] or ''
            
            mq = MasterQuestion.query.filter_by(question_id_html=q_id).first()
            
            chosen_val = None
            # chosen_opt is now None (unattempted) or "A"/"B"/"C"/"D" (answered)
            if chosen_opt and chosen_opt in ['A', 'B', 'C', 'D']:
                chosen_val = str(ord(chosen_opt) - ord('A') + 1)  # A→1, B→2, C→3, D→4

            correct_val = None
            q_text = "Question " + str(q['question_no'])
            opt_a_text = "Option A"
            opt_b_text = "Option B"
            opt_c_text = "Option C"
            opt_d_text = "Option D"

            if mq:
                correct_val = mq.correct_answer
                # Normalize correct_answer A/B/C/D → 1/2/3/4
                if correct_val and correct_val.upper() in ['A', 'B', 'C', 'D']:
                    correct_val = str(ord(correct_val.upper()) - ord('A') + 1)

                q_text = mq.question_text or q_text
                opt_a_text = mq.option_a_text or opt_a_text
                opt_b_text = mq.option_b_text or opt_b_text
                opt_c_text = mq.option_c_text or opt_c_text
                opt_d_text = mq.option_d_text or opt_d_text

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

            is_correct = False
            is_wrong = False

            if chosen_val:  # candidate answered this question
                if correct_val:
                    if chosen_val == correct_val:
                        is_correct = True
                        correct_count += 1
                    else:
                        is_wrong = True
                        wrong_count += 1
                else:
                    # Answer unknown (stub MQ) — treat as unattempted for scoring
                    unattempted_count += 1
            else:
                unattempted_count += 1

            marks_awarded = 0.0
            if is_correct:
                marks_awarded = 1.0
            elif is_wrong:
                marks_awarded = truncate_float(-1/3, 3)

            q_res = {
                'question_no': q['question_no'],
                'question_id_html': q_id,
                'question_text': q_text,
                'option_a_text': opt_a_text,
                'option_b_text': opt_b_text,
                'option_c_text': opt_c_text,
                'option_d_text': opt_d_text,
                'option_a_id': q['option_a_id'],
                'option_b_id': q['option_b_id'],
                'option_c_id': q['option_c_id'],
                'option_d_id': q['option_d_id'],
                'correct_answer': correct_val,
                'student_answer': chosen_val,
                'marks_awarded': marks_awarded,
                'status': 'correct' if is_correct else 'wrong' if is_wrong else 'unattempted',
                'master_question_id': mq.id if mq else None
            }
            matched_questions.append(q_res)

        score = truncate_float(float(correct_count) - (float(wrong_count) / 3.0), 3)

        roll_number = parsed_data.get('roll_number')
        registration_number = parsed_data.get('registration_number')
        
        existing_result = None
        if roll_number:
            existing_result = ExamResult.query.filter_by(exam_id=exam_id, roll_number=roll_number).first()
        elif registration_number:
            existing_result = ExamResult.query.filter_by(exam_id=exam_id, registration_number=registration_number).first()

        if existing_result:
            QuestionResponse.query.filter_by(result_id=existing_result.id).delete()
            res_obj = existing_result
        else:
            res_obj = ExamResult(
                exam_id=exam_id,
                roll_number=roll_number,
                registration_number=registration_number,
                candidate_name=parsed_data.get('candidate_name') or 'Candidate ' + str(uuid.uuid4())[:8],
                community=parsed_data.get('community') or 'UR',
                test_centre_name=parsed_data.get('test_centre_name') or '',
                test_date=parsed_data.get('test_date') or '',
                test_time=parsed_data.get('test_time') or '',
                subject=parsed_data.get('subject') or '',
                parser_version='rankresult-pdf-parser-v1.0',
                parsed_at=datetime.utcnow(),
                score=score,
                total_correct=correct_count,
                total_wrong=wrong_count,
                total_unattempted=unattempted_count,
                source_html='[PDF Uploaded Text Content]',
                candidate_payload={}
            )
            db.session.add(res_obj)
            db.session.flush()

        res_obj.score = score
        res_obj.total_correct = correct_count
        res_obj.total_wrong = wrong_count
        res_obj.total_unattempted = unattempted_count
        res_obj.parsed_at = datetime.utcnow()
        res_obj.source_html = "[PDF Uploaded Text Content]"

        # QuestionResponse model links to MasterQuestion — ensure every parsed question
        # has a MasterQuestion row (create a stub for unknown questions).
        for idx, mq_data in enumerate(matched_questions):
            mq = None
            if mq_data['master_question_id']:
                mq = MasterQuestion.query.get(mq_data['master_question_id'])

            if mq is None:
                # Create a stub MasterQuestion so the FK constraint is satisfied
                q_id = mq_data['question_id_html']
                stub_hash = MasterQuestion.generate_hash(
                    mq_data.get('question_text', '') or f'PDF-Q{mq_data["question_no"]}',
                    q_id
                )
                # Check one more time by hash to avoid duplicates
                mq = MasterQuestion.query.filter_by(question_hash=stub_hash).first()
                if mq is None:
                    mq = MasterQuestion(
                        question_id_html=q_id,
                        question_hash=stub_hash,
                        question_text=mq_data.get('question_text') or f'PDF Question {mq_data["question_no"]}',
                        correct_answer=mq_data.get('correct_answer'),
                        option_a_id=mq_data.get('option_a_id'),
                        option_b_id=mq_data.get('option_b_id'),
                        option_c_id=mq_data.get('option_c_id'),
                        option_d_id=mq_data.get('option_d_id'),
                        reference_count=1,
                        shift_count=1,
                        shifts=[current_shift],
                        parsed_payload={},
                    )
                    db.session.add(mq)
                    db.session.flush()  # get mq.id

            # Determine student_option_id (the chosen option ID string)
            chosen_val = mq_data.get('student_answer')
            student_opt_id = None
            if chosen_val == '1':
                student_opt_id = mq_data.get('option_a_id')
            elif chosen_val == '2':
                student_opt_id = mq_data.get('option_b_id')
            elif chosen_val == '3':
                student_opt_id = mq_data.get('option_c_id')
            elif chosen_val == '4':
                student_opt_id = mq_data.get('option_d_id')

            qr = QuestionResponse(
                result_id=res_obj.id,
                question_no=mq_data['question_no'],
                master_question_id=mq.id,
                option_id=student_opt_id,
                student_answer=mq_data.get('student_answer'),
                marks_awarded=mq_data.get('marks_awarded', 0),
                status=mq_data.get('status', 'unattempted'),
            )
            db.session.add(qr)

        db.session.commit()

        db_questions = QuestionResponse.query.filter_by(result_id=res_obj.id).order_by(QuestionResponse.question_no).all()
        return jsonify({
            'success': True,
            'result': res_obj.to_dict(),
            'questions': [q.to_dict(unlocked_mq_ids) for q in db_questions]
        })

    except Exception as e:
        db.session.rollback()
        import traceback
        traceback.print_exc()
        return jsonify({'error': f'PDF Parsing Error: {str(e)}'}), 500


@results_bp.route('/<int:result_id>', methods=['GET'])
def get_result_by_id(result_id):
    from routes.auth import get_current_user
    current_user = get_current_user()
    unlocked_mq_ids = set()
    if current_user:
        from db.models import UserUnlockedQuestion
        unlocked = UserUnlockedQuestion.query.filter_by(user_id=current_user.id).all()
        unlocked_mq_ids = {u.master_question_id for u in unlocked}

    res_obj = ExamResult.query.get_or_404(result_id)
    questions = (
        QuestionResponse.query
        .filter_by(result_id=res_obj.id)
        .order_by(QuestionResponse.question_no)
        .all()
    )
    return jsonify({
        'result': res_obj.to_dict(),
        'questions': [q.to_dict(unlocked_mq_ids) for q in questions]
    })


