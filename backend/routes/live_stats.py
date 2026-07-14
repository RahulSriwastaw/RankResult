from flask import Blueprint, request, jsonify
from utils.redis_client import get_view_count, increment_view_count

live_stats_bp = Blueprint('live_stats', __name__)

@live_stats_bp.route('/api/live-stats', methods=['GET'])
def live_stats():
    exam_id = request.args.get('exam', '1')
    total_views = get_view_count(exam_id)
    return jsonify({'totalViews': total_views})
