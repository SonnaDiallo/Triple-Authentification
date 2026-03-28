const BASE = '/api';

async function request(endpoint, body) {
  const res = await fetch(`${BASE}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(body)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Erreur serveur');
  return data;
}

export const register = (payload) => request('/register', payload);
export const loginStep1 = (payload) => request('/login/step1', payload);
export const loginStep2 = (payload) => request('/login/step2', payload);
export const loginStep3 = (payload) => request('/login/step3', payload);
export async function logout() {
  const res = await fetch(`${BASE}/logout`, { method: 'POST', credentials: 'include' });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Déconnexion impossible');
  }
}