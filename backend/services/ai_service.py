import json
import os
import re
import time

import requests


def _build_fallback_solution(question_no, correct_answer, student_answer, question_text=None, correct_option_text=None, student_option_text=None):
    student_answer_text = student_answer or 'Did not attempt'
    question_hint = question_text or 'this question'
    correct_hint = correct_option_text or f"option {correct_answer}"
    student_hint = student_option_text or student_answer_text

    explanation = (
        f"The AI service is temporarily unavailable, so here is a concise study note for Q{question_no}: "
        f"the correct answer is {correct_answer}. For '{question_hint}', the right choice is {correct_hint}. "
        f"Your answer ({student_hint}) does not match the correct reasoning, so review the concept and compare the options carefully."
    )
    why_wrong = (
        f"The student chose {student_hint}, but the correct option is {correct_hint}. "
        f"Use the question wording and the option differences to identify the key concept."
    )
    return {
        'explanation': explanation,
        'why_wrong': why_wrong,
        'key_takeaways': [
            'Review the core concept behind the question.',
            'Compare the correct option with your chosen answer.',
            'Practice a few similar questions to reinforce the idea.'
        ],
        'similar_questions_url': None
    }


def _extract_json_payload(text):
    if not text:
        return None

    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    match = re.search(r'\{.*\}', text, re.DOTALL)
    if not match:
        return None

    try:
        return json.loads(match.group(0))
    except json.JSONDecodeError:
        return None


# ─── Claude: Generate AI explanation for wrong answer ────────────────────────

def generate_solution(question_no, correct_answer, student_answer, question_text=None, correct_option_text=None, student_option_text=None):
    prompt = f"""
    You are an expert exam coach. A student got a question wrong.
    Question number: {question_no}
    Correct answer: {correct_answer}
    Student's answer: {student_answer or 'Did not attempt'}

    Please provide:
    1. A clear concept explanation.
    2. Why the student's answer is wrong (if they attempted).
    3. Key takeaways (3-4 bullet points).
    4. A link to similar practice questions (if known).

    Respond in JSON format with keys: explanation, why_wrong, key_takeaways (array), similar_questions_url.
    """
    gemini_api_key = os.getenv('GEMINI_API_KEY')
    if not gemini_api_key:
        print("Warning: GEMINI_API_KEY not found, using fallback explanation.")
        return _build_fallback_solution(
            question_no,
            correct_answer,
            student_answer,
            question_text=question_text,
            correct_option_text=correct_option_text,
            student_option_text=student_option_text
        )

    url = (
        f"https://generativelanguage.googleapis.com/v1beta/models/"
        f"{os.getenv('GEMINI_MODEL', 'gemini-2.0-flash')}:generateContent?key={gemini_api_key}"
    )
    headers = {'Content-Type': 'application/json'}
    data = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "response_mime_type": "application/json",
            "temperature": 0.2,
            "maxOutputTokens": 1024
        }
    }

    try:
        response = requests.post(url, headers=headers, json=data, timeout=60)
        response.raise_for_status()
        payload = response.json()
        content = payload['candidates'][0]['content']['parts'][0]['text']
        parsed = _extract_json_payload(content)
        if parsed:
            fallback = _build_fallback_solution(
                question_no,
                correct_answer,
                student_answer,
                question_text=question_text,
                correct_option_text=correct_option_text,
                student_option_text=student_option_text
            )
            return {
                'explanation': parsed.get('explanation') or fallback['explanation'],
                'why_wrong': parsed.get('why_wrong') or fallback['why_wrong'],
                'key_takeaways': parsed.get('key_takeaways') or fallback['key_takeaways'],
                'similar_questions_url': parsed.get('similar_questions_url')
            }
        return _build_fallback_solution(
            question_no,
            correct_answer,
            student_answer,
            question_text=question_text,
            correct_option_text=correct_option_text,
            student_option_text=student_option_text
        )
    except Exception as e:
        print('Gemini API error:', e)
        if 'response' in locals() and hasattr(response, 'text'):
            print('Response:', response.text)
        return _build_fallback_solution(
            question_no,
            correct_answer,
            student_answer,
            question_text=question_text,
            correct_option_text=correct_option_text,
            student_option_text=student_option_text
        )


# ─── Gemini: AI Edit a question ──────────────────────────────────────────────

def ai_edit_question(question_data: dict) -> dict:
    """
    Use Gemini to clean/improve a question's text, options, and verify correct answer.
    question_data: {question_text, option_a, option_b, option_c, option_d, correct_answer}
    Returns: {question_text, option_a, option_b, option_c, option_d, correct_answer, notes}
    """
    api_key = os.getenv('GEMINI_API_KEY')
    if not api_key:
        return {'error': 'GEMINI_API_KEY not set in .env'}

    prompt = f"""You are an expert question editor for competitive exams (SSC, RRB, Banking, etc.).
Clean and improve the following exam question. Fix any formatting issues, remove HTML artifacts,
correct spelling mistakes, and ensure the question and options are clear.

Question Text: {question_data.get('question_text', '')}
Option A: {question_data.get('option_a', '')}
Option B: {question_data.get('option_b', '')}
Option C: {question_data.get('option_c', '')}
Option D: {question_data.get('option_d', '')}
Correct Answer: {question_data.get('correct_answer', '')}

Return ONLY a valid JSON object with these exact keys:
{{
  "question_text": "cleaned question text",
  "option_a": "cleaned option A",
  "option_b": "cleaned option B",
  "option_c": "cleaned option C",
  "option_d": "cleaned option D",
  "correct_answer": "A/B/C/D",
  "notes": "brief notes on what was changed"
}}"""

    url = (
        f"https://generativelanguage.googleapis.com/v1beta/models/"
        f"{os.getenv('GEMINI_MODEL', 'gemini-2.0-flash')}:generateContent?key={api_key}"
    )
    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {"temperature": 0.2, "maxOutputTokens": 1024}
    }
    try:
        resp = requests.post(url, json=payload, timeout=30)
        resp.raise_for_status()
        text_out = resp.json()['candidates'][0]['content']['parts'][0]['text']
        parsed = _extract_json_payload(text_out)
        if parsed:
            return parsed
        return {'error': 'Could not parse AI response', 'raw': text_out}
    except Exception as e:
        print('Gemini AI edit error:', e)
        return {'error': str(e)}


def bulk_ai_edit_questions(questions: list, delay_seconds: float = 1.0) -> list:
    """
    Edit multiple questions via Gemini with rate limiting.
    questions: list of question_data dicts (same format as ai_edit_question)
    Returns: list of {id, result} dicts
    """
    results = []
    for q in questions:
        qid = q.get('id')
        try:
            result = ai_edit_question(q)
            results.append({'id': qid, 'success': True, 'data': result})
        except Exception as e:
            results.append({'id': qid, 'success': False, 'error': str(e)})
        time.sleep(delay_seconds)  # Rate limiting
    return results
