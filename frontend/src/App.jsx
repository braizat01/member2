import { HashRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import QuizApp from './components/QuizApp.jsx';
import ResultsPage from './components/ResultsPage.jsx';
import ProgressDashboard from './components/ProgressDashboard.jsx';

const navStyle = {
  display: 'flex',
  gap: '24px',
  alignItems: 'center',
  padding: '14px 32px',
  background: '#1e3a5f',
  boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
};

const brandStyle = {
  color: '#fff',
  fontWeight: 700,
  fontSize: '18px',
  textDecoration: 'none',
  marginRight: 'auto',
};

const linkStyle = {
  color: '#90cdf4',
  textDecoration: 'none',
  fontSize: '14px',
  fontWeight: 500,
  padding: '6px 14px',
  borderRadius: '6px',
  transition: 'background 0.2s',
};

function NavLink({ to, children }) {
  const location = useLocation();
  const active = location.hash === `#${to}` || (to === '/' && location.hash === '');
  return (
    <Link to={to} style={{ ...linkStyle, background: active ? 'rgba(255,255,255,0.15)' : 'transparent' }}>
      {children}
    </Link>
  );
}

function Nav() {
  return (
    <nav style={navStyle}>
      <Link to="/" style={brandStyle}>
        3D Anatomy Quiz
      </Link>
      <NavLink to="/">Take Quiz</NavLink>
      <NavLink to="/progress">Progress</NavLink>
    </nav>
  );
}

export default function App() {
  return (
    <HashRouter>
      <Nav />
      <Routes>
        <Route path="/" element={<QuizApp />} />
        <Route path="/results/:sessionId" element={<ResultsPage />} />
        <Route path="/progress" element={<ProgressDashboard />} />
      </Routes>
    </HashRouter>
  );
}
