from flask import Blueprint, request, jsonify
from db.models import db, QuestionResponse, AISolution, UserUnlockedQuestion
from services.ai_service import generate_solution
from services.points_service import get_balance, deduct_points
import traceback
from datetime import datetime

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

        # Check if user already unlocked this question
        unlocked = UserUnlockedQuestion.query.filter_by(user_id=user_id, master_question_id=q.master_question_id).first()
        
        balance = get_balance(user_id)
        
        if not unlocked:
            if balance < 5:
                return jsonify({'error': 'Insufficient points to unlock.'}), 402
            
            deduct_points(user_id, 5, f'Unlocked question {q_id}')
            new_unlock = UserUnlockedQuestion(user_id=user_id, master_question_id=q.master_question_id)
            db.session.add(new_unlock)
            db.session.commit()
            balance = get_balance(user_id)
        
        existing_sols = AISolution.query.filter_by(master_question_id=q.master_question_id).order_by(AISolution.likes.desc()).all()
        
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

        # Verify unlocked
        unlocked = UserUnlockedQuestion.query.filter_by(user_id=user_id, master_question_id=q.master_question_id).first()
        if not unlocked:
            return jsonify({'error': 'Question not unlocked yet.'}), 403

        balance = get_balance(user_id)
        if balance < 5:
            return jsonify({'error': 'Insufficient points to generate.'}), 402
            
        deduct_points(user_id, 5, f'Generated new solution for question {q_id}')
        
        sol_data = generate_solution(
            q.question_no,
            q.correct_answer,
            q.student_answer,
            question_text=q.question_text,
            correct_option_text=q.correct_option_text,
            student_option_text=q.student_option_text or q.student_answer
        )
        
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
                'is_temporary': True
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