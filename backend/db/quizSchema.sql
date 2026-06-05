CREATE TYPE question_type_enum AS ENUM ('multiple_choice', 'identify_part', 'clinical_scenario');
CREATE TYPE difficulty_enum AS ENUM ('easy', 'medium', 'hard');
CREATE TYPE session_status_enum AS ENUM ('in_progress', 'completed');

CREATE TABLE IF NOT EXISTS questions (
  id SERIAL PRIMARY KEY,
  question_type question_type_enum NOT NULL,
  anatomical_system VARCHAR(100) NOT NULL,
  difficulty difficulty_enum NOT NULL,
  question_text TEXT NOT NULL,
  image_url TEXT,
  explanation TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS question_options (
  id SERIAL PRIMARY KEY,
  question_id INTEGER NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  option_text TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL DEFAULT FALSE,
  label CHAR(1) NOT NULL
);

CREATE TABLE IF NOT EXISTS quiz_sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  started_at TIMESTAMP DEFAULT NOW(),
  finished_at TIMESTAMP,
  total_questions INTEGER NOT NULL,
  correct_count INTEGER DEFAULT 0,
  score_percent INTEGER DEFAULT 0,
  status session_status_enum DEFAULT 'in_progress'
);

CREATE TABLE IF NOT EXISTS session_answers (
  id SERIAL PRIMARY KEY,
  session_id INTEGER NOT NULL REFERENCES quiz_sessions(id) ON DELETE CASCADE,
  question_id INTEGER NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  selected_option_id INTEGER REFERENCES question_options(id),
  is_correct BOOLEAN NOT NULL DEFAULT FALSE,
  answered_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_questions_system ON questions(anatomical_system);
CREATE INDEX IF NOT EXISTS idx_questions_type ON questions(question_type);
CREATE INDEX IF NOT EXISTS idx_questions_difficulty ON questions(difficulty);
CREATE INDEX IF NOT EXISTS idx_session_answers_session ON session_answers(session_id);
CREATE INDEX IF NOT EXISTS idx_quiz_sessions_user ON quiz_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_question_options_question ON question_options(question_id);
