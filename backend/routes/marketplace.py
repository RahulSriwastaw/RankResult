from flask import Blueprint, request, jsonify, current_app
from db.models import db, MasterQuestion, Exam, AISolution, ExamPurchase, UserPoints, PointsTransaction, QuestionPack, QuestionResponse, ExamResult, QuestionPackPurchase, PointsPack
from routes.auth import get_current_user
from sqlalchemy import func, desc, or_
from services.marketplace_service import purchase_question_pack
import traceback

marketplace_bp = Blueprint('marketplace', __name__, url_prefix='/api/marketplace')

SOLUTION_COST = 10  # points per question solution

def has_exam_questions_access(user_id, exam_id):
    if not user_id:
        return False
    # Direct purchase
    direct = ExamPurchase.query.filter_by(user_id=user_id, exam_id=exam_id).first()
    if direct:
        return True
    # Pack purchase
    pack_purchases = QuestionPackPurchase.query.filter_by(user_id=user_id).all()
    for p in pack_purchases:
        pack = QuestionPack.query.get(p.pack_id)
        if not pack or not pack.is_active:
            continue
        for item in (pack.exam_ids or []):
            if isinstance(item, dict):
                if str(item.get('exam_id')) == str(exam_id) and item.get('include_questions', True):
                    return True
            elif str(item) == str(exam_id):
                return True
    return False

def has_exam_results_access(user_id, exam_id):
    if not user_id:
        return False
    pack_purchases = QuestionPackPurchase.query.filter_by(user_id=user_id).all()
    for p in pack_purchases:
        pack = QuestionPack.query.get(p.pack_id)
        if not pack or not pack.is_active:
            continue
        for item in (pack.exam_ids or []):
            if isinstance(item, dict):
                if str(item.get('exam_id')) == str(exam_id) and item.get('include_results', True):
                    return True
            elif str(item) == str(exam_id):
                return True
    return False


# ── List all Exams in Marketplace ─────────────────────────────────────────────

@marketplace_bp.route('/packs', methods=['GET'])
def list_marketplace_packs():
    try:
        current_user = get_current_user()
        packs = QuestionPack.query.filter_by(is_active=True).order_by(desc(QuestionPack.created_at)).all()
        result = []
        seen_ids = set()
        for pack in packs:
            if pack.id in seen_ids:
                continue
            seen_ids.add(pack.id)
            purchased = False
            if current_user:
                purchased = QuestionPackPurchase.query.filter_by(
                    user_id=current_user.id, pack_id=pack.id
                ).first() is not None

            raw_exam_ids = pack.exam_ids or []
            exam_ids = []
            for item in raw_exam_ids:
                if isinstance(item, dict):
                    exam_ids.append(item.get('exam_id'))
                else:
                    exam_ids.append(item)
            exam_ids = [int(x) for x in exam_ids if x is not None]

            # Bundles must contain multiple exams
            if len(exam_ids) <= 1:
                continue

            student_count = 0
            question_count = 0
            set_count = 0
            if exam_ids:
                student_count = ExamResult.query.filter(ExamResult.exam_id.in_(exam_ids)).count()

                question_count = db.session.query(func.count(func.distinct(QuestionResponse.question_no))).join(
                    ExamResult, QuestionResponse.result_id == ExamResult.id
                ).filter(
                    ExamResult.exam_id.in_(exam_ids)
                ).scalar() or 0

                set_count = db.session.query(
                    ExamResult.test_date,
                    ExamResult.test_time
                ).filter(
                    ExamResult.exam_id.in_(exam_ids)
                ).distinct().count()

            result.append({
                'id': pack.id,
                'name': pack.name,
                'description': pack.description,
                'price': pack.price or 0,
                'exam_ids': pack.exam_ids or [],
                'purchased': purchased,
                'student_count': student_count,
                'question_count': question_count,
                'set_count': set_count,
            })
        return jsonify({'packs': result})
    except Exception as e:
        print(traceback.format_exc())
        return jsonify({'error': str(e)}), 500


@marketplace_bp.route('/exams', methods=['GET'])
def list_marketplace_exams():
    try:
        exams = Exam.query.order_by(desc(Exam.date)).all()
        current_user = get_current_user()
        all_mqs = MasterQuestion.query.all()
        all_packs = QuestionPack.query.filter_by(is_active=True).all()

        result = []
        for exam in exams:
            # Count unique question numbers parsed for this exam
            total_questions = db.session.query(QuestionResponse.question_no).join(
                ExamResult, QuestionResponse.result_id == ExamResult.id
            ).filter(
                ExamResult.exam_id == exam.id
            ).distinct().count()

            # Calculate total stored questions across all shifts of this exam
            total_stored_questions = 0
            for mq in all_mqs:
                for s in (mq.shifts or []):
                    if str(s.get('exam_id')) == str(exam.id):
                        total_stored_questions += 1

            # Get unique subjects and dates (shifts) from ExamResult
            results_info = db.session.query(
                ExamResult.subject, ExamResult.test_date, ExamResult.test_time
            ).filter(
                ExamResult.exam_id == exam.id
            ).distinct().all()

            subjects = {r[0] for r in results_info if r[0]}
            dates = {r[1] for r in results_info if r[1]}

            # Fallback to exam.total_questions if no results have been uploaded yet
            display_questions = total_stored_questions if total_stored_questions > 0 else (exam.total_questions or 100)

            # Find matching pack for this exam
            matching_pack = None
            for p in all_packs:
                p_exam_ids = []
                for item in (p.exam_ids or []):
                    if isinstance(item, dict):
                        p_exam_ids.append(int(item.get('exam_id')))
                    elif item is not None:
                        p_exam_ids.append(int(item))
                if len(p_exam_ids) == 1 and p_exam_ids[0] == exam.id:
                    matching_pack = p
                    break
            if not matching_pack:
                for p in all_packs:
                    p_exam_ids = []
                    for item in (p.exam_ids or []):
                        if isinstance(item, dict):
                            p_exam_ids.append(int(item.get('exam_id')))
                        elif item is not None:
                            p_exam_ids.append(int(item))
                    if exam.id in p_exam_ids:
                        matching_pack = p
                        break

            # Check if current user has purchased (direct or via packs)
            purchased = False
            if current_user:
                purchased = has_exam_questions_access(current_user.id, exam.id)

            # Calculate student count
            student_count = ExamResult.query.filter_by(exam_id=exam.id).count()

            result.append({
                'id': exam.id,
                'name': exam.name,
                'date': str(exam.date) if exam.date else None,
                'total_questions': display_questions,
                'price': exam.price or 0,
                'shifts': max(len(dates), 1) if results_info else 0,
                'subjects': list(subjects),
                'purchased': purchased,
                'is_purchased': purchased,
                'shift_count': max(len(dates), 1) if results_info else 0,
                'question_count': display_questions,
                'student_count': student_count,
                'pack_id': matching_pack.id if matching_pack else None,
            })

        return jsonify({'exams': result})
    except Exception as e:
        print(traceback.format_exc())
        return jsonify({'error': str(e)}), 500


# ── List all Shifts for an Exam ──────────────────────────────────────────

@marketplace_bp.route('/exams/<int:exam_id>/shifts', methods=['GET'])
def exam_shifts(exam_id):
    try:
        current_user = get_current_user()
        is_purchased = False
        if current_user:
            is_purchased = has_exam_questions_access(current_user.id, exam_id)

        exam = Exam.query.get_or_404(exam_id)
        results = ExamResult.query.filter_by(exam_id=exam_id).all()
        shifts_dict = {}
        for r in results:
            shift_key = (r.test_date, r.test_time, r.subject)
            if shift_key not in shifts_dict:
                q_count = QuestionResponse.query.filter_by(result_id=r.id).count()
                shifts_dict[shift_key] = {
                    'test_date': r.test_date,
                    'test_time': r.test_time,
                    'subject': r.subject,
                    'question_count': q_count,
                }

        shifts_list = sorted(shifts_dict.values(), key=lambda x: (x['test_date'] or '', x['test_time'] or ''))

        return jsonify({
            'exam': {'id': exam.id, 'name': exam.name, 'price': exam.price or 0},
            'shifts': shifts_list,
            'is_purchased': is_purchased,
        })
    except Exception as e:
        print(traceback.format_exc())
        return jsonify({'error': str(e)}), 500


@marketplace_bp.route('/exams/<int:exam_id>/questions', methods=['GET'])
def exam_questions(exam_id):
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        # Shift filters (required to show questions for specific shift)
        shift_date = request.args.get('shift_date', '').strip()
        shift_time = request.args.get('shift_time', '').strip()
        shift_subject = request.args.get('shift_subject', '').strip()
        search = request.args.get('search', '').strip()
        export_mode = request.args.get('export', '').strip().lower()

        current_user = get_current_user()
        is_purchased = False
        if current_user:
            is_purchased = has_exam_questions_access(current_user.id, exam_id)

        exam = Exam.query.get_or_404(exam_id)

        all_mqs = MasterQuestion.query
        if search:
            all_mqs = all_mqs.filter(MasterQuestion.question_text.ilike(f'%{search}%'))
        all_mqs = all_mqs.all()

        matched_items = []

        for mq in all_mqs:
            exam_shifts = []
            for s in (mq.shifts or []):
                # Convert to string for comparison since shifts store exam_id as string
                if str(s.get('exam_id')) == str(exam_id):
                    # Filter by specific shift if provided
                    if (shift_date and s.get('test_date') != shift_date):
                        continue
                    if (shift_time and s.get('test_time') != shift_time):
                        continue
                    if (shift_subject and s.get('subject') != shift_subject):
                        continue
                    exam_shifts.append(s)
            if exam_shifts:
                matched_items.append((mq, exam_shifts))

        matched_items.sort(key=lambda item: item[0].id)
        total = len(matched_items)
        start = (page - 1) * per_page
        page_items = matched_items[start: start + per_page]

        questions = []
        for mq, shifts in page_items:
            has_sol = AISolution.query.filter_by(master_question_id=mq.id).first() is not None
            q_data = {
                'id': mq.id,
                'question_text': mq.question_text,
                'correct_answer': mq.correct_answer if is_purchased else None,
                'correct_option_text': mq.correct_option_text if is_purchased else None,
                'option_a_text': mq.option_a_text if is_purchased else '••••',
                'option_b_text': mq.option_b_text if is_purchased else '••••',
                'option_c_text': mq.option_c_text if is_purchased else '••••',
                'option_d_text': mq.option_d_text if is_purchased else '••••',
                'reference_count': mq.reference_count,
                'shift_count': mq.shift_count,
                'shifts': shifts,
                'shift_info': shifts[0] if shifts else {},
                'has_solution': has_sol,
                'is_locked': not is_purchased,
            }
            questions.append(q_data)

        response_payload = {
            'exam': {'id': exam.id, 'name': exam.name, 'price': exam.price or 0},
            'questions': questions,
            'total': total,
            'page': page,
            'per_page': per_page,
            'pages': (total + per_page - 1) // per_page,
            'is_purchased': is_purchased,
            'shift': {
                'date': shift_date,
                'time': shift_time,
                'subject': shift_subject,
            }
        }

        if export_mode == 'csv':
            csv_lines = ['id,question_text,subject,chapter,difficulty,question_type,exam_name,date,time,correct_answer,correct_option_text,option_a_text,option_b_text,option_c_text,option_d_text']
            for q in questions:
                shift_info = q.get('shift_info') or {}
                csv_lines.append(','.join([
                    str(q['id']),
                    '"' + (q['question_text'] or '').replace('"', '""') + '"',
                    '"' + (q.get('subject') or '').replace('"', '""') + '"',
                    '"' + (q.get('chapter') or '').replace('"', '""') + '"',
                    '"' + (q.get('difficulty') or '').replace('"', '""') + '"',
                    '"' + (q.get('question_type') or '').replace('"', '""') + '"',
                    '"' + (q.get('exam_name') or '').replace('"', '""') + '"',
                    '"' + (shift_info.get('test_date') or '').replace('"', '""') + '"',
                    '"' + (shift_info.get('test_time') or '').replace('"', '""') + '"',
                    '"' + str(q.get('correct_answer') or '').replace('"', '""') + '"',
                    '"' + str(q.get('correct_option_text') or '').replace('"', '""') + '"',
                    '"' + (q.get('option_a_text') or '').replace('"', '""') + '"',
                    '"' + (q.get('option_b_text') or '').replace('"', '""') + '"',
                    '"' + (q.get('option_c_text') or '').replace('"', '""') + '"',
                    '"' + (q.get('option_d_text') or '').replace('"', '""') + '"',
                ]))
            return current_app.response_class('\n'.join(csv_lines), mimetype='text/csv', headers={'Content-Disposition': 'attachment; filename=pack_questions_export.csv'})

        return jsonify(response_payload)
    except Exception as e:
        print(traceback.format_exc())
        return jsonify({'error': str(e)}), 500


@marketplace_bp.route('/packs/<int:pack_id>/questions', methods=['GET'])
def pack_questions(pack_id):
    try:
        current_user = get_current_user()
        if not current_user:
            return jsonify({'error': 'Please login first'}), 401

        purchase = QuestionPackPurchase.query.filter_by(user_id=current_user.id, pack_id=pack_id).first()
        if not purchase:
            return jsonify({'error': 'Access denied. You have not purchased this pack.'}), 403

        pack = QuestionPack.query.get_or_404(pack_id)
        raw_exam_ids = pack.exam_ids or []
        exam_ids = []
        for item in raw_exam_ids:
            if isinstance(item, dict):
                if item.get('include_questions', True):
                    exam_ids.append(item.get('exam_id'))
            else:
                exam_ids.append(item)

        exam_ids = [int(x) for x in exam_ids if x is not None]
        if not exam_ids:
            return jsonify({'questions': [], 'total': 0, 'page': 1, 'pages': 1})

        exams = Exam.query.filter(Exam.id.in_(exam_ids)).all()
        exam_map = {e.id: e.name for e in exams}

        query = MasterQuestion.query
        search = (request.args.get('search') or '').strip()
        if search:
            pattern = f'%{search}%'
            query = query.filter(
                or_(
                    MasterQuestion.question_text.ilike(pattern),
                    MasterQuestion.question_text_hin.ilike(pattern),
                    MasterQuestion.question_text_eng.ilike(pattern),
                    MasterQuestion.subject.ilike(pattern),
                    MasterQuestion.chapter.ilike(pattern),
                )
            )

        subject = (request.args.get('subject') or '').strip()
        if subject:
            query = query.filter(MasterQuestion.subject.ilike(f"%{subject}%"))
        chapter = (request.args.get('chapter') or '').strip()
        if chapter:
            query = query.filter(MasterQuestion.chapter.ilike(f"%{chapter}%"))
        difficulty = (request.args.get('difficulty') or '').strip()
        if difficulty:
            query = query.filter(MasterQuestion.difficulty.ilike(f"%{difficulty}%"))
        question_type = (request.args.get('question_type') or '').strip()
        if question_type:
            query = query.filter(MasterQuestion.question_type.ilike(f"%{question_type}%"))

        all_mqs = query.all()
        matched_items = []
        filter_exam_id = request.args.get('exam_id', type=int)
        filter_date = (request.args.get('shift_date') or '').strip()
        filter_time = (request.args.get('shift_time') or '').strip()
        filter_shift_subject = (request.args.get('shift_subject') or '').strip()

        for mq in all_mqs:
            matched_shifts = []
            for s in (mq.shifts or []):
                if not s:
                    continue
                if str(s.get('exam_id')) not in [str(x) for x in exam_ids]:
                    continue
                if filter_exam_id and str(s.get('exam_id')) != str(filter_exam_id):
                    continue
                if filter_date and s.get('test_date') != filter_date:
                    continue
                if filter_time and s.get('test_time') != filter_time:
                    continue
                if filter_shift_subject and str(s.get('subject') or '').strip().lower() != filter_shift_subject.lower():
                    continue
                matched_shifts.append(s)

            if matched_shifts:
                matched_items.append((mq, matched_shifts))

        matched_items.sort(key=lambda item: item[0].id)
        total = len(matched_items)
        download = request.args.get('export', '').strip().lower() == 'csv'
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 50, type=int)
        start = (page - 1) * per_page
        page_items = matched_items if download else matched_items[start:start + per_page]

        questions = []
        for mq, shifts in page_items:
            shift_info = shifts[0] if shifts else {}
            questions.append({
                'id': mq.id,
                'question_text': mq.question_text,
                'subject': mq.subject,
                'chapter': mq.chapter,
                'difficulty': mq.difficulty,
                'question_type': mq.question_type,
                'correct_answer': mq.correct_answer,
                'correct_option_text': mq.correct_option_text,
                'option_a_text': mq.option_a_text,
                'option_b_text': mq.option_b_text,
                'option_c_text': mq.option_c_text,
                'option_d_text': mq.option_d_text,
                'reference_count': mq.reference_count,
                'shift_info': shift_info,
                'exam_id': shift_info.get('exam_id'),
                'exam_name': exam_map.get(int(shift_info.get('exam_id'))) if shift_info.get('exam_id') else None,
            })

        if download:
            csv_lines = ['id,question_text,subject,chapter,difficulty,question_type,exam_name,date,time,correct_answer,correct_option_text,option_a_text,option_b_text,option_c_text,option_d_text']
            for q in questions:
                shift_info = q.get('shift_info') or {}
                csv_lines.append(','.join([
                    str(q['id']),
                    '"' + (q['question_text'] or '').replace('"', '""') + '"',
                    '"' + (q.get('subject') or '').replace('"', '""') + '"',
                    '"' + (q.get('chapter') or '').replace('"', '""') + '"',
                    '"' + (q.get('difficulty') or '').replace('"', '""') + '"',
                    '"' + (q.get('question_type') or '').replace('"', '""') + '"',
                    '"' + (q.get('exam_name') or '').replace('"', '""') + '"',
                    '"' + (shift_info.get('test_date') or '').replace('"', '""') + '"',
                    '"' + (shift_info.get('test_time') or '').replace('"', '""') + '"',
                    '"' + str(q.get('correct_answer') or '').replace('"', '""') + '"',
                    '"' + str(q.get('correct_option_text') or '').replace('"', '""') + '"',
                    '"' + (q.get('option_a_text') or '').replace('"', '""') + '"',
                    '"' + (q.get('option_b_text') or '').replace('"', '""') + '"',
                    '"' + (q.get('option_c_text') or '').replace('"', '""') + '"',
                    '"' + (q.get('option_d_text') or '').replace('"', '""') + '"',
                ]))
            return current_app.response_class('\n'.join(csv_lines), mimetype='text/csv', headers={'Content-Disposition': 'attachment; filename=pack_questions_export.csv'})

        return jsonify({
            'questions': questions,
            'total': total,
            'page': page,
            'pages': (total + per_page - 1) // per_page,
            'per_page': per_page,
            'pack_name': pack.name,
        })
    except Exception as e:
        print(traceback.format_exc())
        return jsonify({'error': str(e)}), 500


# ── Purchase Question Pack Access ───────────────────────────────────────────

@marketplace_bp.route('/packs/<int:pack_id>/purchase', methods=['POST'])
def purchase_pack(pack_id):
    try:
        current_user = get_current_user()
        if not current_user:
            return jsonify({'error': 'Please login first'}), 401

        pack = QuestionPack.query.filter_by(id=pack_id, is_active=True).first()
        if not pack:
            return jsonify({'error': 'Pack not found'}), 404

        purchased_ids = purchase_question_pack(db.session, current_user.id, pack)
        wallet = UserPoints.query.filter_by(user_id=current_user.id).first()
        return jsonify({
            'success': True,
            'message': f'✅ {pack.name} unlocked!',
            'new_balance': wallet.balance if wallet else 0,
            'purchased_exam_ids': purchased_ids,
        })
    except ValueError as e:
        return jsonify({'error': str(e)}), 402
    except Exception as e:
        db.session.rollback()
        print(traceback.format_exc())
        return jsonify({'error': str(e)}), 500


# ── Purchase Exam Access ──────────────────────────────────────────────────────

@marketplace_bp.route('/purchase', methods=['POST'])
def purchase_exam():
    try:
        current_user = get_current_user()
        if not current_user:
            return jsonify({'error': 'Please login first'}), 401

        data = request.get_json() or {}
        exam_id = data.get('exam_id')
        if not exam_id:
            return jsonify({'error': 'exam_id required'}), 400

        exam = Exam.query.get_or_404(exam_id)
        price = exam.price or 0

        # Check if already purchased
        existing = ExamPurchase.query.filter_by(
            user_id=current_user.id, exam_id=exam_id
        ).first()
        if existing:
            return jsonify({'error': 'This exam has already been purchased'}), 400

        # Check wallet balance
        wallet = UserPoints.query.filter_by(user_id=current_user.id).first()
        if not wallet or wallet.balance < price:
            return jsonify({
                'error': f'Insufficient points. You have {wallet.balance if wallet else 0} points, need {price}',
                'balance': wallet.balance if wallet else 0,
                'required': price
            }), 402

        # Deduct points
        wallet.balance -= price
        wallet.total_spent += price

        # Record transaction
        txn = PointsTransaction(
            user_id=current_user.id,
            type='spend',
            amount=price,
            description=f'Purchased: {exam.name} Question Bank',
            reference_id=exam_id
        )
        db.session.add(txn)

        # Create purchase record
        purchase = ExamPurchase(user_id=current_user.id, exam_id=exam_id)
        db.session.add(purchase)
        db.session.commit()

        return jsonify({
            'success': True,
            'message': f'✅ {exam.name} Question Bank unlocked!',
            'new_balance': wallet.balance
        })
    except Exception as e:
        db.session.rollback()
        print(traceback.format_exc())
        return jsonify({'error': str(e)}), 500


# ── My Purchases ──────────────────────────────────────────────────────────────

@marketplace_bp.route('/my-purchases', methods=['GET'])
def my_purchases():
    try:
        current_user = get_current_user()
        if not current_user:
            return jsonify({'error': 'Please login'}), 401

        purchases = ExamPurchase.query.filter_by(user_id=current_user.id).all()
        result = []
        for p in purchases:
            exam = Exam.query.get(p.exam_id)
            if exam:
                result.append({
                    'exam_id': exam.id,
                    'exam_name': exam.name,
                    'purchased_at': p.purchased_at.isoformat() if p.purchased_at else None,
                })
        return jsonify({'purchases': result})
    except Exception as e:
        print(traceback.format_exc())
        return jsonify({'error': str(e)}), 500


# ── B2B Razorpay Checkout & Marks Analysis Endpoints ─────────────────────────────────

# Create Razorpay Order
@marketplace_bp.route('/packs/<int:pack_id>/razorpay/order', methods=['POST'])
def create_razorpay_order(pack_id):
    try:
        current_user = get_current_user()
        if not current_user:
            return jsonify({'error': 'Please login first'}), 401
            
        pack = QuestionPack.query.filter_by(id=pack_id, is_active=True).first()
        if not pack:
            return jsonify({'error': 'Pack not found'}), 404
            
        # Check if already purchased
        purchased = QuestionPackPurchase.query.filter_by(user_id=current_user.id, pack_id=pack_id).first()
        if purchased:
            return jsonify({'error': 'Pack already purchased', 'already_owned': True}), 400
            
        amount_in_paise = int(pack.price * 100)
        
        # Razorpay Key Secret from config
        key_id = current_app.config.get('RAZORPAY_KEY_ID', 'rzp_test_mock_key')
        key_secret = current_app.config.get('RAZORPAY_KEY_SECRET', 'mock_secret')
        
        if key_id != 'rzp_test_mock_key' and key_secret != 'mock_secret':
            import razorpay
            client = razorpay.Client(auth=(key_id, key_secret))
            order_data = {
                'amount': amount_in_paise,
                'currency': 'INR',
                'receipt': f'receipt_pack_{pack_id}_{current_user.id}',
                'payment_capture': 1
            }
            order = client.order.create(data=order_data)
            order_id = order['id']
            is_mock = False
        else:
            # Simulated mode
            import uuid
            order_id = f'order_mock_{uuid.uuid4().hex[:12]}'
            is_mock = True
            
        return jsonify({
            'success': True,
            'order_id': order_id,
            'key_id': key_id,
            'amount': amount_in_paise,
            'currency': 'INR',
            'is_mock': is_mock,
            'pack': {
                'name': pack.name,
                'price': pack.price
            },
            'user': {
                'name': current_user.name,
                'email': current_user.email
            }
        })
    except Exception as e:
        print(traceback.format_exc())
        return jsonify({'error': str(e)}), 500


# Verify Razorpay Payment and Unlock Pack
@marketplace_bp.route('/packs/<int:pack_id>/razorpay/verify', methods=['POST'])
def verify_razorpay_payment(pack_id):
    try:
        current_user = get_current_user()
        if not current_user:
            return jsonify({'error': 'Please login first'}), 401
            
        pack = QuestionPack.query.filter_by(id=pack_id, is_active=True).first()
        if not pack:
            return jsonify({'error': 'Pack not found'}), 404
            
        data = request.get_json() or {}
        razorpay_order_id = data.get('razorpay_order_id')
        razorpay_payment_id = data.get('razorpay_payment_id')
        razorpay_signature = data.get('razorpay_signature')
        is_mock = data.get('is_mock', False)
        
        # Check if already purchased
        existing = QuestionPackPurchase.query.filter_by(user_id=current_user.id, pack_id=pack_id).first()
        if existing:
            return jsonify({'success': True, 'message': 'Already owned'})
            
        if is_mock:
            # Under mock mode, we bypass verification and unlock
            pass
        else:
            # Real verification
            key_secret = current_app.config.get('RAZORPAY_KEY_SECRET', 'mock_secret')
            import hmac
            import hashlib
            msg = f"{razorpay_order_id}|{razorpay_payment_id}"
            generated_signature = hmac.new(
                key_secret.encode('utf-8'),
                msg.encode('utf-8'),
                hashlib.sha256
            ).hexdigest()
            
            if generated_signature != razorpay_signature:
                return jsonify({'error': 'Payment verification failed'}), 400
                
        # Unlock Pack: Add QuestionPackPurchase
        purchase = QuestionPackPurchase(user_id=current_user.id, pack_id=pack.id)
        db.session.add(purchase)
        db.session.commit()
        return jsonify({
            'success': True,
            'message': f'✅ {pack.name} successfully unlocked!'
        })
    except Exception as e:
        db.session.rollback()
        print(traceback.format_exc())
        return jsonify({'error': str(e)}), 500


# Save Organization Name for PDF reports
@marketplace_bp.route('/packs/<int:pack_id>/org-name', methods=['POST'])
def update_pack_org_name(pack_id):
    try:
        current_user = get_current_user()
        if not current_user:
            return jsonify({'error': 'Please login first'}), 401
            
        purchase = QuestionPackPurchase.query.filter_by(user_id=current_user.id, pack_id=pack_id).first()
        if not purchase:
            return jsonify({'error': 'Access denied'}), 403
            
        data = request.get_json() or {}
        org_name = data.get('org_name', '').strip()
        
        purchase.org_name = org_name
        db.session.commit()
        return jsonify({'success': True, 'org_name': org_name})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


# Get Pack Marks Analysis (B2B Dashboard data)
@marketplace_bp.route('/packs/<int:pack_id>/analysis', methods=['GET'])
def pack_marks_analysis(pack_id):
    try:
        current_user = get_current_user()
        if not current_user:
            return jsonify({'error': 'Please login first'}), 401
            
        # Check purchase
        purchase = QuestionPackPurchase.query.filter_by(user_id=current_user.id, pack_id=pack_id).first()
        if not purchase:
            return jsonify({'error': 'Access denied. You have not purchased this pack.'}), 403
            
        pack = QuestionPack.query.get_or_404(pack_id)
        raw_exam_ids = pack.exam_ids or []
        exam_ids = []
        for item in raw_exam_ids:
            if isinstance(item, dict):
                if item.get('include_results', True):
                    exam_ids.append(item.get('exam_id'))
            else:
                exam_ids.append(item)
                
        if not exam_ids:
            return jsonify({
                'stats': {'total_candidates': 0, 'average_score': 0, 'highest_score': 0, 'lowest_score': 0, 'category_stats': []},
                'candidates': [],
                'exams_list': []
            })
            
        # Get list of exams for UI dropdown
        exams = Exam.query.filter(Exam.id.in_(exam_ids)).all()
        exams_list = [{'id': e.id, 'name': e.name} for e in exams]
        
        # Build query for results
        query = ExamResult.query.filter(ExamResult.exam_id.in_(exam_ids))
        
        # Apply filters
        filter_exam_id = request.args.get('exam_id', type=int)
        if filter_exam_id and filter_exam_id in exam_ids:
            query = query.filter(ExamResult.exam_id == filter_exam_id)
            
        filter_category = request.args.get('category', '').strip()
        if filter_category:
            query = query.filter(ExamResult.category.ilike(filter_category))
            
        filter_date = request.args.get('shift_date', '').strip()
        if filter_date:
            query = query.filter(ExamResult.test_date == filter_date)
            
        filter_time = request.args.get('shift_time', '').strip()
        if filter_time:
            query = query.filter(ExamResult.test_time == filter_time)
            
        filter_subject = request.args.get('subject', '').strip()
        if filter_subject:
            query = query.filter(ExamResult.subject.ilike(filter_subject))
            
        min_score = request.args.get('min_score', type=float)
        if min_score is not None:
            query = query.filter(ExamResult.score >= min_score)
            
        max_score = request.args.get('max_score', type=float)
        if max_score is not None:
            query = query.filter(ExamResult.score <= max_score)
            
        search_query = request.args.get('search', '').strip()
        if search_query:
            query = query.filter(
                (ExamResult.candidate_name.ilike(f'%{search_query}%')) | 
                (ExamResult.roll_number.ilike(f'%{search_query}%'))
            )
            
        # Get overall and filtered count/stats
        all_filtered = query.order_by(desc(ExamResult.score)).all()
        total_filtered = len(all_filtered)
        
        # Averages & High Scores
        scores = [float(r.score) for r in all_filtered if r.score is not None]
        avg_score = round(sum(scores) / len(scores), 2) if scores else 0
        high_score = max(scores) if scores else 0
        low_score = min(scores) if scores else 0
        
        # Paginate
        download = request.args.get('download', '').strip().lower()
        if download == 'all':
            page_results = all_filtered
        else:
            page = request.args.get('page', 1, type=int)
            per_page = request.args.get('per_page', 50, type=int)
            start = (page - 1) * per_page
            page_results = all_filtered[start : start + per_page]
            
        # Helper functions to mask credentials
        def mask_name(name):
            if not name:
                return 'Candidate'
            parts = name.split()
            masked_parts = []
            for part in parts:
                if len(part) <= 2:
                    masked_parts.append(part[0] + '*')
                else:
                    masked_parts.append(part[:2] + '*' * (len(part) - 2))
            return ' '.join(masked_parts)

        def mask_roll(roll):
            if not roll:
                return '••••'
            roll_str = str(roll)
            if len(roll_str) <= 6:
                return roll_str[:2] + '*' * (len(roll_str) - 2)
            return roll_str[:3] + '*' * (len(roll_str) - 6) + roll_str[-3:]

        candidates_data = []
        for idx, r in enumerate(page_results):
            candidates_data.append({
                'rank': r.rank,
                'candidate_name': mask_name(r.candidate_name),
                'roll_number': mask_roll(r.roll_number),
                'score': float(r.score),
                'percentile': float(r.percentile) if r.percentile else 0,
                'category': r.category or 'UR',
                'test_date': r.test_date,
                'test_time': r.test_time,
                'subject': r.subject,
                'exam_name': r.exam.name if r.exam else ''
            })
            
        # Category breakdown for stats card
        category_breakdown = {}
        for r in all_filtered:
            cat = r.category or 'UR'
            if cat not in category_breakdown:
                category_breakdown[cat] = {'count': 0, 'sum_score': 0}
            category_breakdown[cat]['count'] += 1
            category_breakdown[cat]['sum_score'] += float(r.score)
            
        category_stats = []
        for cat, stats_item in category_breakdown.items():
            category_stats.append({
                'category': cat,
                'count': stats_item['count'],
                'average_score': round(stats_item['sum_score'] / stats_item['count'], 2)
            })
            
        return jsonify({
            'success': True,
            'org_name': purchase.org_name or '',
            'stats': {
                'total_candidates': total_filtered,
                'average_score': avg_score,
                'highest_score': high_score,
                'lowest_score': low_score,
                'category_stats': category_stats
            },
            'candidates': candidates_data,
            'exams_list': exams_list,
            'total': total_filtered,
            'page': request.args.get('page', 1, type=int) if download != 'all' else 1,
            'pages': (total_filtered + 49) // 50 if download != 'all' else 1
        })
    except Exception as e:
        print(traceback.format_exc())
        return jsonify({'error': str(e)}), 500


# ── Points Packs in Marketplace ────────────────────────────────────────────────

@marketplace_bp.route('/points-packs', methods=['GET'])
def list_active_points_packs():
    try:
        packs = PointsPack.query.filter_by(is_active=True).order_by(desc(PointsPack.points)).all()
        return jsonify({'packs': [p.to_dict() for p in packs]})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@marketplace_bp.route('/points-packs/purchase', methods=['POST'])
def purchase_points_pack():
    try:
        current_user = get_current_user()
        if not current_user:
            return jsonify({'error': 'Please login first'}), 401

        data = request.get_json() or {}
        pack_id = data.get('pack_id')
        if not pack_id:
            return jsonify({'error': 'pack_id required'}), 400

        pack = PointsPack.query.filter_by(id=pack_id, is_active=True).first_or_404()

        # Update or create user wallet
        wallet = UserPoints.query.filter_by(user_id=current_user.id).first()
        if not wallet:
            wallet = UserPoints(user_id=current_user.id, balance=0, total_earned=0, total_spent=0)
            db.session.add(wallet)

        wallet.balance += pack.points
        wallet.total_earned += pack.points

        # Record Points transaction
        txn = PointsTransaction(
            user_id=current_user.id,
            type='recharge',
            amount=pack.points,
            description=f'Recharged: {pack.name} ({pack.points} Points)',
            reference_id=pack.id
        )
        db.session.add(txn)
        db.session.commit()

        return jsonify({
            'success': True,
            'message': f'✅ Successfully purchased {pack.name}! {pack.points} points added.',
            'new_balance': wallet.balance
        })
    except Exception as e:
        db.session.rollback()
        print(traceback.format_exc())
        return jsonify({'error': str(e)}), 500



