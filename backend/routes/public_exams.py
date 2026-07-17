from flask import Blueprint, jsonify
from db.models import Exam
from sqlalchemy import or_

public_exams_bp = Blueprint('public_exams', __name__, url_prefix='/api/public')

@public_exams_bp.route('/exams', methods=['GET'])
def get_public_exams():
    try:
        # We only show exams that are NOT in 'draft' or 'paused' status for public listing.
        # 'active' and 'coming-soon' status exams will be listed.
        exams = Exam.query.filter(
            or_(Exam.status == 'active', Exam.status == 'coming-soon')
        ).all()
        
        return jsonify({
            'exams': [e.to_dict() for e in exams]
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@public_exams_bp.route('/exams/<slug>', methods=['GET'])
def get_public_exam_by_slug(slug):
    try:
        # Fetch exam by slug
        exam = Exam.query.filter_by(slug=slug).first()
        if not exam:
            return jsonify({'error': 'Exam not found'}), 404
            
        return jsonify({'exam': exam.to_dict()}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
