import unittest

from datetime import date

from flask import Flask

from db.models import db, Exam, User, ExamPurchase, QuestionPack, UserPoints, MasterQuestion
from routes.marketplace import marketplace_bp
from services.marketplace_service import create_question_pack, purchase_question_pack


class MarketplacePackServiceTests(unittest.TestCase):
    def setUp(self):
        self.app = Flask(__name__)
        self.app.config['TESTING'] = True
        self.app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
        self.app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
        db.init_app(self.app)
        self.app_context = self.app.app_context()
        self.app_context.push()
        db.create_all()

    def tearDown(self):
        db.session.remove()
        db.drop_all()
        self.app_context.pop()

    def test_create_and_purchase_pack_unlocks_all_exams(self):
        exam_a = Exam(name='Exam A', date=date.today(), total_questions=50, price=10)
        exam_b = Exam(name='Exam B', date=date.today(), total_questions=60, price=15)
        db.session.add_all([exam_a, exam_b])
        db.session.flush()

        pack = create_question_pack(db.session, 'Bundle Pack', 'Test bundle', 25, [exam_a.id, exam_b.id])
        user = User(email='pack@test.com', password_hash='x', name='Pack User')
        db.session.add(user)
        db.session.flush()
        db.session.add(UserPoints(user_id=user.id, balance=100, total_earned=100, total_spent=0))
        db.session.flush()

        purchased_ids = purchase_question_pack(db.session, user.id, pack)

        self.assertEqual(purchased_ids, [exam_a.id, exam_b.id])
        purchases = ExamPurchase.query.filter_by(user_id=user.id).all()
        self.assertEqual(len(purchases), 2)
        self.assertTrue(QuestionPack.query.get(pack.id) is not None)

    def test_exam_question_endpoint_returns_shift_filter_metadata(self):
        self.app.register_blueprint(marketplace_bp)

        exam = Exam(name='Shift Test', date=date.today(), total_questions=20, price=5)
        db.session.add(exam)
        db.session.flush()

        mq_1 = MasterQuestion(
            question_hash=MasterQuestion.generate_hash('q1'),
            question_text='First question',
            correct_answer='A',
            correct_option_text='Option A',
            shifts=[{'exam_id': exam.id, 'subject': 'Maths', 'test_date': '2025-02-01', 'test_time': '09:00'}],
        )
        mq_2 = MasterQuestion(
            question_hash=MasterQuestion.generate_hash('q2'),
            question_text='Second question',
            correct_answer='B',
            correct_option_text='Option B',
            shifts=[{'exam_id': exam.id, 'subject': 'Reasoning', 'test_date': '2025-02-02', 'test_time': '10:00'}],
        )
        db.session.add_all([mq_1, mq_2])
        db.session.commit()

        with self.app.test_client() as client:
            res = client.get(
                f'/api/marketplace/exams/{exam.id}/questions?subject=Maths&shift_date=2025-02-01&shift_time=09:00'
            )

        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertEqual(len(data['questions']), 1)
        self.assertEqual(data['questions'][0]['shift_info']['subject'], 'Maths')
        self.assertIn('Maths', data['filters']['subjects'])
        self.assertIn('2025-02-01', data['filters']['dates'])


if __name__ == '__main__':
    unittest.main()
