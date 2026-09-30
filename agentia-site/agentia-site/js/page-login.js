/* =========================================================
   AGENTIA — page-login.js
   ========================================================= */
(function () {
  const api = window.AgentiaAPI;
  const form = document.getElementById('login-form');
  const btn = document.getElementById('login-btn');
  const errorEl = document.getElementById('login-error');

  function showError(message) {
    errorEl.textContent = message;
    errorEl.style.display = 'block';
  }
  function clearError() {
    errorEl.textContent = '';
    errorEl.style.display = 'none';
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearError();
    btn.disabled = true;
    btn.textContent = 'Logging in…';

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    try {
      const data = await api.login({ email, password });
      api.setSession(data.access_token, data.user);
      const next = new URLSearchParams(window.location.search).get('next');
      window.location.href = next && /^[\w-]+\.html$/.test(next) ? next : 'dashboard.html';
    } catch (err) {
      showError(err.message);
      btn.disabled = false;
      btn.textContent = 'Log in  →';
    }
  });
})();
