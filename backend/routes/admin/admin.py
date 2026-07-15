from flask import Blueprint, request, jsonify
from db.models import db, User, Exam, ExamResult, QuestionResponse, AISolution, UserPoints, PointsTransaction, MasterQuestion, QuestionPack
from sqlalchemy import func, desc, or_
from datetime import datetime, timedelta, timezone
from services.ai_service import ai_edit_question, bulk_ai_edit_questions
from services.marketplace_service import create_question_pack
import traceback

admin_bp = Blueprint('admin', __name__, url_prefix='/api/admin')

# ==================== DASHBOARD STATS ====================

@admin_bp.route('/dashboard', methods=['GET'])
def dashboard():
    """Get overall admin dashboard statistics."""
    try:
        total_users = User.query.count()
        total_exams = Exam.query.count()
        total_results = ExamResult.query.count()
        total_questions = MasterQuestion.query.count()
        total_solutions = AISolution.query.count()
        total_points_earned = db.session.query(func.sum(UserPoints.total_earned)).scalar() or 0
        total_points_spent = db.session.query(func.sum(UserPoints.total_spent)).scalar() or 0

        # Today's stats
        today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0, tzinfo=None)
        today_results = ExamResult.query.filter(ExamResult.created_at >= today_start).count()
        today_users = User.query.filter(User.created_at >= today_start).count()

        return jsonify({
            'total_users': total_users,
            'total_exams': total_exams,
            'total_results': total_results,
            'total_questions': total_questions,
            'total_solutions': total_solutions,
            'total_points_earned': total_points_earned,
            'total_points_spent': total_points_spent,
            'today_results': today_results,
            'today_users': today_users
        })
    except Exception as e:
        print(traceback.format_exc())
        return jsonify({'error': str(e)}), 500


# ==================== USERS MANAGEMENT ====================

@admin_bp.route('/users', methods=['GET'])
def list_users():
    """List all users with their points balance and advanced filters."""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        search = request.args.get('search', '').strip()
        sort_by = request.args.get('sort_by', 'created_at')  # created_at, balance, results_count
        date_from = request.args.get('date_from')  # YYYY-MM-DD
        date_to = request.args.get('date_to')      # YYYY-MM-DD

        query = User.query
        if search:
            query = query.filter(
                or_(User.email.ilike(f'%{search}%'), User.name.ilike(f'%{search}%'))
            )
        if date_from:
            query = query.filter(User.created_at >= datetime.strptime(date_from, '%Y-%m-%d'))
        if date_to:
            query = query.filter(User.created_at <= datetime.strptime(date_to, '%Y-%m-%d') + timedelta(days=1))

        if sort_by == 'balance':
            query = query.outerjoin(UserPoints, User.id == UserPoints.user_id).order_by(desc(UserPoints.balance))
        else:
            query = query.order_by(desc(User.created_at))

        total = query.count()
        users = query.paginate(page=page, per_page=per_page, error_out=False)

        result = []
        for u in users.items:
            points = UserPoints.query.filter_by(user_id=u.id).first()
            result_count = ExamResult.query.filter_by(user_id=u.id).count()
            result.append({
                'id': u.id,
                'email': u.email,
                'name': u.name,
                'points_balance': points.balance if points else 0,
                'total_earned': points.total_earned if points else 0,
                'total_spent': points.total_spent if points else 0,
                'results_count': result_count,
                'created_at': u.created_at.isoformat() if u.created_at else None
            })

        return jsonify({
            'users': result,
            'total': total,
            'page': page,
            'per_page': per_page,
            'pages': (total + per_page - 1) // per_page
        })
    except Exception as e:
        print(traceback.format_exc())
        return jsonify({'error': str(e)}), 500



@admin_bp.route('/users/<int:user_id>', methods=['GET'])
def get_user(user_id):
    """Get detailed user info."""
    try:
        u = User.query.get_or_404(user_id)
        points = UserPoints.query.filter_by(user_id=user_id).first()
        transactions = PointsTransaction.query.filter_by(user_id=user_id).order_by(desc(PointsTransaction.created_at)).limit(50).all()
        results = ExamResult.query.filter_by(user_id=user_id).order_by(desc(ExamResult.created_at)).limit(20).all()

        return jsonify({
            'user': {
                'id': u.id,
                'email': u.email,
                'name': u.name,
                'created_at': u.created_at.isoformat() if u.created_at else None
            },
            'points': {
                'balance': points.balance if points else 0,
                'total_earned': points.total_earned if points else 0,
                'total_spent': points.total_spent if points else 0
            },
            'transactions': [{
                'id': t.id,
                'type': t.type,
                'amount': t.amount,
                'description': t.description,
                'created_at': t.created_at.isoformat() if t.created_at else None
            } for t in transactions],
            'results': [{
                'id': r.id,
                'exam_id': r.exam_id,
                'roll_number': r.roll_number,
                'score': float(r.score),
                'rank': r.rank,
                'percentile': float(r.percentile) if r.percentile else None,
                'created_at': r.created_at.isoformat() if r.created_at else None
            } for r in results]
        })
    except Exception as e:
        print(traceback.format_exc())
        return jsonify({'error': str(e)}), 500


@admin_bp.route('/users/<int:user_id>/points', methods=['POST'])
def adjust_user_points(user_id):
    """Manually adjust a user's points balance."""
    try:
        data = request.get_json()
        amount = data.get('amount', 0)
        description = data.get('description', 'Admin adjustment')
        txn_type = data.get('type', 'earn')  # earn or spend

        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404

        up = UserPoints.query.filter_by(user_id=user_id).first()
        if not up:
            up = UserPoints(user_id=user_id, balance=0, total_earned=0, total_spent=0)
            db.session.add(up)

        if txn_type == 'earn' or amount > 0:
            up.balance += abs(amount)
            up.total_earned += abs(amount)
        else:
            up.balance -= abs(amount)
            up.total_spent += abs(amount)

        up.updated_at = datetime.now(timezone.utc).replace(tzinfo=None)
        txn = PointsTransaction(
            user_id=user_id,
            type='earn' if amount > 0 else 'spend',
            amount=abs(amount),
            description=f'[Admin] {description}'
        )
        db.session.add(txn)
        db.session.commit()

        return jsonify({'success': True, 'new_balance': up.balance})
    except Exception as e:
        db.session.rollback()
        print(traceback.format_exc())
        return jsonify({'error': str(e)}), 500


@admin_bp.route('/users/bulk-delete', methods=['POST'])
def bulk_delete_users():
    """Bulk delete users by IDs."""
    try:
        data = request.get_json() or {}
        ids = data.get('ids', [])
        if not ids:
            return jsonify({'error': 'No user IDs provided'}), 400

        deleted_count = 0
        for uid in ids:
            try:
                uid_int = int(uid)
            except (ValueError, TypeError):
                continue
            user = User.query.get(uid_int)
            if user:
                # Due to FK CASCADE in models, this deletes Points, Transactions, Purchases, etc.
                db.session.delete(user)
                deleted_count += 1
        
        db.session.commit()
        return jsonify({'success': True, 'deleted': deleted_count})
    except Exception as e:
        db.session.rollback()
        print(traceback.format_exc())
        return jsonify({'error': str(e)}), 500


# ==================== EXAMS MANAGEMENT ====================

@admin_bp.route('/exams', methods=['GET'])
def list_exams():
    """List all exams."""
    try:
        exams = Exam.query.order_by(desc(Exam.date)).all()
        return jsonify({
            'exams': [{
                'id': e.id,
                'name': e.name,
                'date': e.date.isoformat() if e.date else None,
                'total_questions': e.total_questions,
                'results_count': ExamResult.query.filter_by(exam_id=e.id).count()
            } for e in exams]
        })
    except Exception as e:
        print(traceback.format_exc())
        return jsonify({'error': str(e)}), 500


@admin_bp.route('/exams', methods=['POST'])
def create_exam():
    """Create a new exam."""
    try:
        data = request.get_json()
        if not data or not data.get('name'):
            return jsonify({'error': 'Exam name is required'}), 400

        exam = Exam(
            name=data['name'],
            date=datetime.strptime(data['date'], '%Y-%m-%d').date() if data.get('date') else datetime.now(timezone.utc).date(),
            total_questions=data.get('total_questions', 100)
        )
        db.session.add(exam)
        db.session.commit()

        return jsonify({'success': True, 'exam': {'id': exam.id, 'name': exam.name}}), 201
    except Exception as e:
        db.session.rollback()
        print(traceback.format_exc())
        return jsonify({'error': str(e)}), 500


@admin_bp.route('/exams/<int:exam_id>', methods=['PUT'])
def update_exam(exam_id):
    """Update an exam."""
    try:
        exam = Exam.query.get_or_404(exam_id)
        data = request.get_json()
        if data.get('name'):
            exam.name = data['name']
        if data.get('date'):
            exam.date = datetime.strptime(data['date'], '%Y-%m-%d').date()
        if data.get('total_questions'):
            exam.total_questions = data['total_questions']
        db.session.commit()
        return jsonify({'success': True})
    except Exception as e:
        db.session.rollback()
        print(traceback.format_exc())
        return jsonify({'error': str(e)}), 500


@admin_bp.route('/exams/<int:exam_id>', methods=['DELETE'])
def delete_exam(exam_id):
    """Delete an exam and all related data."""
    try:
        exam = Exam.query.get_or_404(exam_id)
        db.session.delete(exam)
        db.session.commit()
        return jsonify({'success': True})
    except Exception as e:
        db.session.rollback()
        print(traceback.format_exc())
        return jsonify({'error': str(e)}), 500


@admin_bp.route('/exams/bulk-delete', methods=['POST'])
def bulk_delete_exams():
    """Bulk delete exams by IDs."""
    try:
        data = request.get_json() or {}
        ids = data.get('ids', [])
        if not ids:
            return jsonify({'error': 'No exam IDs provided'}), 400

        deleted_count = 0
        for eid in ids:
            try:
                eid_int = int(eid)
            except (ValueError, TypeError):
                continue
            exam = Exam.query.get(eid_int)
            if exam:
                db.session.delete(exam)
                deleted_count += 1

        db.session.commit()
        return jsonify({'success': True, 'deleted': deleted_count})
    except Exception as e:
        db.session.rollback()
        print(traceback.format_exc())
        return jsonify({'error': str(e)}), 500


# ==================== QUESTION PACKS MANAGEMENT ====================

@admin_bp.route('/packs', methods=['GET'])
def list_packs():
    try:
        packs = QuestionPack.query.order_by(desc(QuestionPack.created_at)).all()
        return jsonify({'packs': [p.to_dict() for p in packs]})
    except Exception as e:
        print(traceback.format_exc())
        return jsonify({'error': str(e)}), 500


@admin_bp.route('/packs', methods=['POST'])
def create_pack():
    try:
        data = request.get_json() or {}
        name = (data.get('name') or '').strip()
        description = (data.get('description') or '').strip()
        price = int(data.get('price', 0) or 0)
        exam_ids = data.get('exam_ids') or []

        if not name:
            return jsonify({'error': 'Pack name is required'}), 400

        pack = create_question_pack(db.session, name, description, price, exam_ids)
        return jsonify({'success': True, 'pack': pack.to_dict()}), 201
    except Exception as e:
        db.session.rollback()
        print(traceback.format_exc())
        return jsonify({'error': str(e)}), 500


@admin_bp.route('/packs/<int:pack_id>', methods=['PUT'])
def update_pack(pack_id):
    try:
        pack = QuestionPack.query.get_or_404(pack_id)
        data = request.get_json() or {}
        if 'name' in data:
            pack.name = (data.get('name') or '').strip()
        if 'description' in data:
            pack.description = (data.get('description') or '').strip()
        if 'price' in data:
            pack.price = int(data.get('price', 0) or 0)
        if 'exam_ids' in data:
            pack.exam_ids = list(data.get('exam_ids') or [])
        if 'is_active' in data:
            pack.is_active = bool(data.get('is_active'))
        db.session.commit()
        return jsonify({'success': True, 'pack': pack.to_dict()})
    except Exception as e:
        db.session.rollback()
        print(traceback.format_exc())
        return jsonify({'error': str(e)}), 500


@admin_bp.route('/packs/<int:pack_id>', methods=['DELETE'])
def delete_pack(pack_id):
    try:
        pack = QuestionPack.query.get_or_404(pack_id)
        db.session.delete(pack)
        db.session.commit()
        return jsonify({'success': True})
    except Exception as e:
        db.session.rollback()
        print(traceback.format_exc())
        return jsonify({'error': str(e)}), 500


# ==================== RESULTS MANAGEMENT ====================

@admin_bp.route('/results', methods=['GET'])
def list_results():
    """List all results with filters."""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        exam_id = request.args.get('exam_id', type=int)
        search = request.args.get('search', '').strip()

        query = ExamResult.query
        if exam_id:
            query = query.filter_by(exam_id=exam_id)
        if search:
            like_term = f'%{search}%'
            query = query.filter(
                or_(
                    ExamResult.roll_number.ilike(like_term),
                    ExamResult.registration_number.ilike(like_term),
                    ExamResult.candidate_name.ilike(like_term),
                    ExamResult.subject.ilike(like_term),
                    ExamResult.test_centre_name.ilike(like_term),
                )
            )

        total = query.count()
        results = query.order_by(desc(ExamResult.created_at)).paginate(page=page, per_page=per_page, error_out=False)

        return jsonify({
            'results': [{
                'id': r.id,
                'exam_id': r.exam_id,
                'registration_number': r.registration_number,
                'roll_number': r.roll_number,
                'candidate_name': r.candidate_name,
                'community': r.community,
                'test_centre_name': r.test_centre_name,
                'test_date': r.test_date,
                'test_time': r.test_time,
                'subject': r.subject,
                'photo_url': r.photo_url,
                'application_photograph': r.application_photograph or r.photo_url,
                'candidate_payload': r.candidate_payload or {},
                'source_html': r.source_html,
                'parser_version': r.parser_version,
                'parsed_at': r.parsed_at.isoformat() if r.parsed_at else None,
                'score': float(r.score),
                'rank': r.rank,
                'percentile': float(r.percentile) if r.percentile else None,
                'category': r.category,
                'category_rank': r.category_rank,
                'total_correct': r.total_correct,
                'total_wrong': r.total_wrong,
                'total_unattempted': r.total_unattempted,
                'questions_count': QuestionResponse.query.filter_by(result_id=r.id).count(),
                'created_at': r.created_at.isoformat() if r.created_at else None
            } for r in results.items],
            'total': total,
            'page': page,
            'per_page': per_page,
            'pages': (total + per_page - 1) // per_page
        })
    except Exception as e:
        print(traceback.format_exc())
        return jsonify({'error': str(e)}), 500


@admin_bp.route('/results/<int:result_id>', methods=['GET'])
def get_result(result_id):
    """Get detailed result with questions."""
    try:
        result = ExamResult.query.get_or_404(result_id)
        questions = QuestionResponse.query.filter_by(result_id=result_id).order_by(QuestionResponse.question_no).all()

        correct = sum(1 for q in questions if q.student_answer == q.correct_answer)
        wrong = sum(1 for q in questions if q.student_answer and q.student_answer != q.correct_answer)
        unattempted = sum(1 for q in questions if not q.student_answer)

        return jsonify({
            'result': {
                'id': result.id,
                'exam_id': result.exam_id,
                'registration_number': result.registration_number,
                'roll_number': result.roll_number,
                'candidate_name': result.candidate_name,
                'community': result.community,
                'test_centre_name': result.test_centre_name,
                'test_date': result.test_date,
                'test_time': result.test_time,
                'subject': result.subject,
                'photo_url': result.photo_url,
                'application_photograph': result.application_photograph or result.photo_url,
                'candidate_payload': result.candidate_payload or {},
                'source_html': result.source_html,
                'parser_version': result.parser_version,
                'parsed_at': result.parsed_at.isoformat() if result.parsed_at else None,
                'score': float(result.score),
                'rank': result.rank,
                'percentile': float(result.percentile) if result.percentile else None,
                'category': result.category,
                'category_rank': result.category_rank,
                'section_wise': result.section_wise,
                'created_at': result.created_at.isoformat() if result.created_at else None
            },
            'stats': {
                'total': len(questions),
                'correct': correct,
                'wrong': wrong,
                'unattempted': unattempted
            },
            'questions': [{
                'id': q.id,
                'question_no': q.question_no,
                'question_text': q.question_text,
                'student_answer': q.student_answer,
                'correct_answer': q.correct_answer,
                'parsed_payload': q.parsed_payload or {},
                'marks_awarded': float(q.marks_awarded) if q.marks_awarded else 0
            } for q in questions]
        })
    except Exception as e:
        print(traceback.format_exc())
        return jsonify({'error': str(e)}), 500


@admin_bp.route('/results/<int:result_id>', methods=['DELETE'])
def delete_result(result_id):
    """Delete a result and its questions."""
    try:
        result = ExamResult.query.get_or_404(result_id)
        db.session.delete(result)
        db.session.commit()
        return jsonify({'success': True})
    except Exception as e:
        db.session.rollback()
        print(traceback.format_exc())
        return jsonify({'error': str(e)}), 500


@admin_bp.route('/results/bulk-delete', methods=['POST'])
def bulk_delete_results():
    """Bulk delete exam results by IDs."""
    try:
        data = request.get_json() or {}
        ids = data.get('ids', [])
        if not ids:
            return jsonify({'error': 'No result IDs provided'}), 400

        deleted_count = 0
        for rid in ids:
            try:
                rid_int = int(rid)
            except (ValueError, TypeError):
                continue
            result = ExamResult.query.get(rid_int)
            if result:
                db.session.delete(result)
                deleted_count += 1

        db.session.commit()
        return jsonify({'success': True, 'deleted': deleted_count})
    except Exception as e:
        db.session.rollback()
        print(traceback.format_exc())
        return jsonify({'error': str(e)}), 500


# ==================== QUESTIONS MANAGEMENT (QuestionResponse view) ====================

@admin_bp.route('/questions', methods=['GET'])
def list_questions():
    """List all QuestionResponses with filters."""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        exam_id = request.args.get('exam_id', type=int)
        result_id = request.args.get('result_id', type=int)

        query = QuestionResponse.query
        if result_id:
            query = query.filter_by(result_id=result_id)
        if exam_id:
            query = query.join(ExamResult).filter(ExamResult.exam_id == exam_id)

        total = query.count()
        questions = query.order_by(QuestionResponse.question_no).paginate(page=page, per_page=per_page, error_out=False)

        return jsonify({
            'questions': [{
                'id': q.id,
                'result_id': q.result_id,
                'question_no': q.question_no,
                'question_text': q.question_text[:100] if q.question_text else None,
                'student_answer': q.student_answer,
                'correct_answer': q.correct_answer,
                'marks_awarded': float(q.marks_awarded) if q.marks_awarded else 0,
                'has_solution': AISolution.query.filter_by(master_question_id=q.master_question_id).first() is not None
            } for q in questions.items],
            'total': total,
            'page': page,
            'per_page': per_page,
            'pages': (total + per_page - 1) // per_page
        })
    except Exception as e:
        print(traceback.format_exc())
        return jsonify({'error': str(e)}), 500


# ==================== MASTER QUESTIONS MANAGEMENT ====================

@admin_bp.route('/master-questions', methods=['GET'])
def list_master_questions():
    """List MasterQuestions with advanced filters."""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        search = request.args.get('search', '').strip()
        has_solution = request.args.get('has_solution')       # 'true' | 'false' | None
        subject = request.args.get('subject', '').strip()
        shift_date = request.args.get('shift_date', '').strip()
        sort_by = request.args.get('sort_by', 'created_at')  # created_at | reference_count | shift_count
        correct_answer = request.args.get('correct_answer', '').strip().upper()

        query = MasterQuestion.query

        if search:
            query = query.filter(MasterQuestion.question_text.ilike(f'%{search}%'))
        if correct_answer:
            query = query.filter(MasterQuestion.correct_answer == correct_answer)

        # Sort
        if sort_by == 'reference_count':
            query = query.order_by(desc(MasterQuestion.reference_count))
        elif sort_by == 'shift_count':
            query = query.order_by(desc(MasterQuestion.shift_count))
        else:
            query = query.order_by(desc(MasterQuestion.created_at))

        total = query.count()
        mqs = query.paginate(page=page, per_page=per_page, error_out=False)

        result = []
        for mq in mqs.items:
            sol = AISolution.query.filter_by(master_question_id=mq.id).first()
            # Filter by subject/shift_date in Python (JSON field)
            shifts = mq.shifts or []
            if subject and not any(s.get('subject', '') == subject for s in shifts):
                continue
            if shift_date and not any(s.get('test_date', '') == shift_date for s in shifts):
                continue
            if has_solution == 'true' and not sol:
                continue
            if has_solution == 'false' and sol:
                continue

            result.append({
                'id': mq.id,
                'question_id_html': mq.question_id_html,
                'question_hash': mq.question_hash,
                'question_text': mq.question_text,
                'correct_answer': mq.correct_answer,
                'correct_option_text': mq.correct_option_text,
                'option_a_text': mq.option_a_text,
                'option_b_text': mq.option_b_text,
                'option_c_text': mq.option_c_text,
                'option_d_text': mq.option_d_text,
                'option_a_id': mq.option_a_id,
                'option_b_id': mq.option_b_id,
                'option_c_id': mq.option_c_id,
                'option_d_id': mq.option_d_id,
                'reference_count': mq.reference_count,
                'shift_count': mq.shift_count,
                'shifts': shifts,
                'has_solution': sol is not None,
                'created_at': mq.created_at.isoformat() if mq.created_at else None,
                'updated_at': mq.updated_at.isoformat() if mq.updated_at else None,
            })

        return jsonify({
            'questions': result,
            'total': total,
            'page': page,
            'per_page': per_page,
            'pages': (total + per_page - 1) // per_page
        })
    except Exception as e:
        print(traceback.format_exc())
        return jsonify({'error': str(e)}), 500


@admin_bp.route('/master-questions/<int:mq_id>', methods=['GET'])
def get_master_question(mq_id):
    """Get single MasterQuestion with all student responses."""
    try:
        mq = MasterQuestion.query.get_or_404(mq_id)
        sol = AISolution.query.filter_by(master_question_id=mq.id).first()

        # All student responses for this question
        responses = QuestionResponse.query.filter_by(master_question_id=mq.id).all()
        resp_data = []
        for r in responses:
            result = ExamResult.query.get(r.result_id)
            resp_data.append({
                'response_id': r.id,
                'result_id': r.result_id,
                'question_no': r.question_no,
                'student_answer': r.student_answer,
                'student_option_text': r.student_option_text,
                'status': r.status,
                'marks_awarded': float(r.marks_awarded) if r.marks_awarded else 0,
                'candidate_name': result.candidate_name if result else None,
                'roll_number': result.roll_number if result else None,
            })

        return jsonify({
            'id': mq.id,
            'question_id_html': mq.question_id_html,
            'question_hash': mq.question_hash,
            'question_text': mq.question_text,
            'correct_answer': mq.correct_answer,
            'correct_option_text': mq.correct_option_text,
            'parsed_payload': mq.parsed_payload or {},
            'option_a_text': mq.option_a_text,
            'option_b_text': mq.option_b_text,
            'option_c_text': mq.option_c_text,
            'option_d_text': mq.option_d_text,
            'reference_count': mq.reference_count,
            'shift_count': mq.shift_count,
            'shifts': mq.shifts or [],
            'has_solution': sol is not None,
            'solution': {
                'explanation': sol.explanation,
                'why_wrong': sol.why_wrong,
                'key_takeaways': sol.key_takeaways,
            } if sol else None,
            'responses': resp_data,
            'created_at': mq.created_at.isoformat() if mq.created_at else None,
            'updated_at': mq.updated_at.isoformat() if mq.updated_at else None,
        })
    except Exception as e:
        print(traceback.format_exc())
        return jsonify({'error': str(e)}), 500


@admin_bp.route('/master-questions/<int:mq_id>', methods=['PUT'])
def update_master_question(mq_id):
    """Manually edit a MasterQuestion's fields."""
    try:
        mq = MasterQuestion.query.get_or_404(mq_id)
        data = request.get_json() or {}

        if 'question_text' in data:
            mq.question_text = data['question_text']
            mq.question_hash = MasterQuestion.generate_hash(data['question_text'])
        if 'correct_answer' in data:
            mq.correct_answer = data['correct_answer']
        if 'correct_option_text' in data:
            mq.correct_option_text = data['correct_option_text']
        if 'question_id_html' in data:
            mq.question_id_html = data['question_id_html']
        if 'option_a_text' in data:
            mq.option_a_text = data['option_a_text']
        if 'option_b_text' in data:
            mq.option_b_text = data['option_b_text']
        if 'option_c_text' in data:
            mq.option_c_text = data['option_c_text']
        if 'option_d_text' in data:
            mq.option_d_text = data['option_d_text']

        db.session.commit()
        return jsonify({'success': True, 'id': mq.id})
    except Exception as e:
        db.session.rollback()
        print(traceback.format_exc())
        return jsonify({'error': str(e)}), 500


@admin_bp.route('/master-questions/<int:mq_id>/ai-edit', methods=['POST'])
def ai_edit_master_question(mq_id):
    """Use AI (Gemini) to clean/improve a single MasterQuestion."""
    try:
        mq = MasterQuestion.query.get_or_404(mq_id)
        apply_changes = request.get_json(silent=True) or {}
        auto_apply = apply_changes.get('auto_apply', False)

        question_data = {
            'id': mq.id,
            'question_text': mq.question_text or '',
            'option_a': mq.option_a_text or '',
            'option_b': mq.option_b_text or '',
            'option_c': mq.option_c_text or '',
            'option_d': mq.option_d_text or '',
            'correct_answer': mq.correct_answer or '',
        }
        result = ai_edit_question(question_data)

        if 'error' in result:
            return jsonify({'error': result['error']}), 500

        # Auto-apply if requested
        if auto_apply:
            if result.get('question_text'):
                mq.question_text = result['question_text']
                mq.question_hash = MasterQuestion.generate_hash(result['question_text'])
            if result.get('option_a'): mq.option_a_text = result['option_a']
            if result.get('option_b'): mq.option_b_text = result['option_b']
            if result.get('option_c'): mq.option_c_text = result['option_c']
            if result.get('option_d'): mq.option_d_text = result['option_d']
            if result.get('correct_answer'): mq.correct_answer = result['correct_answer']
            db.session.commit()

        return jsonify({'success': True, 'suggestion': result, 'auto_applied': auto_apply})
    except Exception as e:
        db.session.rollback()
        print(traceback.format_exc())
        return jsonify({'error': str(e)}), 500


@admin_bp.route('/master-questions/bulk-ai-edit', methods=['POST'])
def bulk_ai_edit_master_questions():
    """Bulk AI edit multiple MasterQuestions."""
    try:
        data = request.get_json() or {}
        mq_ids = data.get('ids', [])
        auto_apply = data.get('auto_apply', False)

        if not mq_ids:
            return jsonify({'error': 'No question IDs provided'}), 400
        if len(mq_ids) > 50:
            return jsonify({'error': 'Max 50 questions per bulk edit request'}), 400

        questions_data = []
        mq_map = {}
        for mq_id in mq_ids:
            mq = MasterQuestion.query.get(mq_id)
            if mq:
                mq_map[mq.id] = mq
                questions_data.append({
                    'id': mq.id,
                    'question_text': mq.question_text or '',
                    'option_a': mq.option_a_text or '',
                    'option_b': mq.option_b_text or '',
                    'option_c': mq.option_c_text or '',
                    'option_d': mq.option_d_text or '',
                    'correct_answer': mq.correct_answer or '',
                })

        results = bulk_ai_edit_questions(questions_data, delay_seconds=0.5)

        if auto_apply:
            for r in results:
                if r['success'] and r['id'] in mq_map:
                    mq = mq_map[r['id']]
                    d = r['data']
                    if d.get('question_text'):
                        mq.question_text = d['question_text']
                        mq.question_hash = MasterQuestion.generate_hash(d['question_text'])
                    if d.get('option_a'): mq.option_a_text = d['option_a']
                    if d.get('option_b'): mq.option_b_text = d['option_b']
                    if d.get('option_c'): mq.option_c_text = d['option_c']
                    if d.get('option_d'): mq.option_d_text = d['option_d']
                    if d.get('correct_answer'): mq.correct_answer = d['correct_answer']
            db.session.commit()

        return jsonify({
            'success': True,
            'results': results,
            'auto_applied': auto_apply,
            'processed': len(results)
        })
    except Exception as e:
        db.session.rollback()
        print(traceback.format_exc())
        return jsonify({'error': str(e)}), 500


@admin_bp.route('/master-questions/<int:mq_id>', methods=['DELETE'])
def delete_master_question(mq_id):
    """Delete a MasterQuestion and all its associated responses/solutions."""
    try:
        mq = MasterQuestion.query.get_or_404(mq_id)
        # Cascade will handle QuestionResponse and AISolution (FK ondelete=CASCADE)
        db.session.delete(mq)
        db.session.commit()
        return jsonify({'success': True, 'deleted_id': mq_id})
    except Exception as e:
        db.session.rollback()
        print(traceback.format_exc())
        return jsonify({'error': str(e)}), 500


@admin_bp.route('/master-questions/bulk-delete', methods=['POST'])
def bulk_delete_master_questions():
    """Bulk delete MasterQuestions by IDs."""
    try:
        data = request.get_json() or {}
        ids = data.get('ids', [])
        if not ids:
            return jsonify({'error': 'No IDs provided'}), 400

        deleted_count = 0
        for mq_id in ids:
            try:
                mq_id_int = int(mq_id)
            except (ValueError, TypeError):
                continue
            mq = MasterQuestion.query.get(mq_id_int)
            if mq:
                db.session.delete(mq)
                deleted_count += 1

        db.session.commit()
        return jsonify({'success': True, 'deleted': deleted_count})
    except Exception as e:
        db.session.rollback()
        print(traceback.format_exc())
        return jsonify({'error': str(e)}), 500


# ==================== TRANSACTIONS ====================

@admin_bp.route('/transactions', methods=['GET'])
def list_transactions():
    """List all points transactions."""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        user_id = request.args.get('user_id', type=int)

        query = PointsTransaction.query
        if user_id:
            query = query.filter_by(user_id=user_id)

        total = query.count()
        transactions = query.order_by(desc(PointsTransaction.created_at)).paginate(page=page, per_page=per_page, error_out=False)

        return jsonify({
            'transactions': [{
                'id': t.id,
                'user_id': t.user_id,
                'type': t.type,
                'amount': t.amount,
                'description': t.description,
                'created_at': t.created_at.isoformat() if t.created_at else None
            } for t in transactions.items],
            'total': total,
            'page': page,
            'per_page': per_page,
            'pages': (total + per_page - 1) // per_page
        })
    except Exception as e:
        print(traceback.format_exc())
        return jsonify({'error': str(e)}), 500
