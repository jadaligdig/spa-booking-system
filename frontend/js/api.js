// Shared helper used by EVERY page. Talks to the REST API with fetch().
const API = '/api';

const getToken = () => localStorage.getItem('token');
const getUser = () => JSON.parse(localStorage.getItem('user') || 'null');

// api('GET', '/branches')   api('POST', '/branches', { name: '...' })
async function api(method, path, body) {
  const res = await fetch(API + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(getToken() ? { Authorization: 'Bearer ' + getToken() } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({ success: false, message: 'Server sent a bad response' }));
  if (res.status === 401 && !path.startsWith('/auth/login')) { logout(); }
  if (!json.success) {
    const err = new Error(json.message || 'Request failed');
    err.errors = json.errors || [];
    err.status = res.status;
    throw err;
  }
  return json.data;
}

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  location.href = '/index.html';
}

// Call at the top of every page except login
function requireLogin() {
  if (!getToken()) location.href = '/index.html';
}

// Small UI helpers: loading text + error/success box (every screen must show these)
function setLoading(on) { document.getElementById('loading')?.classList.toggle('on', on); }
function showMsg(text, type = 'error', errors = []) {
  const box = document.getElementById('msg');
  if (!box) return;
  box.className = 'msg ' + type;
  box.textContent = text + (errors.length ? ' - ' + errors.join('; ') : '');
}
function clearMsg() { const b = document.getElementById('msg'); if (b) b.className = 'msg'; }
