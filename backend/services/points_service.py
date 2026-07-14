from db.models import db, UserPoints, PointsTransaction
from datetime import datetime

def get_balance(user_id):
    up = UserPoints.query.filter_by(user_id=user_id).first()
    if not up:
        # create if not exists
        up = UserPoints(user_id=user_id, balance=0, total_earned=0, total_spent=0)
        db.session.add(up)
        db.session.commit()
        return 0
    return up.balance

def deduct_points(user_id, amount, description):
    up = UserPoints.query.filter_by(user_id=user_id).first()
    if not up or up.balance < amount:
        raise ValueError('Insufficient points')
    up.balance -= amount
    up.total_spent += amount
    up.updated_at = datetime.utcnow()
    txn = PointsTransaction(user_id=user_id, type='spend', amount=amount, description=description)
    db.session.add(txn)
    db.session.commit()

def add_points(user_id, amount, description, txn_type='earn'):
    up = UserPoints.query.filter_by(user_id=user_id).first()
    if not up:
        up = UserPoints(user_id=user_id, balance=0, total_earned=0, total_spent=0)
        db.session.add(up)
    up.balance += amount
    up.total_earned += amount
    up.updated_at = datetime.utcnow()
    txn = PointsTransaction(user_id=user_id, type=txn_type, amount=amount, description=description)
    db.session.add(txn)
    db.session.commit()