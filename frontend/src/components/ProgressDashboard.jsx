import { useState, useEffect } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
} from 'recharts';
import { getProgress } from '../api/quizApi.js';

const s = {
  page: { minHeight: 'calc(100vh - 52px)', padding: '32px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center' },
  title: { fontSize: '24px', fontWeight: 700, color: '#1e3a5f', marginBottom: '24px', alignSelf: 'flex-start', width: '100%', maxWidth: '760px' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px', width: '100%', maxWidth: '760px', marginBottom: '24px' },
  statCard: { background: '#fff', borderRadius: '10px', boxShadow: '0 2px 12px rgba(0,0,0,0.07)', padding: '20px', textAlign: 'center' },
  statValue: { fontSize: '28px', fontWeight: 800, color: '#2b6cb0', marginBottom: '4px' },
  statLabel: { fontSize: '12px', color: '#718096', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' },
  chartCard: { background: '#fff', borderRadius: '12px', boxShadow: '0 4px 24px rgba(0,0,0,0.08)', padding: '28px', width: '100%', maxWidth: '760px', marginBottom: '20px' },
  chartTitle: { fontSize: '16px', fontWeight: 700, color: '#2d3748', marginBottom: '20px' },
  empty: { textAlign: 'center', color: '#a0aec0', padding: '40px 0', fontSize: '15px' },
  error: { background: '#fff5f5', border: '1px solid #fc8181', borderRadius: '8px', padding: '16px', color: '#c53030', textAlign: 'center', width: '100%', maxWidth: '760px' },
  loading: { textAlign: 'center', color: '#718096', padding: '80px 0', fontSize: '16px' },
};

const BAR_COLORS = ['#2b6cb0', '#6b46c1', '#38a169', '#d69e2e', '#e53e3e', '#319795'];

function AccuracyGauge({ value }) {
  const color = value >= 80 ? '#38a169' : value >= 50 ? '#d69e2e' : '#e53e3e';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ fontSize: '48px', fontWeight: 800, color }}>{value}%</div>
      <div style={{ fontSize: '13px', color: '#718096', fontWeight: 500 }}>Overall Accuracy</div>
    </div>
  );
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

export default function ProgressDashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    getProgress()
      .then(setData)
      .catch((e) => setError(e.message));
  }, []);

  if (error) {
    return (
      <div style={s.page}>
        <div style={s.error}>{error}</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div style={s.page}>
        <div style={s.loading}>Loading progress...</div>
      </div>
    );
  }

  const { overall, history, system_stats } = data;

  const historyChartData = history.map((h, i) => ({
    session: `#${i + 1}`,
    date: formatDate(h.started_at),
    score: h.score_percent,
  }));

  const systemChartData = system_stats.map((s) => ({
    system: s.anatomical_system,
    accuracy: parseInt(s.accuracy) || 0,
    total: parseInt(s.total_answered),
  }));

  return (
    <div style={s.page}>
      <h1 style={s.title}>My Progress</h1>

      <div style={s.statsGrid}>
        <div style={s.statCard}>
          <div style={s.statValue}>{overall.total_sessions}</div>
          <div style={s.statLabel}>Sessions Completed</div>
        </div>
        <div style={s.statCard}>
          <div style={s.statValue}>{overall.overall_accuracy}%</div>
          <div style={s.statLabel}>Overall Accuracy</div>
        </div>
        <div style={s.statCard}>
          <div style={s.statValue}>{overall.total_correct}</div>
          <div style={s.statLabel}>Correct Answers</div>
        </div>
        <div style={s.statCard}>
          <div style={s.statValue}>{overall.total_questions}</div>
          <div style={s.statLabel}>Total Questions</div>
        </div>
      </div>

      <div style={s.chartCard}>
        <div style={s.chartTitle}>Score History (last 30 sessions)</div>
        {historyChartData.length === 0 ? (
          <div style={s.empty}>No completed sessions yet. Take a quiz to see your progress!</div>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={historyChartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="session" tick={{ fontSize: 12, fill: '#718096' }} />
              <YAxis domain={[0, 100]} unit="%" tick={{ fontSize: 12, fill: '#718096' }} />
              <Tooltip
                formatter={(val) => [`${val}%`, 'Score']}
                contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px' }}
              />
              <Legend wrapperStyle={{ fontSize: '13px' }} />
              <Line
                type="monotone"
                dataKey="score"
                name="Score"
                stroke="#2b6cb0"
                strokeWidth={2.5}
                dot={{ r: 4, fill: '#2b6cb0' }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      <div style={s.chartCard}>
        <div style={s.chartTitle}>Accuracy by Anatomical System</div>
        {systemChartData.length === 0 ? (
          <div style={s.empty}>No data available yet.</div>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={systemChartData} margin={{ top: 5, right: 20, left: 0, bottom: 30 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis
                dataKey="system"
                tick={{ fontSize: 11, fill: '#718096' }}
                angle={-30}
                textAnchor="end"
                interval={0}
              />
              <YAxis domain={[0, 100]} unit="%" tick={{ fontSize: 12, fill: '#718096' }} />
              <Tooltip
                formatter={(val, name) => [`${val}%`, name === 'accuracy' ? 'Accuracy' : name]}
                contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px' }}
              />
              <Legend wrapperStyle={{ fontSize: '13px' }} />
              <Bar dataKey="accuracy" name="Accuracy" radius={[4, 4, 0, 0]}>
                {systemChartData.map((_, index) => (
                  <Cell key={index} fill={BAR_COLORS[index % BAR_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div style={s.chartCard}>
        <div style={s.chartTitle}>Questions Attempted per System</div>
        {systemChartData.length === 0 ? (
          <div style={s.empty}>No data available yet.</div>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={systemChartData} margin={{ top: 5, right: 20, left: 0, bottom: 30 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis
                dataKey="system"
                tick={{ fontSize: 11, fill: '#718096' }}
                angle={-30}
                textAnchor="end"
                interval={0}
              />
              <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#718096' }} />
              <Tooltip
                contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px' }}
              />
              <Legend wrapperStyle={{ fontSize: '13px' }} />
              <Bar dataKey="total" name="Questions Attempted" fill="#6b46c1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
