import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getResults } from '../api/quizApi.js';

const s = {
  page: { minHeight: 'calc(100vh - 52px)', padding: '32px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center' },
  card: { background: '#fff', borderRadius: '12px', boxShadow: '0 4px 24px rgba(0,0,0,0.08)', padding: '36px', width: '100%', maxWidth: '720px', marginBottom: '20px' },
  scoreCircle: (pct) => ({
    width: '120px', height: '120px', borderRadius: '50%',
    background: pct >= 80 ? '#f0fff4' : pct >= 50 ? '#fefcbf' : '#fff5f5',
    border: `6px solid ${pct >= 80 ? '#38a169' : pct >= 50 ? '#d69e2e' : '#e53e3e'}`,
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    margin: '0 auto 24px',
  }),
  scoreNum: (pct) => ({ fontSize: '32px', fontWeight: 800, color: pct >= 80 ? '#276749' : pct >= 50 ? '#744210' : '#c53030' }),
  scorePct: { fontSize: '13px', color: '#718096', fontWeight: 500 },
  summaryTitle: { textAlign: 'center', fontSize: '22px', fontWeight: 700, color: '#1e3a5f', marginBottom: '8px' },
  summaryMeta: { textAlign: 'center', fontSize: '14px', color: '#718096', marginBottom: '28px' },
  divider: { border: 'none', borderTop: '1px solid #e2e8f0', margin: '20px 0' },
  sectionTitle: { fontSize: '17px', fontWeight: 700, color: '#2d3748', marginBottom: '16px' },
  reviewItem: (correct) => ({
    padding: '16px 18px', borderRadius: '10px', marginBottom: '14px',
    background: correct ? '#f0fff4' : '#fff5f5',
    border: `1.5px solid ${correct ? '#9ae6b4' : '#fc8181'}`,
  }),
  questionText: { fontSize: '14px', fontWeight: 600, color: '#2d3748', marginBottom: '10px', lineHeight: '1.5' },
  answerRow: { display: 'flex', gap: '24px', flexWrap: 'wrap', marginBottom: '8px' },
  answerLabel: { fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#718096', display: 'block', marginBottom: '2px' },
  answerText: (correct) => ({ fontSize: '14px', color: correct ? '#276749' : '#c53030', fontWeight: 600 }),
  explanation: { fontSize: '13px', color: '#4a5568', lineHeight: '1.55', marginTop: '8px', paddingTop: '8px', borderTop: '1px solid rgba(0,0,0,0.06)' },
  badge: { display: 'inline-block', padding: '2px 8px', borderRadius: '999px', fontSize: '11px', fontWeight: 600, marginRight: '6px', marginBottom: '6px' },
  actions: { display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap', marginTop: '8px' },
  btn: { padding: '11px 28px', background: '#2b6cb0', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: 600, cursor: 'pointer', textDecoration: 'none', display: 'inline-block' },
  btnOutline: { padding: '11px 28px', background: 'transparent', color: '#2b6cb0', border: '2px solid #2b6cb0', borderRadius: '8px', fontSize: '15px', fontWeight: 600, cursor: 'pointer', textDecoration: 'none', display: 'inline-block' },
  error: { background: '#fff5f5', border: '1px solid #fc8181', borderRadius: '8px', padding: '16px', color: '#c53030', textAlign: 'center' },
  loading: { textAlign: 'center', color: '#718096', padding: '60px 0', fontSize: '16px' },
};

function typeColor(type) {
  const map = { multiple_choice: '#2b6cb0', identify_part: '#6b46c1', clinical_scenario: '#b7791f' };
  return map[type] || '#718096';
}

export default function ResultsPage() {
  const { sessionId } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    getResults(sessionId)
      .then(setData)
      .catch((e) => setError(e.message));
  }, [sessionId]);

  if (error) {
    return (
      <div style={s.page}>
        <div style={{ ...s.card, ...s.error }}>{error}</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div style={s.page}>
        <div style={s.loading}>Loading results...</div>
      </div>
    );
  }

  const { session, answers } = data;
  const pct = session.score_percent;

  return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={s.scoreCircle(pct)}>
          <span style={s.scoreNum(pct)}>{pct}%</span>
          <span style={s.scorePct}>Score</span>
        </div>

        <h1 style={s.summaryTitle}>
          {pct >= 80 ? 'Excellent Work!' : pct >= 50 ? 'Good Effort!' : 'Keep Practicing!'}
        </h1>
        <p style={s.summaryMeta}>
          You answered {session.correct_count} out of {session.total_questions} questions correctly.
        </p>

        <div style={s.actions}>
          <Link to="/" style={s.btn}>Take Another Quiz</Link>
          <Link to="/progress" style={s.btnOutline}>View Progress</Link>
        </div>
      </div>

      <div style={s.card}>
        <h2 style={s.sectionTitle}>Question Review</h2>
        {answers.map((a, i) => (
          <div key={i} style={s.reviewItem(a.is_correct)}>
            <div style={{ marginBottom: '8px' }}>
              <span style={{ ...s.badge, background: typeColor(a.question_type), color: '#fff' }}>
                {a.question_type.replace(/_/g, ' ')}
              </span>
              <span style={{ ...s.badge, background: '#e2e8f0', color: '#4a5568' }}>
                {a.anatomical_system}
              </span>
            </div>

            {a.image_url && (
              <img
                src={a.image_url}
                alt="Question"
                style={{ width: '100%', maxHeight: '140px', objectFit: 'contain', borderRadius: '6px', marginBottom: '8px', border: '1px solid #e2e8f0' }}
              />
            )}

            <p style={s.questionText}>
              {i + 1}. {a.question_text}
            </p>

            <div style={s.answerRow}>
              <div>
                <span style={s.answerLabel}>Your Answer</span>
                <span style={s.answerText(a.is_correct)}>
                  {a.selected_label ? `${a.selected_label}. ` : ''}{a.selected_text || 'Not answered'}
                </span>
              </div>
              {!a.is_correct && (
                <div>
                  <span style={s.answerLabel}>Correct Answer</span>
                  <span style={s.answerText(true)}>
                    {a.correct_label}. {a.correct_text}
                  </span>
                </div>
              )}
            </div>

            <p style={s.explanation}>{a.explanation}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
