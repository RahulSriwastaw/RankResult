import requests
from bs4 import BeautifulSoup
import re

def fetch_html(url, use_curl=True):
    """
    Fetch HTML from URL. Uses curl_cffi by default for bot-detection bypass.
    Falls back to requests if curl_cffi not available.
    """
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Cache-Control': 'no-cache',
        'Upgrade-Insecure-Requests': '1',
    }
    try:
        if use_curl:
            from curl_cffi import requests as curl_requests
            resp = curl_requests.get(url, headers=headers, impersonate="chrome120", timeout=30)
        else:
            resp = requests.get(url, headers=headers, timeout=30)

        if resp.status_code == 200:
            return resp.text
        else:
            print(f"[Scraper] Status code: {resp.status_code}")
    except ImportError:
        print("[Scraper] curl_cffi not installed, falling back to requests")
        try:
            resp = requests.get(url, headers=headers, timeout=30)
            if resp.status_code == 200:
                return resp.text
        except Exception as e:
            print(f"[Scraper] requests fallback error: {e}")
    except Exception as e:
        print(f"[Scraper] Fetch error: {e}")
    return None


def parse_result_html(html):
    """
    Parse RRB/digialm exam result HTML.

    Page structure (per question-pnl div):
      <td class="bold">Q.1</td>
      <td class="bold">Question text here</td>
      <td class="bold">Ans</td>
      <td class="wrngAns">1. Option A</td>  (wrong options)
      <td class="rightAns">4. Option D</td> (correct option)
      ...
      <td>Chosen Option :</td>
      <td class="bold">-- or 4</td>         (student's chosen option number)

    Candidate info in .main-info-pnl (name, roll, community only — no score/rank).
    """
    soup = BeautifulSoup(html, 'html.parser')

    result = {
        'score': 0.0,
        'rank': 0,
        'percentile': 0.0,
        'category_rank': 0,
        'category': 'UR',
        'section_wise': {},
        'candidate_name': None,
        'roll_number': None,
        'questions': []
    }

    # --- Candidate Info ---
    info_pnl = soup.find(class_='main-info-pnl')
    if info_pnl:
        for row in info_pnl.find_all('tr'):
            tds = row.find_all('td')
            if len(tds) >= 2:
                key = tds[0].get_text(strip=True).lower()
                val = tds[1].get_text(strip=True)
                if 'roll' in key:
                    result['roll_number'] = val
                elif 'name' in key and 'candidate' in key:
                    result['candidate_name'] = val
                elif 'community' in key:
                    result['category'] = val or 'UR'

    # --- Questions ---
    question_divs = soup.find_all('div', class_='question-pnl')
    if not question_divs:
        question_divs = soup.find_all('div', class_='questionPnl')
    print(f"[Scraper] Found {len(question_divs)} question containers")

    correct_count = 0
    wrong_count = 0
    unattempted_count = 0
    total_marks = 0.0

    for idx, q_div in enumerate(question_divs, start=1):
        bold_tds = q_div.find_all('td', class_='bold')

        # Question number: first bold td, e.g. "Q.1"
        qno = idx
        if bold_tds:
            q_label = bold_tds[0].get_text(strip=True)
            m = re.search(r'\d+', q_label)
            if m:
                qno = int(m.group())

        # Question text: second bold td
        question_text = None
        if len(bold_tds) >= 2:
            question_text = bold_tds[1].get_text(separator=' ', strip=True)

        # Correct answer: td.rightAns → "4. देहरादून" → extract option number
        correct_option = None
        right_td = q_div.find('td', class_='rightAns')
        if right_td:
            text = right_td.get_text(strip=True)
            m = re.match(r'^(\d+)[\.\s]', text)
            if m:
                correct_option = m.group(1)  # e.g. "4"
            else:
                correct_option = text.strip()

        # Student's chosen option: look for "Chosen Option :" label in any td,
        # then get the NEXT sibling td (or the last bold td in the row)
        student_option = None
        for td in q_div.find_all('td'):
            if 'Chosen Option' in td.get_text():
                # The chosen option is the next <td> in the same <tr>
                parent_tr = td.find_parent('tr')
                if parent_tr:
                    all_tds_in_row = parent_tr.find_all('td')
                    if len(all_tds_in_row) >= 2:
                        chosen_text = all_tds_in_row[-1].get_text(strip=True)
                        if chosen_text and chosen_text != '--':
                            student_option = chosen_text
                break

        # Marks calculation: RRB NTPC CBT1 — +1 correct, -1/3 wrong, 0 unattempted
        marks = 0.0
        if student_option and correct_option:
            if student_option == correct_option:
                marks = 1.0
                correct_count += 1
            else:
                marks = -1/3
                wrong_count += 1
        else:
            unattempted_count += 1

        total_marks += marks

        result['questions'].append({
            'qno': qno,
            'question_text': question_text,
            'student_answer': student_option,
            'correct_answer': correct_option,
            'marks': round(marks, 2)
        })

    # Calculate score from parsed questions
    result['score'] = round(total_marks, 2)
    print(f"[Scraper] Correct={correct_count}, Wrong={wrong_count}, Unattempted={unattempted_count}, Score={result['score']}")

    return result