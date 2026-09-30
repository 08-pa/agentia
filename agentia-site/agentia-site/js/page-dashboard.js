/* =========================================================
   AGENTIA — page-dashboard.js
   ========================================================= */
(function () {
  const api = window.AgentiaAPI;
  const ui = window.AgentiaUI;

  function reportId(r) {
    return r.report_id || r._id || r.id;
  }

  function renderRecentReports(reports) {
    const mount = document.getElementById('recent-reports');
    if (!mount) return;
    if (!reports.length) {
      mount.innerHTML = '<div class="empty-state">No research yet. <a href="research.html">Run your first query →</a></div>';
      return;
    }
    mount.innerHTML = reports
      .slice(0, 4)
      .map(
        (r) => `
        <a class="report-list-item" href="report.html?id=${encodeURIComponent(reportId(r))}">
          <p class="report-list-title">${ui.escapeHtml(r.query || 'Untitled query')}</p>
          <div class="report-list-meta">
            <span>${ui.formatDate(r.created_at || r.timestamp) || ''}</span>
            ${r.subtopics ? `<span>${r.subtopics.length} subtopics</span>` : ''}
          </div>
        </a>`
      )
      .join('');
  }

  function renderRecentHistory(history) {
    const mount = document.getElementById('recent-history');
    if (!mount) return;
    if (!history.length) {
      mount.innerHTML = '<div class="empty-state">Nothing logged yet — history fills in as you research.</div>';
      return;
    }
    mount.innerHTML = history
      .slice(0, 6)
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
    const user = api.getUser();
    const greeting = document.getElementById('greeting');
    if (greeting && user) greeting.textContent = 'Welcome back, ' + (user.username || 'researcher');

    try {
      const [reports, saved, history] = await Promise.all([api.getReports(), api.getSavedReports(), api.getHistory()]);

      document.getElementById('stat-reports').textContent = reports.length;
      document.getElementById('stat-saved').textContent = saved.length;
      document.getElementById('stat-history').textContent = history.length;

      renderRecentReports(reports);
      renderRecentHistory(history);
    } catch (err) {
      ['recent-reports', 'recent-history'].forEach((id) => {
        const el = document.getElementById(id);
        if (el) el.innerHTML = `<div class="empty-state">${ui.escapeHtml(err.message)}</div>`;
      });
    }
  });
})();
