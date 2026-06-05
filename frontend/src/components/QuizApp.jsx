import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { startQuiz, submitAnswer, finishQuiz } from '../api/quizApi.js';

const SYSTEMS = ['Skeletal', 'Muscular', 'Nervous', 'Cardiovascular', 'Respiratory', 'Digestive'];
const TYPES = [
  { value: 'multiple_choice', label: 'Multiple Choice' },
  { value: 'identify_part', label: 'Identify the Part' },
  { value: 'clinical_scenario', label: 'Clinical Scenario' },
];

const s = {
  page: { minHeight: 'calc(100vh - 52px)', padding: '32px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center' },
  card: { background: '#fff', borderRadius: '12px', boxShadow: '0 4px 24px rgba(0,0,0,0.08)', padding: '36px', width: '100%', maxWidth: '680px' },
  title: { fontSize: '26px', fontWeight: 700, color: '#1e3a5f', marginBottom: '24px', textAlign: 'center' },
  label: { display: 'block', marginBottom: '6px', fontWeight: 600, fontSize: '13px', color: '#4a5568', textTransform: 'uppercase', letterSpacing: '0.05em' },
  select: { width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid #cbd5e0', fontSize: '15px', color: '#2d3748', outline: 'none', background: '#fff', marginBottom: '18px' },
  input: { width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid #cbd5e0', fontSize: '15px', color: '#2d3748', outline: 'none', marginBottom: '18px' },
  btn: { display: 'block', width: '100%', padding: '13px', background: '#2b6cb0', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 600, cursor: 'pointer', marginTop: '8px' },
  btnDisabled: { background: '#a0aec0', cursor: 'not-allowed' },
  error: { background: '#fff5f5', border: '1px solid #fc8181', borderRadius: '8px', padding: '12px 16px', color: '#c53030', marginBottom: '16px', fontSize: '14px' },
  progressBar: { width: '100%', maxWidth: '680px', marginBottom: '16px' },
  progressText: { fontSize: '13px', color: '#718096', marginBottom: '6px', fontWeight: 500 },
  progressTrack: { height: '6px', background: '#e2e8f0', borderRadius: '999px', overflow: 'hidden' },
  progressFill: (pct) => ({ height: '100%', width: `${pct}%`, background: '#2b6cb0', borderRadius: '999px', transition: 'width 0.3s' }),
  badge: { display: 'inline-block', padding: '3px 10px', borderRadius: '999px', fontSize: '12px', fontWeight: 600, marginRight: '8px', marginBottom: '14px' },
  questionText: { fontSize: '17px', lineHeight: '1.65', color: '#2d3748', marginBottom: '24px' },
  image: { width: '100%', maxHeight: '280px', objectFit: 'contain', borderRadius: '8px', marginBottom: '20px', border: '1px solid #e2e8f0' },
  option: (state) => ({
    display: 'block',
    width: '100%',
    padding: '13px 18px',
    marginBottom: '10px',
    borderRadius: '8px',
    border: `2px solid ${state === 'correct' ? '#38a169' : state === 'wrong' ? '#e53e3e' : state === 'selected' ? '#2b6cb0' : '#e2e8f0'}`,
    background: state === 'correct' ? '#f0fff4' : state === 'wrong' ? '#fff5f5' : state === 'selected' ? '#ebf8ff' : '#fff',
    color: '#2d3748',
    fontSize: '15px',
    textAlign: 'left',
    cursor: state === 'disabled' || state === 'correct' || state === 'wrong' ? 'default' : 'pointer',
    transition: 'all 0.15s',
  }),
  feedback: (correct) => ({
    marginTop: '20px',
    padding: '16px 20px',
    borderRadius: '10px',
    background: correct ? '#f0fff4' : '#fff5f5',
    border: `1px solid ${correct ? '#9ae6b4' : '#fc8181'}`,
  }),
  feedbackTitle: (correct) => ({ fontWeight: 700, fontSize: '16px', color: correct ? '#276749' : '#c53030', marginBottom: '8px' }),
  explanation: { fontSize: '14px', lineHeight: '1.6', color: '#4a5568', marginBottom: '14px' },
  nextBtn: { padding: '10px 28px', background: '#2b6cb0', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: 600, cursor: 'pointer' },
};

function getOptionState(opt, selectedOptionId, answered, feedback) {
  if (!answered) return selectedOptionId === opt.id ? 'selected' : 'default';
  if (opt.id === feedback.correct_option_id) return 'correct';
  if (opt.id === selectedOptionId && !feedback.is_correct) return 'wrong';
  return 'disabled';
}

function getBadgeStyle(type) {
  const colors = { multiple_choice: '#2b6cb0', identify_part: '#6b46c1', clinical_scenario: '#b7791f' };
  return { ...s.badge, background: colors[type] || '#718096', color: '#fff' };
}

export default function QuizApp() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState('setup');
  const [filters, setFilters] = useState({ anatomical_system: '', type: '', count: 10 });
  const [sessionId, setSessionId] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOptionId, setSelectedOptionId] = useState(null);
  const [answered, setAnswered] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleStart() {
    setLoading(true);
    setError(null);
    try {
      const body = { count: filters.count };
      if (filters.anatomical_system) body.anatomical_system = filters.anatomical_system;
      if (filters.type) body.type = filters.type;
      const data = await startQuiz(body);
      setSessionId(data.session_id);
      setQuestions(data.questions);
      setCurrentIndex(0);
      setSelectedOptionId(null);
      setAnswered(false);
      setFeedback(null);
      setPhase('quiz');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit() {
    if (!selectedOptionId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await submitAnswer({
        session_id: sessionId,
        question_id: questions[currentIndex].id,
        selected_option_id: selectedOptionId,
      });
      setFeedback(data);
      setAnswered(true);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleNext() {
    const isLast = currentIndex === questions.length - 1;
    if (isLast) {
      setLoading(true);
      try {
        await finishQuiz(sessionId);
        navigate(`/results/${sessionId}`);
      } catch (e) {
        setError(e.message);
        setLoading(false);
      }
      return;
    }
    setCurrentIndex((i) => i + 1);
    setSelectedOptionId(null);
    setAnswered(false);
    setFeedback(null);
  }

  if (phase === 'setup') {
    return (
      <div style={s.page}>
        <div style={s.card}>
          <h1 style={s.title}>Start a New Quiz</h1>
          <label style={s.label}>Anatomical System</label>
          <select
            style={s.select}
            value={filters.anatomical_system}
            onChange={(e) => setFilters((f) => ({ ...f, anatomical_system: e.target.value }))}
          >
            <option value="">All Systems</option>
            {SYSTEMS.map((sys) => (
              <option key={sys} value={sys}>{sys}</option>
            ))}
          </select>

          <label style={s.label}>Question Type</label>
          <select
            style={s.select}
            value={filters.type}
            onChange={(e) => setFilters((f) => ({ ...f, type: e.target.value }))}
          >
            <option value="">All Types</option>
            {TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>

          <label style={s.label}>Number of Questions</label>
          <input
            style={s.input}
            type="number"
            min="1"
            max="20"
            value={filters.count}
            onChange={(e) => setFilters((f) => ({ ...f, count: Math.max(1, parseInt(e.target.value) || 1) }))}
          />

          {error && <div style={s.error}>{error}</div>}

          <button
            style={{ ...s.btn, ...(loading ? s.btnDisabled : {}) }}
            onClick={handleStart}
            disabled={loading}
          >
            {loading ? 'Loading Questions...' : 'Start Quiz'}
          </button>
        </div>
      </div>
    );
  }

  const question = questions[currentIndex];
  const progress = Math.round(((currentIndex + (answered ? 1 : 0)) / questions.length) * 100);

  return (
    <div style={s.page}>
      <div style={s.progressBar}>
        <div style={s.progressText}>
          Question {currentIndex + 1} of {questions.length}
        </div>
        <div style={s.progressTrack}>
          <div style={s.progressFill(progress)} />
        </div>
      </div>

      <div style={s.card}>
        <div>
          <span style={getBadgeStyle(question.question_type)}>
            {question.question_type.replace(/_/g, ' ')}
          </span>
          <span style={{ ...s.badge, background: '#e2e8f0', color: '#4a5568' }}>
            {question.anatomical_system}
          </span>
          <span style={{ ...s.badge, background: '#fef3c7', color: '#92400e' }}>
            {question.difficulty}
          </span>
        </div>

        {question.image_url && (
          <img src={question.image_url} alt="Anatomy diagram" style={s.image} />
        )}

        <p style={s.questionText}>{question.question_text}</p>

        <div>
          {question.options.map((opt) => {
            const state = getOptionState(opt, selectedOptionId, answered, feedback);
            return (
              <button
                key={opt.id}
                style={s.option(state)}
                onClick={() => !answered && setSelectedOptionId(opt.id)}
                disabled={answered}
              >
                <span style={{ fontWeight: 700, marginRight: '10px' }}>{opt.label}.</span>
                {opt.option_text}
              </button>
            );
          })}
        </div>

        {error && <div style={s.error}>{error}</div>}

        {!answered && (
          <button
            style={{ ...s.btn, ...(!selectedOptionId || loading ? s.btnDisabled : {}) }}
            onClick={handleSubmit}
            disabled={!selectedOptionId || loading}
          >
            {loading ? 'Checking...' : 'Submit Answer'}
          </button>
        )}

        {answered && feedback && (
          <div style={s.feedback(feedback.is_correct)}>
            <div style={s.feedbackTitle(feedback.is_correct)}>
              {feedback.is_correct ? 'Correct!' : 'Incorrect'}
            </div>
            <p style={s.explanation}>{feedback.explanation}</p>
            <button style={s.nextBtn} onClick={handleNext} disabled={loading}>
              {loading ? 'Finishing...' : currentIndex === questions.length - 1 ? 'See Results' : 'Next Question'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
