import requests
import json
import os
import re

def generate_solution(question_no, correct_answer, student_answer):
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
    headers = {
        'Content-Type': 'application/json',
        'x-api-key': os.getenv('CLAUDE_API_KEY'),
        'anthropic-version': '2023-06-01'
    }
    data = {
        'model': 'claude-3-opus-20240229',
        'max_tokens': 500,
        'messages': [{'role': 'user', 'content': prompt}]
    }
    try:
        response = requests.post('https://api.anthropic.com/v1/messages', headers=headers, json=data)
        response.raise_for_status()
        content = response.json()['content'][0]['text']
        # Parse JSON from the response (may have markdown)
        json_match = re.search(r'\{.*\}', content, re.DOTALL)
        if json_match:
            return json.loads(json_match.group())
        else:
            return {
                'explanation': content,
                'why_wrong': 'Please review the concept.',
                'key_takeaways': ['Review basics'],
                'similar_questions_url': None
            }
    except Exception as e:
        print('Claude API error:', e)
        raise