/* =========================================================
   AGENTIA — api.js
   Every network call in the app goes through here. Reads the
   backend origin from js/config.js and the JWT from
   localStorage, and normalizes FastAPI's error shape into a
   plain Error so every page can just do .catch(err => ...).
   ========================================================= */

(function () {
  const BASE = (window.AGENTIA_CONFIG && window.AGENTIA_CONFIG.API_BASE_URL) || 'http://localhost:8000';
  const TOKEN_KEY = 'agentia_token';
  const USER_KEY = 'agentia_user';

  function getToken() {
    return localStorage.getItem(TOKEN_KEY);
  }

  function getUser() {
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  function setSession(token, user) {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  function clearSession() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }

  async function request(path, { method = 'GET', body, auth = true, params } = {}) {
    let url = BASE + path;
    if (params) {
      const qs = new URLSearchParams(
        Object.entries(params).filter(([, v]) => v !== undefined && v !== null)
      ).toString();
      if (qs) url += (url.includes('?') ? '&' : '?') + qs;
    }

    const headers = { 'Content-Type': 'application/json' };
    if (auth) {
      const token = getToken();
      if (token) headers.Authorization = 'Bearer ' + token;
    }

    let res;
    try {
      res = await fetch(url, {
        method,
        headers,
        body: body !== undefined ? JSON.stringify(body) : undefined,
      });
    } catch {
      // fetch() throws only on network-level failure: backend down, wrong
      // origin/port, CORS block. This is the "Network Error" case.
      throw new Error(
        'Could not reach the backend at ' + BASE + '. Is it running, and does its CORS_ORIGINS include this page\'s origin?'
      );
    }

    let data = null;
    const text = await res.text();
    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        data = null;
      }
    }

    if (!res.ok) {
      let message = 'Request failed (' + res.status + ')';
      if (data) {
        if (typeof data.detail === 'string') message = data.detail;
        else if (Array.isArray(data.detail)) message = data.detail.map((d) => d.msg).join(', ');
      }
      const err = new Error(message);
      err.status = res.status;
      throw err;
    }

    return data;
  }

  const api = {
    getToken,
    getUser,
    setSession,
    clearSession,
    isAuthenticated: () => !!getToken(),

    // ---- auth ----
    signup: ({ username, email, password }) =>
      request('/auth/signup', { method: 'POST', auth: false, body: { username, email, password } }),
    login: ({ email, password }) =>
      request('/auth/login', { method: 'POST', auth: false, body: { email, password } }),
    logout: () => request('/auth/logout', { method: 'POST' }).catch(() => null),
    me: () => request('/auth/me'),

    // ---- research ----
    runResearch: (query) => request('/research', { method: 'POST', body: { query } }),
    getReports: () => request('/reports').then((d) => (d && d.reports) || []),
    getReport: (id) => request('/reports/' + encodeURIComponent(id)),
    saveReport: (id) => request('/reports/save', { method: 'POST', body: { report_id: id } }),
    getSavedReports: () => request('/reports/saved').then((d) => (d && d.reports) || []),
    getHistory: () => request('/users/me/history').then((d) => (d && d.history) || []),

    // ---- health ----
    health: () => request('/', { auth: false }),
  };

  window.AgentiaAPI = api;
})();
