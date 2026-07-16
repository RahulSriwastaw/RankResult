from flask import Blueprint, request, jsonify, current_app
from db.models import db, User, UserPoints
import hashlib
import jwt
import os
import requests
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

@auth_bp.route('/google', methods=['POST'])
def google_login():
    try:
        data = request.get_json() or {}
        id_token = data.get('credential')
        if not id_token:
            return jsonify({'error': 'Credential token is required'}), 400

        email = None
        name = None

        # 1. Try Firebase Authentication lookup API
        api_key = os.getenv('FIREBASE_API_KEY', 'AIzaSyDybByBZ7_BEHGaax6KKiKeS8BAT1ObR00')
        verify_url = f"https://identitytoolkit.googleapis.com/v1/accounts:lookup?key={api_key}"
        try:
            resp = requests.post(verify_url, json={'idToken': id_token}, timeout=5)
            if resp.status_code == 200:
                payload = resp.json()
                users = payload.get('users', [])
                if users:
                    user_info = users[0]
                    email = user_info.get('email')
                    name = user_info.get('displayName')
        except Exception as fe:
            print(f"[Auth] Firebase verify fail: {fe}")

        # 2. Fall back to standard Google tokeninfo API if email not resolved
        if not email:
            verify_url = f"https://oauth2.googleapis.com/tokeninfo?id_token={id_token}"
            try:
                resp = requests.get(verify_url, timeout=5)
                if resp.status_code == 200:
                    payload = resp.json()
                    email = payload.get('email')
                    name = payload.get('name')
            except Exception as ge:
                print(f"[Auth] Google tokeninfo verify fail: {ge}")

        if not email:
            return jsonify({'error': 'Invalid or expired authentication credential'}), 400

        email = email.lower().strip()
        user = User.query.filter_by(email=email).first()
        is_new = False
        if not user:
            user = User(email=email, name=name or email.split('@')[0])
            db.session.add(user)
            db.session.flush()

            wallet = UserPoints(user_id=user.id, balance=0, total_earned=0, total_spent=0)
            db.session.add(wallet)
            db.session.commit()
            is_new = True

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
            },
            'is_new': is_new
        })
    except Exception as e:
        print(traceback.format_exc())
        return jsonify({'error': str(e)}), 500


@auth_bp.route('/firebase-login', methods=['POST'])
def firebase_login():
    try:
        data = request.get_json() or {}
        id_token = data.get('idToken')
        name = data.get('name')
        if not id_token:
            return jsonify({'error': 'idToken is required'}), 400

        # Verify using Google identity toolkit lookup API
        api_key = os.getenv('FIREBASE_API_KEY', 'AIzaSyDybByBZ7_BEHGaax6KKiKeS8BAT1ObR00')
        verify_url = f"https://identitytoolkit.googleapis.com/v1/accounts:lookup?key={api_key}"
        resp = requests.post(verify_url, json={'idToken': id_token}, timeout=5)
        if resp.status_code != 200:
            return jsonify({'error': 'Invalid or expired Firebase ID token'}), 400

        payload = resp.json()
        users = payload.get('users', [])
        if not users:
            return jsonify({'error': 'User not found in Firebase payload'}), 400

        user_info = users[0]
        email = user_info.get('email')
        display_name = user_info.get('displayName') or name or email.split('@')[0]

        if not email:
            return jsonify({'error': 'Email not resolved in Firebase token'}), 400

        email = email.lower().strip()
        user = User.query.filter_by(email=email).first()
        is_new = False
        if not user:
            # Create user in SQLite
            user = User(email=email, name=display_name)
            db.session.add(user)
            db.session.flush()

            # Create wallet
            wallet = UserPoints(user_id=user.id, balance=0, total_earned=0, total_spent=0)
            db.session.add(wallet)
            db.session.commit()
            is_new = True
        else:
            # Sync name if display name is available
            if display_name and not user.name:
                user.name = display_name
                db.session.commit()

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
            },
            'is_new': is_new
        })
    except Exception as e:
        db.session.rollback()
        print(traceback.format_exc())
        return jsonify({'error': str(e)}), 500


