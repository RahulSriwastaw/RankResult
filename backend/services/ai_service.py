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

def generate_solution(question_no, correct_answer, student_answer, question_text=None,
                      correct_option_text=None, student_option_text=None,
                      option_a=None, option_b=None, option_c=None, option_d=None):
    """
    Generate a full AI solution for a question.
    Also enriches the question with bilingual text, subject, chapter, difficulty, etc.
    Returns a dict with explanation, why_wrong, key_takeaways, similar_questions_url,
    and metadata (subject, chapter, question_type, difficulty, question_text_hin,
    question_text_eng, option_a_hin, option_a_eng, ..., solution_hin, solution_eng).
    Automatically retries with fallback models if rate-limited.
    """
    options_str = ""
    if option_a: options_str += f"\nOption A: {option_a}"
    if option_b: options_str += f"\nOption B: {option_b}"
    if option_c: options_str += f"\nOption C: {option_c}"
    if option_d: options_str += f"\nOption D: {option_d}"

    prompt = f"""You are an expert exam coach for Indian competitive exams (SSC, RRB, Banking, UPSC, etc.).
A student attempted the following question.

Question No: {question_no}
Question: {question_text or 'N/A'}{options_str}
Correct Answer: {correct_answer} — {correct_option_text or ''}
Student's Answer: {student_answer or 'Did not attempt'} — {student_option_text or ''}

STEP 1 — Detect Language:
First, detect the primary language of the question text above.
- If the question is written mostly in Hindi (Devanagari script), set detected_language = "hi"
- If the question is written mostly in English, set detected_language = "en"
- If it is mixed (Hinglish), detect whichever is dominant.

STEP 2 — Generate Solution:
Write explanation, why_wrong, key_takeaways, solution_hin, and solution_eng based on the detected language:
- If detected_language = "hi": write explanation, why_wrong, key_takeaways entirely in HINDI.
- If detected_language = "en": write explanation, why_wrong, key_takeaways entirely in ENGLISH.
Both solution_hin and solution_eng must always be filled (one is a translation of the other).

CRITICAL FORMATTING RULES:
- The "explanation", "solution_hin", and "solution_eng" MUST be formatted as structured, step-by-step explanations.
- Each step must start on a NEW line with bold headers like "**Step 1:**" or "**चरण 1:**" and must be separated from other steps by double newlines (\n\n). Do NOT clump them into one paragraph.
- For Mathematics, Reasoning, and Quantitative questions, show the formula on its own line, list the variables clearly, show calculation steps separately, and clearly highlight the final answer.
- Keep the tone professional, educational, and easy for students to follow.

Also:
1. Identify the subject (e.g. Mathematics, English, General Awareness, Reasoning, etc.)
2. Identify the chapter/topic (e.g. Percentage, One Word Substitution, Polity, etc.)
3. Identify the question type (e.g. MCQ, Fill in the Blank, Error Detection, etc.)
4. Provide clean Hindi version of the question (question_text_hin).
5. Provide clean English version of the question (question_text_eng).
6. Translate each option into Hindi and English.

Return ONLY a valid JSON object with these exact keys:
{{
  "detected_language": "hi",
  "explanation": "...(in detected language)...",
  "why_wrong": "...(in detected language)...",
  "key_takeaways": ["...", "...", "..."],
  "similar_questions_url": null,
  "subject": "...",
  "chapter": "...",
  "question_type": "MCQ",
  "question_text_hin": "...",
  "question_text_eng": "...",
  "option_a_hin": "...",
  "option_a_eng": "...",
  "option_b_hin": "...",
  "option_b_eng": "...",
  "option_c_hin": "...",
  "option_c_eng": "...",
  "option_d_hin": "...",
  "option_d_eng": "...",
  "solution_hin": "...(full solution in Hindi)...",
  "solution_eng": "...(full solution in English)..."
}}"""

    gemini_api_key = os.getenv('GEMINI_API_KEY')
    if not gemini_api_key:
        print("Warning: GEMINI_API_KEY not found, using fallback explanation.")
        return _build_fallback_solution(
            question_no, correct_answer, student_answer,
            question_text=question_text,
            correct_option_text=correct_option_text,
            student_option_text=student_option_text
        )

    # Model fallback chain — tries each model in order until one succeeds
    MODELS = [
        'gemini-flash-latest',
        'gemini-3.1-flash-lite',
        'gemini-flash-lite-latest',
        'gemini-2.0-flash',
        'gemini-2.0-flash-lite',
    ]
    headers = {'Content-Type': 'application/json'}
    data = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "response_mime_type": "application/json",
            "temperature": 0.2,
            "maxOutputTokens": 2048
        }
    }

    last_error = None
    for model in MODELS:
        url = (
            f"https://generativelanguage.googleapis.com/v1beta/models/"
            f"{model}:generateContent?key={gemini_api_key}"
        )
        try:
            response = requests.post(url, headers=headers, json=data, timeout=60)
            if response.status_code == 429:
                print(f"[AI] Model {model} rate-limited (429), trying next model...")
                retry_delay = 2
                try:
                    err_json = response.json()
                    details = err_json.get('error', {}).get('details', [])
                    for d in details:
                        if d.get('@type') == 'type.googleapis.com/google.rpc.RetryInfo':
                            delay_str = d.get('retryDelay', '2s')
                            retry_delay = int(delay_str.replace('s', '').strip())
                            break
                except Exception:
                    pass
                time.sleep(min(retry_delay, 5))  # wait at most 5s per model
                continue

            response.raise_for_status()
            payload = response.json()
            content = payload['candidates'][0]['content']['parts'][0]['text']
            parsed = _extract_json_payload(content)
            if parsed:
                fallback = _build_fallback_solution(
                    question_no, correct_answer, student_answer,
                    question_text=question_text,
                    correct_option_text=correct_option_text,
                    student_option_text=student_option_text
                )
                print(f"[AI] Solution generated successfully using model: {model}")
                return {
                    'detected_language': parsed.get('detected_language', 'en'),
                    'explanation': parsed.get('explanation') or fallback['explanation'],
                    'why_wrong': parsed.get('why_wrong') or fallback['why_wrong'],
                    'key_takeaways': parsed.get('key_takeaways') or fallback['key_takeaways'],
                    'similar_questions_url': parsed.get('similar_questions_url'),
                    # New metadata fields
                    'subject': parsed.get('subject'),
                    'chapter': parsed.get('chapter'),
                    'question_type': parsed.get('question_type'),
                    'difficulty': None,
                    'question_text_hin': parsed.get('question_text_hin'),
                    'question_text_eng': parsed.get('question_text_eng'),
                    'option_a_hin': parsed.get('option_a_hin'),
                    'option_a_eng': parsed.get('option_a_eng'),
                    'option_b_hin': parsed.get('option_b_hin'),
                    'option_b_eng': parsed.get('option_b_eng'),
                    'option_c_hin': parsed.get('option_c_hin'),
                    'option_c_eng': parsed.get('option_c_eng'),
                    'option_d_hin': parsed.get('option_d_hin'),
                    'option_d_eng': parsed.get('option_d_eng'),
                    'solution_hin': parsed.get('solution_hin'),
                    'solution_eng': parsed.get('solution_eng'),
                }
            print(f"[AI] Model {model} returned unparseable JSON, trying next...")
            continue

        except Exception as e:
            last_error = e
            print(f'[AI] Model {model} error: {e}')
            if 'response' in locals() and hasattr(response, 'text'):
                print('Response:', response.text[:300])
            continue

    print(f'[AI] All models exhausted. Last error: {last_error}')
    return _build_fallback_solution(
        question_no, correct_answer, student_answer,
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
