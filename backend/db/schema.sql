--exams table(optional, we can derive from exam_id)
CREATE TABLE exams(
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    date DATE NOT NULL,
    total_questions INT DEFAULT 100
);

--exam_results
CREATE TABLE exam_results(
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE, -- if users table exists
    exam_id INT REFERENCES exams(id),
    roll_number VARCHAR(50) NOT NULL,
    score DECIMAL(5, 2) NOT NULL,
    rank INT NOT NULL,
    percentile DECIMAL(5, 2),
    category_rank INT,
    category VARCHAR(10), --UR / OBC / SC / ST / EWS
    section_wise JSONB, --{ english: 40, maths: 35, ...}
    created_at TIMESTAMP DEFAULT NOW()
);

--question_responses
CREATE TABLE question_responses(
    id SERIAL PRIMARY KEY,
    result_id INT REFERENCES exam_results(id) ON DELETE CASCADE,
    question_no INT NOT NULL,
    student_answer CHAR(1), --A / B / C / D or NULL if unattempted
    correct_answer CHAR(1) NOT NULL,
    marks_awarded DECIMAL(3, 1) DEFAULT 0, --e.g., 1, -0.33, 0
    difficulty VARCHAR(10), --easy / medium / hard(optional)
    created_at TIMESTAMP DEFAULT NOW()
);

--ai_solutions(cached)
CREATE TABLE ai_solutions(
    id SERIAL PRIMARY KEY,
    exam_id INT REFERENCES exams(id),
    question_id INT REFERENCES question_responses(id) ON DELETE CASCADE,
    explanation TEXT NOT NULL,
    why_wrong TEXT,
    key_takeaways TEXT[], --array of bullets
    similar_questions_url TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(question_id)
);

--users(simplified, if needed)
CREATE TABLE users(
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT, -- if using auth
    name VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW()
);

--user_points
CREATE TABLE user_points(
    user_id INT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    balance INT DEFAULT 0,
    total_earned INT DEFAULT 0,
    total_spent INT DEFAULT 0,
    updated_at TIMESTAMP DEFAULT NOW()
);

--points_transactions
CREATE TABLE points_transactions(
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id),
    type VARCHAR(20) NOT NULL, -- 'earn', 'spend', 'recharge'
    amount INT NOT NULL,
    description TEXT,
    reference_id INT, --optional: can refer to recharge_id or result_id
    created_at TIMESTAMP DEFAULT NOW()
);

--Indexes for performance
CREATE INDEX idx_results_exam ON exam_results(exam_id);
CREATE INDEX idx_results_roll ON exam_results(roll_number);
CREATE INDEX idx_q_responses_result ON question_responses(result_id);
