/* =========================================================
   AGENTIA — page-signup.js
   ========================================================= */
(function () {
  const api = window.AgentiaAPI;
  const form = document.getElementById('signup-form');
  const btn = document.getElementById('signup-btn');
  const errorEl = document.getElementById('signup-error');

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
    btn.textContent = 'Creating account…';

    const username = document.getElementById('username').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    try {
      // Backend issues a token directly on signup — no separate login call needed.
      const data = await api.signup({ username, email, password });
      api.setSession(data.access_token, data.user);
      window.location.href = 'dashboard.html';
    } catch (err) {
      showError(err.message);
      btn.disabled = false;
      btn.textContent = 'Create account  →';
    }
  });
})();
