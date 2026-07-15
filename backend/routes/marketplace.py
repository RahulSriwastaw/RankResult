from flask import Blueprint, request, jsonify
from db.models import db, MasterQuestion, Exam, AISolution, ExamPurchase, UserPoints, PointsTransaction, QuestionPack
from routes.auth import get_current_user
from sqlalchemy import func, desc
from services.marketplace_service import purchase_question_pack
import traceback

marketplace_bp = Blueprint('marketplace', __name__, url_prefix='/api/marketplace')

SOLUTION_COST = 10  # points per question solution


# ── List all Exams in Marketplace ─────────────────────────────────────────────

@marketplace_bp.route('/packs', methods=['GET'])
def list_marketplace_packs():
    try:
        current_user = get_current_user()
        packs = QuestionPack.query.filter_by(is_active=True).order_by(desc(QuestionPack.created_at)).all()
        result = []
        for pack in packs:
            purchased = False
            if current_user:
                purchased = any(
                    ExamPurchase.query.filter_by(user_id=current_user.id, exam_id=exam_id).first() is not None
                    for exam_id in (pack.exam_ids or [])
                )
            result.append({
                'id': pack.id,
                'name': pack.name,
                'description': pack.description,
                'price': pack.price or 0,
                'exam_ids': pack.exam_ids or [],
                'purchased': purchased,
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

        result = []
        for exam in exams:
            # Count unique master questions in this exam (via shifts JSON)
            # Need to check all MasterQuestions since contains() filter won't work with type mismatch
            mqs = MasterQuestion.query.filter(
                MasterQuestion.shifts != None
            ).all()
            
            total_questions = 0
            subjects = set()
            dates = set()
            
            for mq in mqs:
                for s in (mq.shifts or []):
                    # Convert to string for comparison since shifts store exam_id as string
                    if str(s.get('exam_id')) == str(exam.id):
                        total_questions += 1
                        if s.get('subject'): 
                            subjects.add(s['subject'])
                        if s.get('test_date'): 
                            dates.add(s['test_date'])
                        break  # Only count each question once even if multiple shifts

            # Check if current user has purchased
            purchased = False
            if current_user:
                purchased = ExamPurchase.query.filter_by(
                    user_id=current_user.id, exam_id=exam.id
                ).first() is not None

            result.append({
                'id': exam.id,
                'name': exam.name,
                'date': str(exam.date) if exam.date else None,
                'total_questions': total_questions,
                'price': exam.price or 0,
                'shifts': len(dates),
                'subjects': list(subjects),
                'purchased': purchased,
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
            is_purchased = ExamPurchase.query.filter_by(
                user_id=current_user.id, exam_id=exam_id
            ).first() is not None

        exam = Exam.query.get_or_404(exam_id)
        all_mqs = MasterQuestion.query.filter(MasterQuestion.shifts != None).all()

        # Collect all unique shifts for this exam with question counts
        shifts_dict = {}
        for mq in all_mqs:
            for s in (mq.shifts or []):
                if str(s.get('exam_id')) == str(exam_id):
                    shift_key = (s.get('test_date'), s.get('test_time'), s.get('subject'))
                    if shift_key not in shifts_dict:
                        shifts_dict[shift_key] = {
                            'test_date': s.get('test_date'),
                            'test_time': s.get('test_time'),
                            'subject': s.get('subject'),
                            'question_count': 0,
                        }
                    shifts_dict[shift_key]['question_count'] += 1

        shifts_list = sorted(shifts_dict.values(), key=lambda x: (x['test_date'], x['test_time']))

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
            is_purchased = ExamPurchase.query.filter_by(
                user_id=current_user.id, exam_id=exam_id
            ).first() is not None

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
            csv_lines = ['id,question_text,subject,date,time,correct_answer']
            for q in questions:
                shift_info = q.get('shift_info') or {}
                csv_lines.append(','.join([
                    str(q['id']),
                    '"' + (q['question_text'] or '').replace('"', '""') + '"',
                    '"' + (shift_info.get('subject') or '').replace('"', '""') + '"',
                    '"' + (shift_info.get('test_date') or '').replace('"', '""') + '"',
                    '"' + (shift_info.get('test_time') or '').replace('"', '""') + '"',
                    str(q['correct_answer'] or ''),
                ]))
            from flask import Response
            return Response('\n'.join(csv_lines), mimetype='text/csv', headers={'Content-Disposition': 'attachment; filename=questions.csv'})

        return jsonify(response_payload)
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
