/* =========================================================
   AGENTIA — ui.js
   Injects the app-shell header + footer into #shell-header /
   #shell-footer (present on Dashboard, Research, Library,
   Profile, Report), and exposes small shared helpers used by
   every page-*.js file.
   ========================================================= */

(function () {
  const NAV = [
    { href: 'dashboard.html', label: 'Dashboard', page: 'dashboard' },
    { href: 'research.html', label: 'Research', page: 'research' },
    { href: 'library.html', label: 'Library', page: 'library' },
    { href: 'profile.html', label: 'Profile', page: 'profile' },
  ];

  function renderHeader() {
    const mount = document.getElementById('shell-header');
    if (!mount) return;

    const current = document.body.getAttribute('data-page') || '';
    const user = window.AgentiaAPI ? window.AgentiaAPI.getUser() : null;
    const initial = user && user.username ? user.username.charAt(0).toUpperCase() : '?';

    mount.innerHTML = `
      <header class="app-header">
        <div class="wrap app-header-inner">
          <a href="dashboard.html" class="brand">
            <span class="brand-mark" aria-hidden="true">
              <svg viewBox="0 0 40 40" width="26" height="26">
                <circle cx="20" cy="8" r="3.4" class="node-a"/>
                <circle cx="8" cy="30" r="3.4" class="node-b"/>
                <circle cx="32" cy="30" r="3.4" class="node-c"/>
                <path d="M20 8 L8 30 L32 30 Z" fill="none" stroke="currentColor" stroke-width="1.1" opacity="0.5"/>
              </svg>
            </span>
            <span class="brand-word">Agentia</span>
          </a>
          <nav class="app-nav">
            ${NAV.map(
              (item) =>
                `<a href="${item.href}" class="${item.page === current ? 'is-active' : ''}">${item.label}</a>`
            ).join('')}
          </nav>
          <div class="app-header-user">
            <a href="profile.html" class="user-chip" title="${user ? user.email || '' : ''}">
              <span class="user-avatar">${initial}</span>
              <span class="user-name">${user ? user.username || 'Account' : 'Account'}</span>
            </a>
            <button class="btn btn-line btn-sm" id="global-logout-btn" type="button">Log out</button>
          </div>
          <button class="nav-toggle" id="app-nav-toggle" aria-label="Toggle menu" aria-expanded="false">
            <span></span><span></span><span></span>
          </button>
        </div>
        <nav class="app-nav-mobile" id="app-nav-mobile">
          ${NAV.map(
            (item) =>
              `<a href="${item.href}" class="${item.page === current ? 'is-active' : ''}">${item.label}</a>`
          ).join('')}
        </nav>
      </header>
    `;

    const toggle = document.getElementById('app-nav-toggle');
    const mobileNav = document.getElementById('app-nav-mobile');
    if (toggle && mobileNav) {
      toggle.addEventListener('click', () => {
        const open = mobileNav.classList.toggle('open');
        toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
    }

    const logoutBtn = document.getElementById('global-logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', async () => {
        logoutBtn.disabled = true;
        logoutBtn.textContent = 'Logging out…';
        try {
          await window.AgentiaAPI.logout();
        } finally {
          window.AgentiaAPI.clearSession();
          window.location.href = 'index.html';
        }
      });
    }
  }

  function renderFooter() {
    const mount = document.getElementById('shell-footer');
    if (!mount) return;
    mount.innerHTML = `
      <footer class="app-footer">
        <div class="wrap app-footer-inner">
          <span>Agentia — Planner · Executor · Synthesizer</span>
          <span id="app-footer-year"></span>
        </div>
      </footer>
    `;
    const yearEl = document.getElementById('app-footer-year');
    if (yearEl) yearEl.textContent = '© ' + new Date().getFullYear();
  }

  // ---------- shared helpers ----------
  function formatDate(value) {
    if (!value) return '';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str == null ? '' : String(str);
    return div.innerHTML;
  }

  function renderMarkdown(md) {
    if (!md) return '';
    if (window.marked && window.DOMPurify) {
      const raw = window.marked.parse(md);
      return window.DOMPurify.sanitize(raw);
    }
    // Fallback if the CDN scripts didn't load: show as escaped plain text.
    return '<pre style="white-space:pre-wrap;font-family:inherit;">' + escapeHtml(md) + '</pre>';
  }

  function showError(el, err) {
    if (!el) return;
    el.textContent = err && err.message ? err.message : 'Something went wrong.';
    el.style.display = 'block';
  }

  function clearError(el) {
    if (!el) return;
    el.textContent = '';
    el.style.display = 'none';
  }

  window.AgentiaUI = { formatDate, escapeHtml, renderMarkdown, showError, clearError };

  document.addEventListener('DOMContentLoaded', () => {
    renderHeader();
    renderFooter();
  });
})();
