from flask import Blueprint, request, jsonify, render_template, make_response, current_app
from db.models import db, Exam, MasterQuestion, QuestionResponse, ExamResult
from routes.auth import get_current_user
from routes.marketplace import has_exam_questions_access
import csv
import io
import os
import re
import traceback
import pdfkit

export_bp = Blueprint('export', __name__, url_prefix='/api/export')

@export_bp.route('/questions/csv', methods=['POST'])
def export_questions_csv():
    try:
        current_user = get_current_user()
        if not current_user:
            return jsonify({'error': 'Please login first'}), 401

        data = request.get_json() or {}
        exam_id = data.get('examId')
        filters = data.get('filters') or {}
        columns = data.get('columns')

        if not exam_id:
            return jsonify({'error': 'examId is required'}), 400

        # Check purchase/access
        if not has_exam_questions_access(current_user.id, exam_id):
            return jsonify({'error': 'Access denied. You have not purchased access to this exam.'}), 403

        exam = Exam.query.get_or_404(exam_id)

        # Filters
        search = (filters.get('search') or '').strip()
        subject = (filters.get('subject') or '').strip()
        chapter = (filters.get('chapter') or '').strip()
        difficulty = (filters.get('difficulty') or '').strip()
        question_type = (filters.get('question_type') or '').strip()
        shift_date = (filters.get('shift_date') or '').strip()
        shift_time = (filters.get('shift_time') or '').strip()
        language = (filters.get('language') or 'both').strip().lower()

        query = MasterQuestion.query
        if search:
            pattern = f'%{search}%'
            query = query.filter(
                db.or_(
                    MasterQuestion.question_text.ilike(pattern),
                    MasterQuestion.question_text_hin.ilike(pattern),
                    MasterQuestion.question_text_eng.ilike(pattern),
                    MasterQuestion.subject.ilike(pattern),
                    MasterQuestion.chapter.ilike(pattern),
                )
            )
        if subject:
            query = query.filter(MasterQuestion.subject.ilike(f"%{subject}%"))
        if chapter:
            query = query.filter(MasterQuestion.chapter.ilike(f"%{chapter}%"))
        if difficulty:
            query = query.filter(MasterQuestion.difficulty.ilike(f"%{difficulty}%"))
        if question_type:
            query = query.filter(MasterQuestion.question_type.ilike(f"%{question_type}%"))

        all_mqs = query.all()
        matched_items = []
        for mq in all_mqs:
            matched_shifts = []
            for s in (mq.shifts or []):
                if not s:
                    continue
                if str(s.get('exam_id')) != str(exam_id):
                    continue
                if shift_date and s.get('test_date') != shift_date:
                    continue
                if shift_time and s.get('test_time') != shift_time:
                    continue
                matched_shifts.append(s)
            if matched_shifts:
                matched_items.append((mq, matched_shifts[0]))

        # Sort sequentially
        matched_items.sort(key=lambda item: int(item[1].get('question_no') or item[0].id))

        si = io.StringIO()
        writer = csv.writer(si)

        default_columns = [
            'question_id', 'question_number', 'exam_name', 'subject', 'topic', 'chapter',
            'question_type', 'difficulty_label', 'question_text', 'option_a', 'option_b',
            'option_c', 'option_d', 'correct_option', 'solution_text', 'shift_date',
            'shift_time', 'correct_percent', 'wrong_percent'
        ]
        target_columns = columns if columns else default_columns

        writer.writerow(target_columns)

        def clean_html(raw_html):
            if not raw_html:
                return ""
            return re.sub(r'<.*?>', '', raw_html).strip()

        for mq, s in matched_items:
            total = (mq.correct_count or 0) + (mq.wrong_count or 0) + (mq.unattempted_count or 0)
            correct_percent = (mq.correct_count or 0) / total * 100 if total > 0 else 0.0
            wrong_percent = (mq.wrong_count or 0) / total * 100 if total > 0 else 0.0

            q_text = mq.question_text
            opt_a = mq.option_a_text
            opt_b = mq.option_b_text
            opt_c = mq.option_c_text
            opt_d = mq.option_d_text
            sol = mq.solution_eng or mq.solution_hin or ""

            if language == 'hi':
                q_text = mq.question_text_hin or mq.question_text
                opt_a = mq.option_a_hin or mq.option_a_text
                opt_b = mq.option_b_hin or mq.option_b_text
                opt_c = mq.option_c_hin or mq.option_c_text
                opt_d = mq.option_d_hin or mq.option_d_text
                sol = mq.solution_hin or ""
            elif language == 'en':
                q_text = mq.question_text_eng or mq.question_text
                opt_a = mq.option_a_eng or mq.option_a_text
                opt_b = mq.option_b_eng or mq.option_b_text
                opt_c = mq.option_c_eng or mq.option_c_text
                opt_d = mq.option_d_eng or mq.option_d_text
                sol = mq.solution_eng or ""

            row_data = []
            for col in target_columns:
                if col == 'question_id':
                    row_data.append(str(mq.id))
                elif col == 'question_number':
                    row_data.append(str(s.get('question_no') or ''))
                elif col == 'exam_name':
                    row_data.append(exam.name)
                elif col == 'subject':
                    row_data.append(mq.subject or s.get('subject') or '')
                elif col == 'topic':
                    row_data.append(mq.chapter or '')
                elif col == 'chapter':
                    row_data.append(mq.chapter or '')
                elif col == 'question_type':
                    row_data.append(mq.question_type or 'MCQ')
                elif col == 'difficulty_label':
                    row_data.append(mq.difficulty or 'Medium')
                elif col == 'question_text':
                    row_data.append(clean_html(q_text))
                elif col == 'question_html_raw':
                    row_data.append(q_text)
                elif col == 'option_a':
                    row_data.append(clean_html(opt_a))
                elif col == 'option_b':
                    row_data.append(clean_html(opt_b))
                elif col == 'option_c':
                    row_data.append(clean_html(opt_c))
                elif col == 'option_d':
                    row_data.append(clean_html(opt_d))
                elif col == 'correct_option':
                    row_data.append(mq.correct_answer or '')
                elif col == 'solution_text':
                    row_data.append(clean_html(sol))
                elif col == 'shift_date':
                    row_data.append(s.get('test_date') or '')
                elif col == 'shift_time':
                    row_data.append(s.get('test_time') or '')
                elif col == 'correct_percent':
                    row_data.append(f"{correct_percent:.1f}%")
                elif col == 'wrong_percent':
                    row_data.append(f"{wrong_percent:.1f}%")
                else:
                    row_data.append('')
            writer.writerow(row_data)

        output = make_response(si.getvalue())
        output.headers["Content-Disposition"] = f"attachment; filename={exam.name.replace(' ', '_')}_questions.csv"
        output.headers["Content-type"] = "text/csv"
        return output
    except Exception as e:
        print(traceback.format_exc())
        return jsonify({'error': str(e)}), 500

@export_bp.route('/questions/pdf', methods=['POST'])
def export_questions_pdf():
    try:
        current_user = get_current_user()
        if not current_user:
            return jsonify({'error': 'Please login first'}), 401

        data = request.get_json() or {}
        exam_id = data.get('examId')
        filters = data.get('filters') or {}
        sort_order = data.get('sortOrder') or 'sequential'
        show_correct = data.get('showCorrectHighlight', True)
        show_stats = data.get('showStatsBar', True)
        show_solution = data.get('showSolution', True)
        language = data.get('language') or 'both'
        question_limit = data.get('questionLimit')
        brand_name = data.get('brandName') or ''

        if not exam_id:
            return jsonify({'error': 'examId is required'}), 400

        # Check purchase/access
        if not has_exam_questions_access(current_user.id, exam_id):
            return jsonify({'error': 'Access denied. You have not purchased access to this exam.'}), 403

        exam = Exam.query.get_or_404(exam_id)

        # Filters query
        search = (filters.get('search') or '').strip()
        subject = (filters.get('subject') or '').strip()
        chapter = (filters.get('chapter') or '').strip()
        difficulty = (filters.get('difficulty') or '').strip()
        question_type = (filters.get('question_type') or '').strip()
        shift_date = (filters.get('shift_date') or '').strip()
        shift_time = (filters.get('shift_time') or '').strip()

        query = MasterQuestion.query
        if search:
            pattern = f'%{search}%'
            query = query.filter(
                db.or_(
                    MasterQuestion.question_text.ilike(pattern),
                    MasterQuestion.question_text_hin.ilike(pattern),
                    MasterQuestion.question_text_eng.ilike(pattern),
                    MasterQuestion.subject.ilike(pattern),
                    MasterQuestion.chapter.ilike(pattern),
                )
            )
        if subject:
            query = query.filter(MasterQuestion.subject.ilike(f"%{subject}%"))
        if chapter:
            query = query.filter(MasterQuestion.chapter.ilike(f"%{chapter}%"))
        if difficulty:
            query = query.filter(MasterQuestion.difficulty.ilike(f"%{difficulty}%"))
        if question_type:
            query = query.filter(MasterQuestion.question_type.ilike(f"%{question_type}%"))

        all_mqs = query.all()
        matched_items = []
        for mq in all_mqs:
            matched_shifts = []
            for s in (mq.shifts or []):
                if not s:
                    continue
                if str(s.get('exam_id')) != str(exam_id):
                    continue
                if shift_date and s.get('test_date') != shift_date:
                    continue
                if shift_time and s.get('test_time') != shift_time:
                    continue
                matched_shifts.append(s)
            if matched_shifts:
                matched_items.append((mq, matched_shifts[0]))

        # Calculate statistics & prepare objects
        questions_data = []
        for mq, s in matched_items:
            total = (mq.correct_count or 0) + (mq.wrong_count or 0) + (mq.unattempted_count or 0)
            correct_percent = (mq.correct_count or 0) / total * 100 if total > 0 else 0.0
            wrong_percent = (mq.wrong_count or 0) / total * 100 if total > 0 else 0.0

            questions_data.append({
                'id': mq.id,
                'question_text_hin': mq.question_text_hin or mq.question_text or '',
                'question_text_eng': mq.question_text_eng or mq.question_text or '',
                'option_a_hin': mq.option_a_hin or mq.option_a_text or '',
                'option_b_hin': mq.option_b_hin or mq.option_b_text or '',
                'option_c_hin': mq.option_c_hin or mq.option_c_text or '',
                'option_d_hin': mq.option_d_hin or mq.option_d_text or '',
                'option_a_eng': mq.option_a_eng or mq.option_a_text or '',
                'option_b_eng': mq.option_b_eng or mq.option_b_text or '',
                'option_c_eng': mq.option_c_eng or mq.option_c_text or '',
                'option_d_eng': mq.option_d_eng or mq.option_d_text or '',
                'correct_option': mq.correct_answer or 'A',
                'solution_text': mq.solution_hin or mq.solution_eng or '',
                'solution_hin': mq.solution_hin or '',
                'solution_eng': mq.solution_eng or '',
                'shift_date': s.get('test_date') or '',
                'shift_time': s.get('test_time') or '',
                'correct_percent': round(correct_percent, 1),
                'wrong_percent': round(wrong_percent, 1),
                'question_no': int(s.get('question_no') or mq.id)
            })

        # Apply Sort Order
        sort_order_label = 'Sequential Order'
        if sort_order == 'hard_to_easy':
            questions_data.sort(key=lambda x: x['correct_percent'])
            sort_order_label = 'Hard To Easy Order'
        elif sort_order == 'easy_to_hard':
            questions_data.sort(key=lambda x: x['correct_percent'], reverse=True)
            sort_order_label = 'Easy To Hard Order'
        else:
            questions_data.sort(key=lambda x: x['question_no'])

        # Limit count
        if question_limit and isinstance(question_limit, int) and question_limit > 0:
            questions_data = questions_data[:question_limit]

        # Add index numbers
        for idx, q in enumerate(questions_data):
            q['index'] = idx + 1

        # Render HTML template
        html = render_template(
            'exam_questions_pdf.html',
            exam=exam,
            questions=questions_data,
            language=language,
            show_correct=show_correct,
            show_stats=show_stats,
            show_solution=show_solution,
            brand_name=brand_name,
            sort_order_label=sort_order_label
        )

        # PDF options
        options = {
            'encoding': 'UTF-8',
            'page-size': 'A4',
            'margin-top': '10mm',
            'margin-bottom': '10mm',
            'margin-left': '10mm',
            'margin-right': '10mm',
            'enable-local-file-access': None,
        }

        # Multi-engine PDF pipeline exactly matching results.py
        pdf = None
        wkpath = os.environ.get('WKHTMLTOPDF_PATH')
        if not wkpath and os.name == 'nt':
            possible = [
                r"C:\Program Files\wkhtmltopdf\bin\wkhtmltopdf.exe",
                r"C:\Program Files (x86)\wkhtmltopdf\bin\wkhtmltopdf.exe"
            ]
            for p in possible:
                if os.path.exists(p):
                    wkpath = p
                    break
        try:
            if wkpath:
                config = pdfkit.configuration(wkhtmltopdf=wkpath)
                pdf = pdfkit.from_string(html, False, options=options, configuration=config)
            else:
                pdf = pdfkit.from_string(html, False, options=options)
        except Exception as e:
            print(f"[Export PDF] pdfkit failed: {e}")
            # Try WeasyPrint fallback
            try:
                from weasyprint import HTML, CSS
                print('[Export PDF] Falling back to WeasyPrint')
                pdf = HTML(string=html).write_pdf(stylesheets=[CSS(string='@page { size: A4; margin: 10mm; }')])
            except Exception as e2:
                print(f"[Export PDF] WeasyPrint fallback failed: {e2}")
                # Try pyppeteer fallback
                try:
                    import asyncio
                    from pyppeteer import launch

                    async def _pdf_from_html_pypp(html_str):
                        browser = await launch(args=['--no-sandbox'])
                        page = await browser.newPage()
                        await page.setContent(html_str, options={'waitUntil': 'networkidle0'})
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
                    print(f"[Export PDF] pyppeteer fallback failed: {e3}")
                    # Try Chrome CLI fallback
                    try:
                        import tempfile, subprocess
                        chrome_candidates = [
                            r"C:\Program Files\Google\Chrome\Application\chrome.exe",
                            r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
                            r"C:\Program Files\Chromium\Application\chrome.exe",
                            r"/usr/bin/google-chrome",
                            r"/usr/bin/chromium-browser"
                        ]
                        chrome_bin = None
                        for p in chrome_candidates:
                            if os.path.exists(p):
                                chrome_bin = p
                                break
                        if not chrome_bin:
                            raise RuntimeError('No Chrome/Chromium binary found')

                        import uuid
                        unique_id = uuid.uuid4().hex
                        html_file = os.path.join(os.getcwd(), f'temp_{unique_id}.html')
                        pdf_file = os.path.join(os.getcwd(), f'temp_{unique_id}.pdf')
                        try:
                            with open(html_file, 'w', encoding='utf-8') as fh:
                                fh.write(html)
                            cmd = [chrome_bin, '--headless', '--disable-gpu', '--no-sandbox', f'--print-to-pdf={pdf_file}', html_file]
                            proc = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=30)
                            if proc.returncode != 0 or not os.path.exists(pdf_file):
                                stderr_msg = proc.stderr.decode(errors='ignore') if proc.stderr else ""
                                raise RuntimeError(f'Chrome PDF failed: rc={proc.returncode} {stderr_msg}')
                            with open(pdf_file, 'rb') as fh:
                                pdf = fh.read()
                        finally:
                            if os.path.exists(html_file):
                                os.remove(html_file)
                            if os.path.exists(pdf_file):
                                os.remove(pdf_file)
                    except Exception as e4:
                        print(f"[Export PDF] Chrome CLI fallback failed: {e4}")
                        return jsonify({'error': 'PDF generation failed on server', 'detail': str(e4)}), 500

        response = make_response(pdf)
        response.headers['Content-Type'] = 'application/pdf'
        response.headers['Content-Disposition'] = f"attachment; filename={exam.name.replace(' ', '_')}_questions.pdf"
        return response
    except Exception as e:
        print(traceback.format_exc())
        return jsonify({'error': str(e)}), 500
