from db.models import Exam, ExamPurchase, QuestionPack, UserPoints, PointsTransaction


def create_question_pack(db_session, name, description, price, exam_ids):
    pack = QuestionPack(name=name, description=description, price=price, exam_ids=list(exam_ids or []))
    db_session.add(pack)
    db_session.flush()
    db_session.commit()
    return pack


def purchase_question_pack(db_session, user_id, pack):
    if not pack:
        return []

    wallet = db_session.query(UserPoints).filter_by(user_id=user_id).first()
    if not wallet or wallet.balance < pack.price:
        raise ValueError('Insufficient points')

    purchased_ids = []
    for exam_id in (pack.exam_ids or []):
        existing = db_session.query(ExamPurchase).filter_by(user_id=user_id, exam_id=exam_id).first()
        if existing:
            continue
        db_session.add(ExamPurchase(user_id=user_id, exam_id=exam_id))
        purchased_ids.append(exam_id)

    wallet.balance -= pack.price
    wallet.total_spent += pack.price
    db_session.add(PointsTransaction(
        user_id=user_id,
        type='spend',
        amount=pack.price,
        description=f'Purchased Question Pack: {pack.name}',
        reference_id=pack.id
    ))
    db_session.commit()
    return purchased_ids
