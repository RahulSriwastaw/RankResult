import os
import unittest
from unittest.mock import Mock, patch

from services.ai_service import generate_solution


class GenerateSolutionTests(unittest.TestCase):
    @patch.dict(os.environ, {"GEMINI_API_KEY": "fake-key"}, clear=False)
    @patch("services.ai_service.requests.post")
    def test_generate_solution_returns_fallback_when_api_is_exhausted(self, mock_post):
        mock_response = Mock()
        mock_response.status_code = 429
        mock_response.text = '{"error": {"message": "Quota exceeded"}}'
        mock_response.raise_for_status.side_effect = Exception("429")
        mock_post.return_value = mock_response

        result = generate_solution(
            12,
            "B",
            "C",
            question_text="Which of the following is the correct synonym of 'happy'?",
            correct_option_text="Option B: joyful",
            student_option_text="Option C: sad"
        )

        self.assertIn("happy", result["explanation"].lower())
        self.assertIn("joyful", result["explanation"].lower())
        self.assertIn("student chose", result["why_wrong"].lower())
        self.assertIn("Review the core concept", result["key_takeaways"][0])


if __name__ == "__main__":
    unittest.main()
