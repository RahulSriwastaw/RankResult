from flask import Blueprint, request, jsonify
from db.models import db, QuestionResponse, AISolution, UserUnlockedQuestion
from services.ai_service import generate_solution
from services.points_service import get_balance, deduct_points
import traceback
from datetime import datetime

def _save_ai_metadata_to_master_question(q, mq, sol_data):
    if not mq:
        return
    
    # 1. Subject mapping based on section_name or AI subject
    section_name = q.parsed_payload.get('section_name') if isinstance(q.parsed_payload, dict) else None
    if section_name and section_name.strip() and section_name.lower() != 'overall':
        cleaned = section_name.strip()
        if cleaned.lower().startswith('section'):
            parts = cleaned.split(':', 1)
            if len(parts) > 1:
                cleaned = parts[1].strip()
        mq.subject = cleaned
    elif sol_data.get('subject'):
        mq.subject = sol_data['subject']
        
    # 2. Other metadata
    if sol_data.get('chapter'):
        mq.chapter = sol_data['chapter']
    if sol_data.get('question_type'):
        mq.question_type = sol_data['question_type']
    mq.update_difficulty()
        
    # 3. Question & Option Hindi/English versions
    if sol_data.get('question_text_hin'):
        mq.question_text_hin = sol_data['question_text_hin']
    if sol_data.get('question_text_eng'):
        mq.question_text_eng = sol_data['question_text_eng']
        
    if sol_data.get('option_a_hin'):
        mq.option_a_hin = sol_data['option_a_hin']
    if sol_data.get('option_a_eng'):
        mq.option_a_eng = sol_data['option_a_eng']
        
    if sol_data.get('option_b_hin'):
        mq.option_b_hin = sol_data['option_b_hin']
    if sol_data.get('option_b_eng'):
        mq.option_b_eng = sol_data['option_b_eng']
        
    if sol_data.get('option_c_hin'):
        mq.option_c_hin = sol_data['option_c_hin']
    if sol_data.get('option_c_eng'):
        mq.option_c_eng = sol_data['option_c_eng']
        
    if sol_data.get('option_d_hin'):
        mq.option_d_hin = sol_data['option_d_hin']
    if sol_data.get('option_d_eng'):
        mq.option_d_eng = sol_data['option_d_eng']
        
    db.session.commit()


questions_bp = Blueprint('questions', __name__, url_prefix='/api/questions')

@questions_bp.route('/<result_id>/questions/<q_id>/unlock', methods=['POST'])
def unlock_question(result_id, q_id):
    data = request.get_json()
    user_id = data.get('user_id')
    
    if not user_id:
        return jsonify({'error': 'User not authenticated'}), 401

    try:
        q = QuestionResponse.query.get(q_id)
        if not q:
            return jsonify({'error': 'Question not found'}), 404

        # Auto-unlock if not already done (no points required)
        unlocked = UserUnlockedQuestion.query.filter_by(user_id=user_id, master_question_id=q.master_question_id).first()
        if not unlocked:
            new_unlock = UserUnlockedQuestion(user_id=user_id, master_question_id=q.master_question_id)
            db.session.add(new_unlock)
            db.session.commit()

        existing_sols = AISolution.query.filter_by(master_question_id=q.master_question_id).order_by(AISolution.likes.desc()).all()
        balance = get_balance(user_id)

        return jsonify({
            'solutions': [s.to_dict() for s in existing_sols],
            'isUnlocked': True,
            'newBalance': balance
        })

    except Exception as e:
        db.session.rollback()
        print(traceback.format_exc())
        return jsonify({'error': f'Internal server error: {str(e)}'}), 500


@questions_bp.route('/<result_id>/questions/<q_id>/generate', methods=['POST'])
def generate_solution_endpoint(result_id, q_id):
    data = request.get_json()
    user_id = data.get('user_id')
    
    if not user_id:
        return jsonify({'error': 'User not authenticated'}), 401

    try:
        q = QuestionResponse.query.get(q_id)
        if not q:
            return jsonify({'error': 'Question not found'}), 404

        # Verify unlocked — auto-unlock if not already done
        unlocked = UserUnlockedQuestion.query.filter_by(user_id=user_id, master_question_id=q.master_question_id).first()
        if not unlocked:
            new_unlock = UserUnlockedQuestion(user_id=user_id, master_question_id=q.master_question_id)
            db.session.add(new_unlock)
            db.session.commit()

        balance = get_balance(user_id)
        # Deduct points only if user has enough (non-blocking)
        if balance >= 5:
            deduct_points(user_id, 5, f'Generated new solution for question {q_id}')

        mq = q.master_question
        
        sol_data = generate_solution(
            q.question_no,
            q.correct_answer,
            q.student_answer,
            question_text=q.question_text,
            correct_option_text=q.correct_option_text,
            student_option_text=q.student_option_text or q.student_answer,
            option_a=mq.option_a_text if mq else None,
            option_b=mq.option_b_text if mq else None,
            option_c=mq.option_c_text if mq else None,
            option_d=mq.option_d_text if mq else None,
        )

        # ── Persist AI-enriched metadata back to MasterQuestion ──────────────
        _save_ai_metadata_to_master_question(q, mq, sol_data)
        
        # Return as temporary solution, not saved to DB
        return jsonify({
            'solution': {
                'id': 'temp_' + str(int(datetime.now().timestamp())),
                'question_id': q.master_question_id,
                'explanation': sol_data.get('explanation', ''),
                'why_wrong': sol_data.get('why_wrong', ''),
                'key_takeaways': sol_data.get('key_takeaways', []),
                'similar_questions_url': sol_data.get('similar_questions_url', ''),
                'likes': 0,
                'user_id': user_id,
                'user_name': 'You (Temporary)',
                'is_temporary': True,
                # Enriched metadata
                'detected_language': sol_data.get('detected_language', 'en'),
                'subject': sol_data.get('subject'),
                'chapter': sol_data.get('chapter'),
                'question_type': sol_data.get('question_type'),
                'difficulty': mq.difficulty if mq else None,
                'solution_hin': sol_data.get('solution_hin'),
                'solution_eng': sol_data.get('solution_eng'),
            },
            'newBalance': get_balance(user_id)
        })

    except Exception as e:
        db.session.rollback()
        print(traceback.format_exc())
        return jsonify({'error': str(e)}), 500



@questions_bp.route('/<result_id>/questions/<q_id>/publish', methods=['POST'])
def publish_solution(result_id, q_id):
    data = request.get_json()
    user_id = data.get('user_id')
    temp_sol = data.get('solution')
    
    if not user_id or not temp_sol:
        return jsonify({'error': 'Invalid request'}), 400

    try:
        q = QuestionResponse.query.get(q_id)
        if not q:
            return jsonify({'error': 'Question not found'}), 404
            
        # Check limit
        existing_sols_count = AISolution.query.filter_by(master_question_id=q.master_question_id).count()
        if existing_sols_count >= 5:
            return jsonify({'error': 'Maximum 5 public solutions allowed.'}), 400
            
        new_sol = AISolution(
            master_question_id=q.master_question_id,
            user_id=user_id,
            explanation=temp_sol.get('explanation'),
            why_wrong=temp_sol.get('why_wrong'),
            key_takeaways=temp_sol.get('key_takeaways'),
            similar_questions_url=temp_sol.get('similar_questions_url')
        )
        mq = q.master_question
        if mq:
            if temp_sol.get('solution_hin'):
                mq.solution_hin = temp_sol['solution_hin']
            if temp_sol.get('solution_eng'):
                mq.solution_eng = temp_sol['solution_eng']
        db.session.add(new_sol)
        db.session.commit()
        
        return jsonify({'success': True, 'solution': new_sol.to_dict()})
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500



@questions_bp.route('/solutions/<sol_id>/like', methods=['POST'])
def like_solution(sol_id):
    try:
        sol = AISolution.query.get(sol_id)
        if not sol:
            return jsonify({'error': 'Solution not found'}), 404
            
        sol.likes += 1
        db.session.commit()
        
        return jsonify({'success': True, 'likes': sol.likes})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@questions_bp.route('/<result_id>/bulk-generate', methods=['POST'])
def bulk_generate_solutions(result_id):
    """
    Generate AI solutions for multiple questions at once.
    Body: { user_id, question_ids: [id1, id2, ...] }
    Returns: { results: [{q_id, success, solution, error}], newBalance }
    """
    data = request.get_json()
    user_id = data.get('user_id')
    question_ids = data.get('question_ids', [])

    if not user_id:
        return jsonify({'error': 'User not authenticated'}), 401
    if not question_ids:
        return jsonify({'error': 'No question IDs provided'}), 400

    results = []
    for q_id in question_ids:
        try:
            q = QuestionResponse.query.get(q_id)
            if not q:
                results.append({'q_id': q_id, 'success': False, 'error': 'Not found'})
                continue

            # Auto-unlock
            unlocked = UserUnlockedQuestion.query.filter_by(user_id=user_id, master_question_id=q.master_question_id).first()
            if not unlocked:
                new_unlock = UserUnlockedQuestion(user_id=user_id, master_question_id=q.master_question_id)
                db.session.add(new_unlock)
                db.session.commit()

            mq = q.master_question
            sol_data = generate_solution(
                q.question_no,
                q.correct_answer,
                q.student_answer,
                question_text=q.question_text,
                correct_option_text=q.correct_option_text,
                student_option_text=q.student_option_text or q.student_answer,
                option_a=mq.option_a_text if mq else None,
                option_b=mq.option_b_text if mq else None,
                option_c=mq.option_c_text if mq else None,
                option_d=mq.option_d_text if mq else None,
            )

            # Persist metadata back to MasterQuestion
            _save_ai_metadata_to_master_question(q, mq, sol_data)

            solution = {
                'id': f'bulk_{q_id}_{int(datetime.now().timestamp())}',
                'question_id': q.master_question_id,
                'explanation': sol_data.get('explanation', ''),
                'why_wrong': sol_data.get('why_wrong', ''),
                'key_takeaways': sol_data.get('key_takeaways', []),
                'similar_questions_url': sol_data.get('similar_questions_url'),
                'detected_language': sol_data.get('detected_language', 'en'),
                'solution_hin': sol_data.get('solution_hin'),
                'solution_eng': sol_data.get('solution_eng'),
                'subject': sol_data.get('subject'),
                'chapter': sol_data.get('chapter'),
                'difficulty': mq.difficulty if mq else None,
                'likes': 0,
                'user_id': user_id,
                'user_name': 'RankVeda AI Engine',
                'is_temporary': True,
            }
            results.append({'q_id': q_id, 'success': True, 'solution': solution})

        except Exception as e:
            db.session.rollback()
            print(f'[BulkGen] Error for q_id {q_id}: {e}')
            results.append({'q_id': q_id, 'success': False, 'error': str(e)})

    return jsonify({
        'results': results,
        'newBalance': get_balance(user_id)
    })