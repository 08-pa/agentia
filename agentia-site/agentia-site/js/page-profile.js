/* =========================================================
   AGENTIA — page-profile.js
   ========================================================= */
(function () {
  const api = window.AgentiaAPI;
  const ui = window.AgentiaUI;

  function renderProfile(user) {
    const mount = document.getElementById('profile-panel');
    if (!mount || !user) return;
    mount.innerHTML = `
      <div class="profile-head" style="display:flex; align-items:center; gap:16px; margin-bottom:24px;">
        <span class="user-avatar" style="height:48px; width:48px; font-size:1.1rem;">${(user.username || '?').charAt(0).toUpperCase()}</span>
        <div>
          <p style="font-family:var(--font-display); font-size:1.2rem; margin:0;">${ui.escapeHtml(user.username || '')}</p>
          <p style="color:var(--text-dim); font-size:0.9rem; margin:2px 0 0;">${ui.escapeHtml(user.email || '')}</p>
        </div>
      </div>
      <div style="border-top:1px solid var(--line-soft); padding-top:16px;">
        <p class="stat-label" style="margin-bottom:6px;">User ID</p>
        <p style="font-family:var(--font-mono); font-size:0.85rem; color:var(--text-dim); word-break:break-all;">${ui.escapeHtml(user.user_id || user.id || user._id || '')}</p>
      </div>
    `;
  }

  function renderHistory(history) {
    const mount = document.getElementById('history-list');
    if (!mount) return;
    if (!history.length) {
      mount.innerHTML = '<div class="empty-state">No queries yet.</div>';
      return;
    }
    mount.innerHTML = history
      .slice(0, 8)
      .map((item) => {
        const q = typeof item === 'string' ? item : item.query || item.text || '';
        const when = typeof item === 'object' ? item.timestamp || item.created_at : null;
        return `
        <div class="history-row">
          <span class="history-row-text">${ui.escapeHtml(q)}</span>
          ${when ? `<span class="history-row-date">${ui.formatDate(when)}</span>` : ''}
        </div>`;
      })
      .join('');
  }

  document.addEventListener('DOMContentLoaded', async () => {
    renderProfile(api.getUser());

    try {
      const freshUser = await api.me();
      if (freshUser) {
        api.setSession(null, freshUser);
        renderProfile(freshUser);
      }
    } catch {
      // fall back silently to the cached user already rendered above
    }

    try {
      const history = await api.getHistory();
      renderHistory(history);
    } catch (err) {
      document.getElementById('history-list').innerHTML = `<div class="empty-state">${ui.escapeHtml(err.message)}</div>`;
    }

    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', async () => {
        logoutBtn.disabled = true;
        logoutBtn.textContent = 'Logging out…';
        try {
          await api.logout();
        } finally {
          api.clearSession();
          window.location.href = 'index.html';
        }
      });
    }
  });
})();
