/* =========================================================
   AGENTIA — page-library.js
   ========================================================= */
(function () {
  const api = window.AgentiaAPI;
  const ui = window.AgentiaUI;

  function reportId(r) {
    return r.report_id || r._id || r.id;
  }

  let allReports = [];
  let savedReports = [];
  let savedIds = new Set();

  function render(list, emptyMessage) {
    const mount = document.getElementById('library-list');
    if (!mount) return;
    if (!list.length) {
      mount.innerHTML = `<div class="empty-state">${emptyMessage}</div>`;
      return;
    }
    mount.innerHTML = list
      .map((r) => {
        const id = reportId(r);
        const isSaved = savedIds.has(id);
        return `
        <div class="report-list-item" style="display:flex; align-items:flex-start; justify-content:space-between; gap:12px;">
          <a href="report.html?id=${encodeURIComponent(id)}" style="flex:1; min-width:0;">
            <p class="report-list-title">${ui.escapeHtml(r.query || 'Untitled query')}</p>
            <div class="report-list-meta">
              <span>${ui.formatDate(r.created_at || r.timestamp) || ''}</span>
              ${r.subtopics ? `<span>${r.subtopics.length} subtopics</span>` : ''}
            </div>
          </a>
          <button class="save-toggle ${isSaved ? 'is-saved' : ''}" data-save-id="${ui.escapeHtml(id)}" title="${isSaved ? 'Saved' : 'Save this report'}" type="button">
            ${isSaved ? '★' : '☆'}
          </button>
        </div>`;
      })
      .join('');

    mount.querySelectorAll('[data-save-id]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-save-id');
        btn.disabled = true;
        try {
          await api.saveReport(id);
          savedIds.add(id);
          btn.classList.add('is-saved');
          btn.textContent = '★';
        } catch {
          // silently ignore — the star just won't toggle
        } finally {
          btn.disabled = false;
        }
      });
    });
  }

  function activateTab(name) {
    document.getElementById('tab-all').classList.toggle('is-active', name === 'all');
    document.getElementById('tab-saved').classList.toggle('is-active', name === 'saved');
    if (name === 'all') render(allReports, 'No research yet. <a href="research.html">Run your first query →</a>');
    else render(savedReports, 'Nothing saved yet — bookmark a report from its page to find it here.');
  }

  document.addEventListener('DOMContentLoaded', async () => {
    document.getElementById('tab-all').addEventListener('click', () => activateTab('all'));
    document.getElementById('tab-saved').addEventListener('click', () => activateTab('saved'));

    try {
      const [reports, saved] = await Promise.all([api.getReports(), api.getSavedReports()]);
      allReports = reports;
      savedReports = saved;
      savedIds = new Set(saved.map(reportId));
      activateTab('all');
    } catch (err) {
      document.getElementById('library-list').innerHTML = `<div class="empty-state">${ui.escapeHtml(err.message)}</div>`;
    }
  });
})();
