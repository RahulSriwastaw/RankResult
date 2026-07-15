from flask_sqlalchemy import SQLAlchemy
from datetime import datetime, timezone
import hashlib

db = SQLAlchemy()
utcnow = lambda: datetime.now(timezone.utc).replace(tzinfo=None)

class Exam(db.Model):
    __tablename__ = 'exams'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    date = db.Column(db.Date, nullable=False)
    total_questions = db.Column(db.Integer, default=100)
    price = db.Column(db.Integer, default=0)  # Points required to access question bank
    description = db.Column(db.Text)  # Marketplace description

    def __repr__(self):
        return f'<Exam {self.name}>'


class MasterQuestion(db.Model):
    __tablename__ = 'master_questions'
    id = db.Column(db.Integer, primary_key=True)
    question_id_html = db.Column(db.String(100), unique=True, index=True, nullable=True)
    question_hash = db.Column(db.String(64), unique=True, index=True, nullable=False)
    question_text = db.Column(db.Text, nullable=False)
    correct_answer = db.Column(db.String(10), nullable=False)
    correct_option_text = db.Column(db.Text)
    option_a_text = db.Column(db.Text)
    option_b_text = db.Column(db.Text)
    option_c_text = db.Column(db.Text)
    option_d_text = db.Column(db.Text)
    option_a_id = db.Column(db.String(50))
    option_b_id = db.Column(db.String(50))
    option_c_id = db.Column(db.String(50))
    option_d_id = db.Column(db.String(50))
    parsed_payload = db.Column(db.JSON, default=dict)
    reference_count = db.Column(db.Integer, default=1)
    shifts = db.Column(db.JSON, default=list)  # list of shifts: [{'exam_id': int, 'test_date': str, 'test_time': str, 'subject': str}]
    shift_count = db.Column(db.Integer, default=1)
    created_at = db.Column(db.DateTime, default=utcnow)
    updated_at = db.Column(db.DateTime, default=utcnow, onupdate=utcnow)


    def __repr__(self):
        return f'<MasterQuestion {self.question_id_html or self.id}>'

    @staticmethod
    def generate_hash(text_str):
        if not text_str:
            text_str = ""
        return hashlib.sha256(text_str.encode('utf-8')).hexdigest()


class ExamResult(db.Model):
    __tablename__ = 'exam_results'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='SET NULL'), nullable=True)
    exam_id = db.Column(db.Integer, db.ForeignKey('exams.id', ondelete='CASCADE'))
    
    # Candidate Info
    registration_number = db.Column(db.String(50))
    roll_number = db.Column(db.String(50), nullable=False)
    candidate_name = db.Column(db.String(200))
    community = db.Column(db.String(50))
    test_centre_name = db.Column(db.String(300))
    test_date = db.Column(db.String(50))
    test_time = db.Column(db.String(50))
    subject = db.Column(db.String(200))
    photo_url = db.Column(db.String(500))
    application_photograph = db.Column(db.String(500))
    candidate_payload = db.Column(db.JSON, default=dict)
    source_html = db.Column(db.Text)
    parser_version = db.Column(db.String(50), default='rankveda-parser-v1.0')
    parsed_at = db.Column(db.DateTime, default=utcnow)
    
    # Result
    score = db.Column(db.Numeric(5,2), nullable=False)
    rank = db.Column(db.Integer, nullable=False)
    percentile = db.Column(db.Numeric(5,2))
    category_rank = db.Column(db.Integer)
    category = db.Column(db.String(10))
    section_wise = db.Column(db.JSON)  # {'english': 40, 'maths': 35, ...}
    total_correct = db.Column(db.Integer, default=0)
    total_wrong = db.Column(db.Integer, default=0)
    total_unattempted = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=utcnow)

    # Indexes for faster queries
    __table_args__ = (
        db.Index('idx_exam_results_roll', 'roll_number'),
        db.Index('idx_exam_results_exam', 'exam_id'),
    )

    def to_dict(self):
        return {
            'id': self.id,
            'exam_id': self.exam_id,
            'registration_number': self.registration_number,
            'roll_number': self.roll_number,
            'candidate_name': self.candidate_name,
            'community': self.community,
            'test_centre_name': self.test_centre_name,
            'test_date': self.test_date,
            'test_time': self.test_time,
            'subject': self.subject,
            'photo_url': self.photo_url,
            'application_photograph': self.application_photograph or self.photo_url,
            'candidate_payload': self.candidate_payload or {},
            'source_html': self.source_html,
            'parser_version': self.parser_version,
            'parsed_at': self.parsed_at.isoformat() if self.parsed_at else None,
            'score': float(self.score) if self.score else 0,
            'rank': self.rank,
            'percentile': float(self.percentile) if self.percentile else 0,
            'category_rank': self.category_rank or 0,
            'category': self.category or 'UR',
            'section_wise': self.section_wise or {},
            'total_correct': self.total_correct or 0,
            'total_wrong': self.total_wrong or 0,
            'total_unattempted': self.total_unattempted or 0,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

    def __repr__(self):
        return f'<ExamResult {self.roll_number} score={self.score}>'


class QuestionResponse(db.Model):
    __tablename__ = 'question_responses'
    id = db.Column(db.Integer, primary_key=True)
    result_id = db.Column(db.Integer, db.ForeignKey('exam_results.id', ondelete='CASCADE'), nullable=False)
    question_no = db.Column(db.Integer, nullable=False)
    master_question_id = db.Column(db.Integer, db.ForeignKey('master_questions.id', ondelete='CASCADE'), nullable=False)
    option_id = db.Column(db.String(50))         # Option ID from HTML
    student_answer = db.Column(db.String(10))    # A/B/C/D or option number or text
    student_option_text = db.Column(db.Text)      # Full text of selected option
    parsed_payload = db.Column(db.JSON, default=dict)
    marks_awarded = db.Column(db.Numeric(3,1), default=0)
    difficulty = db.Column(db.String(10))
    status = db.Column(db.String(20), default='unattempted')  # correct, wrong, unattempted
    created_at = db.Column(db.DateTime, default=utcnow)

    master_question = db.relationship('MasterQuestion', backref=db.backref('responses', lazy=True, cascade='all, delete-orphan'))

    # Indexes for faster queries
    __table_args__ = (
        db.Index('idx_q_responses_result', 'result_id'),
        db.UniqueConstraint('result_id', 'question_no', name='uq_result_question'),
    )

    @property
    def question_text(self):
        return self.master_question.question_text if self.master_question else None

    @property
    def correct_answer(self):
        return self.master_question.correct_answer if self.master_question else None

    @property
    def correct_option_text(self):
        return self.master_question.correct_option_text if self.master_question else None

    @property
    def question_id_html(self):
        return self.master_question.question_id_html if self.master_question else None

    def to_dict(self):
        sols = self.master_question.ai_solutions if self.master_question else []
        sols.sort(key=lambda s: s.likes, reverse=True) # Sort descending by likes
        
        return {
            'id': self.id,
            'result_id': self.result_id,
            'question_no': self.question_no,
            'question_text': self.question_text,
            'question_id_html': self.question_id_html,
            'option_id': self.option_id,
            'student_answer': self.student_answer,
            'correct_answer': self.correct_answer,
            'student_option_text': self.student_option_text,
            'parsed_payload': self.parsed_payload or {},
            'correct_option_text': self.correct_option_text,
            'marks_awarded': float(self.marks_awarded) if self.marks_awarded is not None else 0,
            'difficulty': self.difficulty,
            'status': self.status,
            'solutions': [s.to_dict() for s in sols]
        }

    def __repr__(self):
        return f'<QuestionResponse Q{self.question_no} result={self.result_id}>'


class AISolution(db.Model):
    __tablename__ = 'ai_solutions'
    id = db.Column(db.Integer, primary_key=True)
    master_question_id = db.Column(db.Integer, db.ForeignKey('master_questions.id', ondelete='CASCADE'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='SET NULL'), nullable=True) # Who published it
    explanation = db.Column(db.Text, nullable=False)
    why_wrong = db.Column(db.Text)
    key_takeaways = db.Column(db.JSON)  # SQLite & PG compatible JSON list
    similar_questions_url = db.Column(db.Text)
    likes = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=utcnow)

    master_question = db.relationship('MasterQuestion', backref=db.backref('ai_solutions', lazy=True, cascade='all, delete-orphan'))
    user = db.relationship('User', backref=db.backref('published_solutions', lazy=True))

    def to_dict(self):
        return {
            'id': self.id,
            'question_id': self.master_question_id,
            'explanation': self.explanation,
            'why_wrong': self.why_wrong,
            'key_takeaways': self.key_takeaways,
            'similar_questions_url': self.similar_questions_url,
            'likes': self.likes,
            'user_id': self.user_id,
            'user_name': self.user.name if self.user else 'AI',
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

    def __repr__(self):
        return f'<AISolution for question {self.master_question_id}>'


class UserUnlockedQuestion(db.Model):
    __tablename__ = 'user_unlocked_questions'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    master_question_id = db.Column(db.Integer, db.ForeignKey('master_questions.id', ondelete='CASCADE'), nullable=False)
    created_at = db.Column(db.DateTime, default=utcnow)
    
    # Ensure a user only unlocks a question once
    __table_args__ = (db.UniqueConstraint('user_id', 'master_question_id', name='_user_question_uc'),)

    def __repr__(self):
        return f'<UserUnlockedQuestion user={self.user_id} q={self.master_question_id}>'


class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(255), unique=True, nullable=False)
    password_hash = db.Column(db.Text)
    name = db.Column(db.String(100))
    created_at = db.Column(db.DateTime, default=utcnow)

    def __repr__(self):
        return f'<User {self.email}>'


class UserPoints(db.Model):
    __tablename__ = 'user_points'
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), primary_key=True)
    balance = db.Column(db.Integer, default=0)
    total_earned = db.Column(db.Integer, default=0)
    total_spent = db.Column(db.Integer, default=0)
    updated_at = db.Column(db.DateTime, default=utcnow, onupdate=utcnow)

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
    created_at = db.Column(db.DateTime, default=utcnow)

    __table_args__ = (
        db.Index('idx_txn_user', 'user_id'),
        db.Index('idx_txn_created', 'created_at'),
    )

    def __repr__(self):
        return f'<PointsTransaction {self.type} {self.amount} user={self.user_id}>'


class QuestionPack(db.Model):
    __tablename__ = 'question_packs'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    price = db.Column(db.Integer, default=0)
    exam_ids = db.Column(db.JSON, default=list)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'price': self.price,
            'exam_ids': self.exam_ids or [],
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }


class ExamPurchase(db.Model):
    """Tracks which user has purchased access to which exam's question bank."""
    __tablename__ = 'exam_purchases'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    exam_id = db.Column(db.Integer, db.ForeignKey('exams.id', ondelete='CASCADE'), nullable=False)
    purchased_at = db.Column(db.DateTime, default=utcnow)

    __table_args__ = (
        db.UniqueConstraint('user_id', 'exam_id', name='uq_user_exam_purchase'),
    )

    def __repr__(self):
        return f'<ExamPurchase user={self.user_id} exam={self.exam_id}>'
