const pool = require('../db');

async function startQuiz(req, res) {
  try {
    const { anatomical_system, type, count = 10 } = req.body;
    const userId = req.user.id;

    let query =
      'SELECT id, question_type, anatomical_system, difficulty, question_text, image_url FROM questions WHERE 1=1';
    const params = [];

    if (anatomical_system) {
      params.push(anatomical_system);
      query += ` AND anatomical_system = $${params.length}`;
    }
    if (type) {
      params.push(type);
      query += ` AND question_type = $${params.length}`;
    }

    params.push(parseInt(count));
    query += ` ORDER BY RANDOM() LIMIT $${params.length}`;

    const { rows: questions } = await pool.query(query, params);

    if (questions.length === 0) {
      return res.status(404).json({ error: 'No questions found matching the specified criteria' });
    }

    const questionIds = questions.map((q) => q.id);
    const { rows: options } = await pool.query(
      'SELECT id, question_id, option_text, label FROM question_options WHERE question_id = ANY($1) ORDER BY label',
      [questionIds]
    );

    const optionsByQuestion = {};
    options.forEach((opt) => {
      if (!optionsByQuestion[opt.question_id]) optionsByQuestion[opt.question_id] = [];
      optionsByQuestion[opt.question_id].push(opt);
    });

    const questionsWithOptions = questions.map((q) => ({
      ...q,
      options: optionsByQuestion[q.id] || [],
    }));

    const {
      rows: [session],
    } = await pool.query(
      'INSERT INTO quiz_sessions (user_id, total_questions) VALUES ($1, $2) RETURNING id',
      [userId, questions.length]
    );

    res.status(201).json({ session_id: session.id, questions: questionsWithOptions });
  } catch (err) {
    console.error('startQuiz error:', err);
    res.status(500).json({ error: 'Failed to start quiz' });
  }
}

async function submitAnswer(req, res) {
  try {
    const { session_id, question_id, selected_option_id } = req.body;

    if (!session_id || !question_id || !selected_option_id) {
      return res.status(400).json({ error: 'session_id, question_id, and selected_option_id are required' });
    }

    const {
      rows: [session],
    } = await pool.query(
      "SELECT id FROM quiz_sessions WHERE id = $1 AND user_id = $2 AND status = 'in_progress'",
      [session_id, req.user.id]
    );

    if (!session) {
      return res.status(404).json({ error: 'Active session not found' });
    }

    const { rows: existing } = await pool.query(
      'SELECT id FROM session_answers WHERE session_id = $1 AND question_id = $2',
      [session_id, question_id]
    );

    if (existing.length > 0) {
      return res.status(409).json({ error: 'This question has already been answered in this session' });
    }

    const { rows: options } = await pool.query(
      'SELECT id, is_correct FROM question_options WHERE question_id = $1',
      [question_id]
    );

    const correctOption = options.find((o) => o.is_correct);
    if (!correctOption) {
      return res.status(500).json({ error: 'Question configuration error: no correct option found' });
    }

    const is_correct = parseInt(selected_option_id) === correctOption.id;

    const {
      rows: [question],
    } = await pool.query('SELECT explanation FROM questions WHERE id = $1', [question_id]);

    await pool.query(
      'INSERT INTO session_answers (session_id, question_id, selected_option_id, is_correct) VALUES ($1, $2, $3, $4)',
      [session_id, question_id, selected_option_id, is_correct]
    );

    res.json({
      is_correct,
      explanation: question.explanation,
      correct_option_id: correctOption.id,
    });
  } catch (err) {
    console.error('submitAnswer error:', err);
    res.status(500).json({ error: 'Failed to submit answer' });
  }
}

async function finishQuiz(req, res) {
  try {
    const { session_id } = req.body;

    if (!session_id) {
      return res.status(400).json({ error: 'session_id is required' });
    }

    const {
      rows: [session],
    } = await pool.query('SELECT * FROM quiz_sessions WHERE id = $1 AND user_id = $2', [
      session_id,
      req.user.id,
    ]);

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const { rows: answers } = await pool.query(
      'SELECT is_correct FROM session_answers WHERE session_id = $1',
      [session_id]
    );

    const correct_count = answers.filter((a) => a.is_correct).length;
    const score_percent = Math.round((correct_count / session.total_questions) * 100);

    const {
      rows: [updated],
    } = await pool.query(
      `UPDATE quiz_sessions
       SET finished_at = NOW(), correct_count = $1, score_percent = $2, status = 'completed'
       WHERE id = $3
       RETURNING *`,
      [correct_count, score_percent, session_id]
    );

    res.json(updated);
  } catch (err) {
    console.error('finishQuiz error:', err);
    res.status(500).json({ error: 'Failed to finish quiz' });
  }
}

async function getResults(req, res) {
  try {
    const sessionId = parseInt(req.params.id);

    const {
      rows: [session],
    } = await pool.query('SELECT * FROM quiz_sessions WHERE id = $1 AND user_id = $2', [
      sessionId,
      req.user.id,
    ]);

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const { rows: answers } = await pool.query(
      `SELECT
         sa.question_id,
         sa.selected_option_id,
         sa.is_correct,
         sa.answered_at,
         q.question_text,
         q.question_type,
         q.anatomical_system,
         q.explanation,
         q.image_url,
         sel.option_text  AS selected_text,
         sel.label        AS selected_label,
         cor.id           AS correct_option_id,
         cor.option_text  AS correct_text,
         cor.label        AS correct_label
       FROM session_answers sa
       JOIN questions q ON q.id = sa.question_id
       LEFT JOIN question_options sel ON sel.id = sa.selected_option_id
       LEFT JOIN question_options cor
         ON cor.question_id = sa.question_id AND cor.is_correct = true
       WHERE sa.session_id = $1
       ORDER BY sa.answered_at`,
      [sessionId]
    );

    res.json({ session, answers });
  } catch (err) {
    console.error('getResults error:', err);
    res.status(500).json({ error: 'Failed to retrieve results' });
  }
}

async function getProgress(req, res) {
  try {
    const userId = req.user.id;

    const {
      rows: [overall],
    } = await pool.query(
      `SELECT
         COUNT(*)                          AS total_sessions,
         COALESCE(AVG(score_percent), 0)   AS avg_score,
         COALESCE(SUM(correct_count), 0)   AS total_correct,
         COALESCE(SUM(total_questions), 0) AS total_questions
       FROM quiz_sessions
       WHERE user_id = $1 AND status = 'completed'`,
      [userId]
    );

    const { rows: history } = await pool.query(
      `SELECT id, started_at, finished_at, score_percent, correct_count, total_questions
       FROM quiz_sessions
       WHERE user_id = $1 AND status = 'completed'
       ORDER BY started_at ASC
       LIMIT 30`,
      [userId]
    );

    const { rows: system_stats } = await pool.query(
      `SELECT
         q.anatomical_system,
         COUNT(sa.id)                                                          AS total_answered,
         SUM(CASE WHEN sa.is_correct THEN 1 ELSE 0 END)                       AS correct_count,
         ROUND(
           SUM(CASE WHEN sa.is_correct THEN 1 ELSE 0 END)::numeric
           / NULLIF(COUNT(sa.id), 0) * 100
         )                                                                     AS accuracy
       FROM session_answers sa
       JOIN quiz_sessions qs ON qs.id = sa.session_id
       JOIN questions q ON q.id = sa.question_id
       WHERE qs.user_id = $1 AND qs.status = 'completed'
       GROUP BY q.anatomical_system
       ORDER BY q.anatomical_system`,
      [userId]
    );

    res.json({
      overall: {
        total_sessions: parseInt(overall.total_sessions),
        avg_score: Math.round(parseFloat(overall.avg_score)),
        total_correct: parseInt(overall.total_correct),
        total_questions: parseInt(overall.total_questions),
        overall_accuracy:
          parseInt(overall.total_questions) > 0
            ? Math.round((parseInt(overall.total_correct) / parseInt(overall.total_questions)) * 100)
            : 0,
      },
      history,
      system_stats,
    });
  } catch (err) {
    console.error('getProgress error:', err);
    res.status(500).json({ error: 'Failed to retrieve progress data' });
  }
}

async function getQuestions(req, res) {
  try {
    const { anatomical_system, type, difficulty, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let query = 'SELECT * FROM questions WHERE 1=1';
    const params = [];

    if (anatomical_system) {
      params.push(anatomical_system);
      query += ` AND anatomical_system = $${params.length}`;
    }
    if (type) {
      params.push(type);
      query += ` AND question_type = $${params.length}`;
    }
    if (difficulty) {
      params.push(difficulty);
      query += ` AND difficulty = $${params.length}`;
    }

    params.push(parseInt(limit));
    params.push(offset);
    query += ` ORDER BY created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`;

    const { rows } = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    console.error('getQuestions error:', err);
    res.status(500).json({ error: 'Failed to retrieve questions' });
  }
}

async function getQuestionById(req, res) {
  try {
    const {
      rows: [question],
    } = await pool.query('SELECT * FROM questions WHERE id = $1', [req.params.id]);
    if (!question) return res.status(404).json({ error: 'Question not found' });

    const { rows: options } = await pool.query(
      'SELECT * FROM question_options WHERE question_id = $1 ORDER BY label',
      [req.params.id]
    );

    res.json({ ...question, options });
  } catch (err) {
    console.error('getQuestionById error:', err);
    res.status(500).json({ error: 'Failed to retrieve question' });
  }
}

async function createQuestion(req, res) {
  const client = await pool.connect();
  try {
    const { question_type, anatomical_system, difficulty, question_text, image_url, explanation, options } =
      req.body;

    if (!question_type || !anatomical_system || !difficulty || !question_text || !explanation || !options) {
      return res.status(400).json({ error: 'All fields and options are required' });
    }

    if (!Array.isArray(options) || options.length < 2) {
      return res.status(400).json({ error: 'At least 2 options are required' });
    }

    const correctOptions = options.filter((o) => o.is_correct);
    if (correctOptions.length !== 1) {
      return res.status(400).json({ error: 'Exactly one correct option is required' });
    }

    await client.query('BEGIN');

    const {
      rows: [question],
    } = await client.query(
      `INSERT INTO questions (question_type, anatomical_system, difficulty, question_text, image_url, explanation)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [question_type, anatomical_system, difficulty, question_text, image_url || null, explanation]
    );

    for (const opt of options) {
      await client.query(
        'INSERT INTO question_options (question_id, option_text, is_correct, label) VALUES ($1, $2, $3, $4)',
        [question.id, opt.option_text, opt.is_correct, opt.label]
      );
    }

    await client.query('COMMIT');

    const { rows: createdOptions } = await pool.query(
      'SELECT * FROM question_options WHERE question_id = $1 ORDER BY label',
      [question.id]
    );

    res.status(201).json({ ...question, options: createdOptions });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('createQuestion error:', err);
    res.status(500).json({ error: 'Failed to create question' });
  } finally {
    client.release();
  }
}

async function updateQuestion(req, res) {
  const client = await pool.connect();
  try {
    const { question_type, anatomical_system, difficulty, question_text, image_url, explanation, options } =
      req.body;

    const {
      rows: [existing],
    } = await client.query('SELECT id FROM questions WHERE id = $1', [req.params.id]);
    if (!existing) return res.status(404).json({ error: 'Question not found' });

    await client.query('BEGIN');

    const {
      rows: [question],
    } = await client.query(
      `UPDATE questions SET question_type=$1, anatomical_system=$2, difficulty=$3,
       question_text=$4, image_url=$5, explanation=$6
       WHERE id=$7 RETURNING *`,
      [question_type, anatomical_system, difficulty, question_text, image_url || null, explanation, req.params.id]
    );

    if (options && Array.isArray(options)) {
      await client.query('DELETE FROM question_options WHERE question_id = $1', [req.params.id]);
      for (const opt of options) {
        await client.query(
          'INSERT INTO question_options (question_id, option_text, is_correct, label) VALUES ($1, $2, $3, $4)',
          [req.params.id, opt.option_text, opt.is_correct, opt.label]
        );
      }
    }

    await client.query('COMMIT');

    const { rows: updatedOptions } = await pool.query(
      'SELECT * FROM question_options WHERE question_id = $1 ORDER BY label',
      [req.params.id]
    );

    res.json({ ...question, options: updatedOptions });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('updateQuestion error:', err);
    res.status(500).json({ error: 'Failed to update question' });
  } finally {
    client.release();
  }
}

async function deleteQuestion(req, res) {
  try {
    const { rowCount } = await pool.query('DELETE FROM questions WHERE id = $1', [req.params.id]);
    if (rowCount === 0) return res.status(404).json({ error: 'Question not found' });
    res.json({ message: 'Question deleted successfully' });
  } catch (err) {
    console.error('deleteQuestion error:', err);
    res.status(500).json({ error: 'Failed to delete question' });
  }
}

module.exports = {
  startQuiz,
  submitAnswer,
  finishQuiz,
  getResults,
  getProgress,
  getQuestions,
  getQuestionById,
  createQuestion,
  updateQuestion,
  deleteQuestion,
};
