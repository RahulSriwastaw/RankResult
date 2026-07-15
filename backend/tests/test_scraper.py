import unittest
from services.scraper import parse_result_html
from app import create_app
from db.models import db


class ScraperTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        import os
        os.environ['DATABASE_URL'] = 'sqlite:///:memory:'
        cls.app = create_app()
        cls.app.config['TESTING'] = True
        cls.app_context = cls.app.app_context()
        cls.app_context.push()
        db.create_all()

    @classmethod
    def tearDownClass(cls):
        db.session.remove()
        db.drop_all()
        cls.app_context.pop()

    def test_parse_result_html_captures_generic_html_fields(self):
        html = """
        <html><body>
        <table class="main-info-tbl">
            <tr><td>Registration No.</td><td>ABC123</td></tr>
            <tr><td>Roll No.</td><td>R001</td></tr>
            <tr><td>Candidate Name</td><td>Test Candidate</td></tr>
            <tr><td>Test Centre Name</td><td>Delhi</td></tr>
        </table>
        <div class="question-pnl" id="q_1" data-question-id="q-1" onclick="show(this)">
            <input type="hidden" name="hidden_field" value="secret" />
            <table class="menu-tbl">
                <tr><td>Question ID</td><td>111</td></tr>
                <tr><td>Chosen Option</td><td>1</td></tr>
            </table>
            <td class="bold">1. What is 2+2?</td>
            <td class="rightAns">1. Four</td>
            <td class="wrngAns">2. Five</td>
            <td class="wrngAns">3. Six</td>
            <td class="wrngAns">4. Seven</td>
        </div>
        </body></html>
        """

        parsed = parse_result_html(html)

        self.assertEqual(parsed['registration_number'], 'ABC123')
        self.assertEqual(parsed['roll_number'], 'R001')
        self.assertEqual(parsed['candidate_name'], 'Test Candidate')
        self.assertEqual(parsed['test_centre_name'], 'Delhi')
        self.assertTrue(parsed['questions'])
        self.assertEqual(parsed['questions'][0]['question_text'], 'What is 2+2?')
        self.assertEqual(parsed['questions'][0]['question_id_html'], '111')
        self.assertEqual(parsed['questions'][0]['html_fields']['id'], 'q_1')
        self.assertEqual(parsed['questions'][0]['html_fields']['data-question-id'], 'q-1')
        self.assertEqual(parsed['questions'][0]['html_fields']['hidden_field'], 'secret')
        self.assertIn('raw_question_html', parsed['questions'][0])
        self.assertEqual(parsed['questions'][0]['student_answer'], '1')
        self.assertEqual(parsed['questions'][0]['correct_answer'], '1')
        self.assertEqual(parsed['questions'][0]['marks'], 1.0)
        self.assertEqual(parsed['score'], 1.0)
        self.assertEqual(parsed['total_correct'], 1)
        self.assertEqual(parsed['total_wrong'], 0)
        self.assertEqual(parsed['total_unattempted'], 0)
