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
    disclaimer = db.Column(db.Text)  # Custom legal disclaimer
    
    slug = db.Column(db.String(100), unique=True, index=True, nullable=True)
    status = db.Column(db.String(50), default='active')  # 'active', 'paused', 'coming-soon', 'draft'
    full_name = db.Column(db.String(200))
    year = db.Column(db.String(50))
    icon = db.Column(db.String(50))
    badge = db.Column(db.String(50))
    color = db.Column(db.String(200))
    border = db.Column(db.String(200))
    badge_color = db.Column(db.String(200))
    theme_color = db.Column(db.String(50))
    conducted_by = db.Column(db.String(200))
    body_text = db.Column(db.Text)
    desc_card = db.Column(db.Text)
    sections = db.Column(db.JSON)
    highlights = db.Column(db.JSON)
    features = db.Column(db.JSON)
    faq = db.Column(db.JSON)
    seo = db.Column(db.JSON)
    marketplace_config = db.Column(db.JSON)

    def to_dict(self):
        return {
            'id': self.id,
            'slug': self.slug or f"exam-{self.id}",
            'name': self.name,
            'date': self.date.isoformat() if self.date else None,
            'total_questions': self.total_questions,
            'price': self.price or 0,
            'description': self.description or '',
            'disclaimer': self.disclaimer or '',
            'status': self.status or 'active',
            'full_name': self.full_name or '',
            'year': self.year or '',
            'icon': self.icon or '📋',
            'badge': self.badge or '',
            'color': self.color or '',
            'border': self.border or '',
            'badge_color': self.badge_color or '',
            'theme_color': self.theme_color or 'indigo',
            'conducted_by': self.conducted_by or '',
            'body_text': self.body_text or '',
            'desc_card': self.desc_card or '',
            'sections': self.sections or [],
            'highlights': self.highlights or [],
            'features': self.features or [],
            'faq': self.faq or [],
            'seo': self.seo or {},
            'marketplace_config': self.marketplace_config or {}
        }

    def __repr__(self):
        return f'<Exam {self.name}>'


class MasterQuestion(db.Model):
    __tablename__ = 'master_questions'
    id = db.Column(db.Integer, primary_key=True)
    question_id_html = db.Column(db.String(100), unique=True, index=True, nullable=True)
    question_hash = db.Column(db.String(64), unique=True, index=True, nullable=False)
    question_text = db.Column(db.Text, nullable=False)
    question_text_hin = db.Column(db.Text)          # Hindi translation of question
    question_text_eng = db.Column(db.Text)          # Clean English version of question
    subject = db.Column(db.String(100))             # e.g. Mathematics, English, Reasoning
    chapter = db.Column(db.String(200))             # e.g. Percentage, Profit & Loss
    question_type = db.Column(db.String(50))        # e.g. MCQ, Fill in the blank, True/False
    difficulty = db.Column(db.String(20))           # Easy / Medium / Hard
    correct_answer = db.Column(db.String(10), nullable=True)
    correct_option_text = db.Column(db.Text)
    # Options - text in original, Hindi, English
    option_a_text = db.Column(db.Text)
    option_a_hin = db.Column(db.Text)
    option_a_eng = db.Column(db.Text)
    option_b_text = db.Column(db.Text)
    option_b_hin = db.Column(db.Text)
    option_b_eng = db.Column(db.Text)
    option_c_text = db.Column(db.Text)
    option_c_hin = db.Column(db.Text)
    option_c_eng = db.Column(db.Text)
    option_d_text = db.Column(db.Text)
    option_d_hin = db.Column(db.Text)
    option_d_eng = db.Column(db.Text)
    option_a_id = db.Column(db.String(50))
    option_b_id = db.Column(db.String(50))
    option_c_id = db.Column(db.String(50))
    option_d_id = db.Column(db.String(50))
    # AI-generated solutions in multiple languages
    solution_hin = db.Column(db.Text)               # Hindi solution/explanation
    solution_eng = db.Column(db.Text)               # English solution/explanation
    
    # Statistics
    correct_count = db.Column(db.Integer, default=0)
    wrong_count = db.Column(db.Integer, default=0)
    unattempted_count = db.Column(db.Integer, default=0)

    # Context
    reference_count = db.Column(db.Integer, default=0)  # How many exam results contain this question
    shifts = db.Column(db.JSON, default=list)       # List of shifts dicts
    shift_count = db.Column(db.Integer, default=0)
    parsed_payload = db.Column(db.JSON)             # The raw JSON parsed for this question initially

    created_at = db.Column(db.DateTime, default=utcnow)
    updated_at = db.Column(db.DateTime, default=utcnow, onupdate=utcnow)


    def __repr__(self):
        return f'<MasterQuestion {self.question_id_html or self.id}>'

    def update_difficulty(self):
        total = (self.correct_count or 0) + (self.wrong_count or 0) + (self.unattempted_count or 0)
        if total == 0:
            self.difficulty = "Medium"
            return
        
        correct_rate = (self.correct_count or 0) / total
        if correct_rate >= 0.70:
            self.difficulty = "Easy"
        elif correct_rate >= 0.30:
            self.difficulty = "Medium"
        else:
            self.difficulty = "Hard"

    @staticmethod
    def generate_hash(text_str, html_id=None):
        if not text_str:
            text_str = ""
        if html_id:
            html_id = str(html_id).strip()
            text_str = f"{html_id}:{text_str}"
        return hashlib.sha256(text_str.encode('utf-8')).hexdigest()


class ExamResult(db.Model):
    __tablename__ = 'exam_results'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='SET NULL'), nullable=True)
    exam_id = db.Column(db.Integer, db.ForeignKey('exams.id', ondelete='CASCADE'))
    
    exam = db.relationship('Exam', backref=db.backref('results', lazy=True, cascade='all, delete-orphan'))
    
    # Candidate Info
    registration_number = db.Column(db.String(50))
    roll_number = db.Column(db.String(50), nullable=True)
    input_url = db.Column(db.Text, nullable=True)
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
    score = db.Column(db.Numeric(5,2), nullable=False, default=0)
    rank = db.Column(db.Integer, nullable=True, default=0)
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
            'input_url': self.input_url,
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

    def to_dict(self, unlocked_mq_ids=None):
        mq = self.master_question
        is_unlocked = False
        if unlocked_mq_ids and mq and mq.id in unlocked_mq_ids:
            is_unlocked = True

        sols = []
        if is_unlocked:
            sols = mq.ai_solutions if mq else []
            sols.sort(key=lambda s: s.likes, reverse=True) # Sort descending by likes

        return {
            'id': self.id,
            'result_id': self.result_id,
            'question_no': self.question_no,
            'question_text': self.question_text,
            'question_text_hin': mq.question_text_hin if mq else None,
            'question_text_eng': mq.question_text_eng if mq else None,
            'question_id_html': self.question_id_html,
            'subject': mq.subject if mq else None,
            'chapter': mq.chapter if mq else None,
            'question_type': mq.question_type if mq else None,
            'option_id': self.option_id,
            'student_answer': self.student_answer,
            'correct_answer': self.correct_answer,
            'student_option_text': self.student_option_text,
            'parsed_payload': self.parsed_payload or {},
            'correct_option_text': self.correct_option_text,
            'marks_awarded': float(self.marks_awarded) if self.marks_awarded is not None else 0,
            'difficulty': mq.difficulty if mq else self.difficulty,
            'status': self.status,
            'is_unlocked': is_unlocked,
            'correct_count': mq.correct_count if mq else 0,
            'wrong_count': mq.wrong_count if mq else 0,
            'unattempted_count': mq.unattempted_count if mq else 0,
            # All options with bilingual text
            'option_a': {'id': mq.option_a_id, 'text': mq.option_a_text, 'hin': mq.option_a_hin, 'eng': mq.option_a_eng} if mq else {},
            'option_b': {'id': mq.option_b_id, 'text': mq.option_b_text, 'hin': mq.option_b_hin, 'eng': mq.option_b_eng} if mq else {},
            'option_c': {'id': mq.option_c_id, 'text': mq.option_c_text, 'hin': mq.option_c_hin, 'eng': mq.option_c_eng} if mq else {},
            'option_d': {'id': mq.option_d_id, 'text': mq.option_d_text, 'hin': mq.option_d_hin, 'eng': mq.option_d_eng} if mq else {},
            # AI solutions in multiple languages
            'solution_hin': mq.solution_hin if is_unlocked and mq else None,
            'solution_eng': mq.solution_eng if is_unlocked and mq else None,
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


class QuestionPackPurchase(db.Model):
    """Tracks which user has purchased access to which question pack (B2B)."""
    __tablename__ = 'question_pack_purchases'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    pack_id = db.Column(db.Integer, db.ForeignKey('question_packs.id', ondelete='CASCADE'), nullable=False)
    org_name = db.Column(db.String(255), default='')  # Custom Org Name for branded PDF exports
    purchased_at = db.Column(db.DateTime, default=utcnow)

    __table_args__ = (
        db.UniqueConstraint('user_id', 'pack_id', name='uq_user_pack_purchase'),
    )

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'pack_id': self.pack_id,
            'org_name': self.org_name or '',
            'purchased_at': self.purchased_at.isoformat() if self.purchased_at else None,
        }

    def __repr__(self):
        return f'<QuestionPackPurchase user={self.user_id} pack={self.pack_id}>'


class PointsPack(db.Model):
    __tablename__ = 'points_packs'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    points = db.Column(db.Integer, nullable=False)
    price = db.Column(db.Float, default=0.0)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'points': self.points,
            'price': self.price,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }


class BlogPost(db.Model):
    __tablename__ = 'blog_posts'
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(250), nullable=False)
    slug = db.Column(db.String(250), unique=True, index=True, nullable=False)
    content = db.Column(db.Text, nullable=False)
    excerpt = db.Column(db.Text)
    featured_image = db.Column(db.String(500))
    status = db.Column(db.String(50), default='draft')  # 'draft', 'published'
    category = db.Column(db.String(100), default='General')
    tags = db.Column(db.String(250), default='')
    
    # SEO fields
    meta_title = db.Column(db.String(250))
    meta_description = db.Column(db.Text)
    meta_keywords = db.Column(db.String(250))
    focus_keyword = db.Column(db.String(100))
    canonical_url = db.Column(db.String(500))
    og_title = db.Column(db.String(250))
    og_description = db.Column(db.Text)
    og_image = db.Column(db.String(500))
    
    created_at = db.Column(db.DateTime, default=utcnow)
    updated_at = db.Column(db.DateTime, default=utcnow, onupdate=utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'slug': self.slug,
            'content': self.content,
            'excerpt': self.excerpt or '',
            'featured_image': self.featured_image or '',
            'status': self.status,
            'category': self.category or 'General',
            'tags': self.tags or '',
            'meta_title': self.meta_title or '',
            'meta_description': self.meta_description or '',
            'meta_keywords': self.meta_keywords or '',
            'focus_keyword': self.focus_keyword or '',
            'canonical_url': self.canonical_url or '',
            'og_title': self.og_title or '',
            'og_description': self.og_description or '',
            'og_image': self.og_image or '',
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }


