from flask import Blueprint, request, jsonify, current_app
from db.models import db, User, UserPoints
import hashlib
import jwt
import os
from datetime import datetime, timezone, timedelta
import traceback

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

JWT_SECRET = os.getenv('JWT_SECRET', 'rankveda-super-secret-jwt-key-2024')
JWT_EXPIRY_DAYS = 30


def _hash_password(password: str) -> str:
    return hashlib.sha256(password.encode('utf-8')).hexdigest()


def _make_token(user_id: int, email: str) -> str:
    payload = {
        'user_id': user_id,
        'email': email,
        'exp': datetime.now(timezone.utc) + timedelta(days=JWT_EXPIRY_DAYS),
        'iat': datetime.now(timezone.utc),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm='HS256')


def verify_token(token: str) -> dict | None:
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None


def get_current_user():
    """Extract and verify user from Authorization header."""
    auth_header = request.headers.get('Authorization', '')
    if not auth_header.startswith('Bearer '):
        return None
    token = auth_header[7:]
    payload = verify_token(token)
    if not payload:
        return None
    return User.query.get(payload['user_id'])


# ── Register ─────────────────────────────────────────────────────────────────

@auth_bp.route('/register', methods=['POST'])
def register():
    try:
        data = request.get_json() or {}
        email = (data.get('email') or '').strip().lower()
        password = data.get('password') or ''
        name = (data.get('name') or '').strip()

        if not email or not password:
            return jsonify({'error': 'Email and password are required'}), 400
        if len(password) < 6:
            return jsonify({'error': 'Password must be at least 6 characters'}), 400

        existing = User.query.filter_by(email=email).first()
        if existing:
            return jsonify({'error': 'This email is already registered'}), 409

        user = User(email=email, password_hash=_hash_password(password), name=name or email.split('@')[0])
        db.session.add(user)
        db.session.flush()  # get user.id

        # Create wallet
        wallet = UserPoints(user_id=user.id, balance=0, total_earned=0, total_spent=0)
        db.session.add(wallet)
        db.session.commit()

        token = _make_token(user.id, user.email)
        return jsonify({
            'success': True,
            'token': token,
            'user': {'id': user.id, 'email': user.email, 'name': user.name, 'balance': 0}
        }), 201
    except Exception as e:
        db.session.rollback()
        print(traceback.format_exc())
        return jsonify({'error': str(e)}), 500


# ── Login ─────────────────────────────────────────────────────────────────────

@auth_bp.route('/login', methods=['POST'])
def login():
    try:
        data = request.get_json() or {}
        email = (data.get('email') or '').strip().lower()
        password = data.get('password') or ''

        if not email or not password:
            return jsonify({'error': 'Email and password are required'}), 400

        user = User.query.filter_by(email=email).first()
        if not user or user.password_hash != _hash_password(password):
            return jsonify({'error': 'Invalid email or password'}), 401

        wallet = UserPoints.query.filter_by(user_id=user.id).first()
        token = _make_token(user.id, user.email)
        return jsonify({
            'success': True,
            'token': token,
            'user': {
                'id': user.id,
                'email': user.email,
                'name': user.name,
                'balance': wallet.balance if wallet else 0
            }
        })
    except Exception as e:
        print(traceback.format_exc())
        return jsonify({'error': str(e)}), 500


# ── Me (current user) ─────────────────────────────────────────────────────────

@auth_bp.route('/me', methods=['GET'])
def me():
    user = get_current_user()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401
    wallet = UserPoints.query.filter_by(user_id=user.id).first()
    return jsonify({
        'id': user.id,
        'email': user.email,
        'name': user.name,
        'balance': wallet.balance if wallet else 0,
        'created_at': user.created_at.isoformat() if user.created_at else None
    })
