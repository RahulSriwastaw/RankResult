from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

class Exam(db.Model):
    __tablename__ = 'exams'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    date = db.Column(db.Date, nullable=False)
    total_questions = db.Column(db.Integer, default=100)

    def __repr__(self):
        return f'<Exam {self.name}>'


class ExamResult(db.Model):
    __tablename__ = 'exam_results'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='SET NULL'), nullable=True)
    exam_id = db.Column(db.Integer, db.ForeignKey('exams.id', ondelete='CASCADE'))
    roll_number = db.Column(db.String(50), nullable=False)
    score = db.Column(db.Numeric(5,2), nullable=False)
    rank = db.Column(db.Integer, nullable=False)
    percentile = db.Column(db.Numeric(5,2))
    category_rank = db.Column(db.Integer)
    category = db.Column(db.String(10))
    section_wise = db.Column(db.JSON)  # {'english': 40, 'maths': 35, ...}
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Indexes for faster queries
    __table_args__ = (
        db.Index('idx_exam_results_roll', 'roll_number'),
        db.Index('idx_exam_results_exam', 'exam_id'),
    )

    def __repr__(self):
        return f'<ExamResult {self.roll_number} score={self.score}>'


class QuestionResponse(db.Model):
    __tablename__ = 'question_responses'
    id = db.Column(db.Integer, primary_key=True)
    result_id = db.Column(db.Integer, db.ForeignKey('exam_results.id', ondelete='CASCADE'), nullable=False)
    question_no = db.Column(db.Integer, nullable=False)
    question_text = db.Column(db.Text)
    student_answer = db.Column(db.String(1))  # A/B/C/D or NULL
    correct_answer = db.Column(db.String(1), nullable=False)
    marks_awarded = db.Column(db.Numeric(3,1), default=0)
    difficulty = db.Column(db.String(10))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    __table_args__ = (
        db.Index('idx_q_responses_result', 'result_id'),
        db.UniqueConstraint('result_id', 'question_no', name='uq_result_question'),
    )

    def __repr__(self):
        return f'<QuestionResponse Q{self.question_no} result={self.result_id}>'


class AISolution(db.Model):
    __tablename__ = 'ai_solutions'
    id = db.Column(db.Integer, primary_key=True)
    question_id = db.Column(db.Integer, db.ForeignKey('question_responses.id', ondelete='CASCADE'), nullable=False, unique=True)
    explanation = db.Column(db.Text, nullable=False)
    why_wrong = db.Column(db.Text)
    key_takeaways = db.Column(db.JSON)  # SQLite & PG compatible JSON list
    similar_questions_url = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'question_id': self.question_id,
            'explanation': self.explanation,
            'why_wrong': self.why_wrong,
            'key_takeaways': self.key_takeaways,
            'similar_questions_url': self.similar_questions_url,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

    def __repr__(self):
        return f'<AISolution for question {self.question_id}>'


class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(255), unique=True, nullable=False)
    password_hash = db.Column(db.Text)
    name = db.Column(db.String(100))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f'<User {self.email}>'


class UserPoints(db.Model):
    __tablename__ = 'user_points'
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), primary_key=True)
    balance = db.Column(db.Integer, default=0)
    total_earned = db.Column(db.Integer, default=0)
    total_spent = db.Column(db.Integer, default=0)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f'<UserPoints user={self.user_id} balance={self.balance}>'


class PointsTransaction(db.Model):
    __tablename__ = 'points_transactions'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'))
    type = db.Column(db.String(20), nullable=False)  # earn, spend, recharge
    amount = db.Column(db.Integer, nullable=False)
    description = db.Column(db.Text)
    reference_id = db.Column(db.Integer)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    __table_args__ = (
        db.Index('idx_txn_user', 'user_id'),
        db.Index('idx_txn_created', 'created_at'),
    )

    def __repr__(self):
        return f'<PointsTransaction {self.type} {self.amount} user={self.user_id}>'