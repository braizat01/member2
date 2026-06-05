const BASE_URL = import.meta.env.VITE_API_URL || '';

function getHeaders() {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: { ...getHeaders(), ...(options.headers || {}) },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `Request failed with status ${res.status}`);
  return data;
}

export function startQuiz(filters) {
  return request('/api/quiz/start', { method: 'POST', body: JSON.stringify(filters) });
}

export function submitAnswer(payload) {
  return request('/api/quiz/answer', { method: 'POST', body: JSON.stringify(payload) });
}

export function finishQuiz(session_id) {
  return request('/api/quiz/finish', { method: 'POST', body: JSON.stringify({ session_id }) });
}

export function getResults(sessionId) {
  return request(`/api/quiz/results/${sessionId}`);
}

export function getProgress() {
  return request('/api/quiz/progress');
}

export function getQuestions(params = {}) {
  const qs = new URLSearchParams(params).toString();
  return request(`/api/questions${qs ? '?' + qs : ''}`);
}

export function createQuestion(payload) {
  return request('/api/questions', { method: 'POST', body: JSON.stringify(payload) });
}

export function updateQuestion(id, payload) {
  return request(`/api/questions/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
}

export function deleteQuestion(id) {
  return request(`/api/questions/${id}`, { method: 'DELETE' });
}
