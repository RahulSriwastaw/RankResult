import redis
from config import Config

# Local memory fallback if Redis is not available
_local_views = {}
_local_leaderboard = {}

try:
    redis_client = redis.from_url(Config.REDIS_URL, decode_responses=True)
    # Test connection
    redis_client.ping()
    USE_REDIS = True
    print("[OK] Redis connected successfully.")
except Exception as e:
    USE_REDIS = False
    redis_client = None
    print(f"[WARNING] Redis connection failed: {e}. Falling back to in-memory storage.")

def increment_view_count(exam_id):
    """हर बार जब कोई रिजल्ट देखे, तो काउंट बढ़ाएँ"""
    if USE_REDIS:
        try:
            key = f"exam:{exam_id}:views"
            return redis_client.incr(key)
        except Exception:
            pass
    key = str(exam_id)
    _local_views[key] = _local_views.get(key, 0) + 1
    return _local_views[key]

def get_view_count(exam_id):
    """कितने लोगों ने देखा, यह लौटाएँ"""
    if USE_REDIS:
        try:
            key = f"exam:{exam_id}:views"
            return int(redis_client.get(key) or 0)
        except Exception:
            pass
    key = str(exam_id)
    return _local_views.get(key, 0)

def update_leaderboard(exam_id, roll_number, score):
    """लीडरबोर्ड में स्कोर के हिसाब से रैंक सेट करें (जितना ज़्यादा स्कोर, उतनी टॉप रैंक)"""
    if USE_REDIS:
        try:
            key = f"exam:{exam_id}:leaderboard"
            redis_client.zadd(key, {roll_number: score})
            return
        except Exception:
            pass
    key = str(exam_id)
    if key not in _local_leaderboard:
        _local_leaderboard[key] = {}
    _local_leaderboard[key][roll_number] = score

def get_top_100(exam_id):
    """टॉप 100 स्टूडेंट्स को रैंक के साथ लाएँ"""
    if USE_REDIS:
        try:
            key = f"exam:{exam_id}:leaderboard"
            return redis_client.zrevrange(key, 0, 99, withscores=True)
        except Exception:
            pass
    key = str(exam_id)
    board = _local_leaderboard.get(key, {})
    sorted_board = sorted(board.items(), key=lambda item: item[1], reverse=True)
    return sorted_board[:100]