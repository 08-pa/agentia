/* =========================================================
   AGENTIA — page-report.js
   ========================================================= */
(function () {
  const api = window.AgentiaAPI;
  const ui = window.AgentiaUI;

  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');

  function showError(message) {
    document.getElementById('report-loading').hidden = true;
    const errEl = document.getElementById('report-error');
    errEl.hidden = false;
    errEl.textContent = message;
  }

  function slugify(text) {
    return (
      (text || 'report')
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-')
        .slice(0, 60) || 'report'
    );
  }

  document.addEventListener('DOMContentLoaded', async () => {
    if (!id) {
      showError('No report ID in the URL — go back to the library and open a report from there.');
      return;
    }

    let report;
    try {
      report = await api.getReport(id);
    } catch (err) {
      showError(err.message);
      return;
    }

    document.getElementById('report-loading').hidden = true;
    document.getElementById('report-panel').hidden = false;

    document.getElementById('result-query').textContent = report.query || 'Untitled query';
    document.getElementById('report-body').innerHTML = ui.renderMarkdown(report.report || '');

    if (report.cached) {
      document.getElementById('result-cached-badge').style.display = 'inline-flex';
    }
    const when = report.created_at || report.timestamp;
    if (when) {
      const dateBadge = document.getElementById('result-date-badge');
      dateBadge.textContent = ui.formatDate(when);
      dateBadge.style.display = 'inline-flex';
    }

    const chips = document.getElementById('subtopic-chips');
    if (Array.isArray(report.subtopics) && report.subtopics.length) {
      chips.innerHTML = report.subtopics.map((s) => `<li>${ui.escapeHtml(s)}</li>`).join('');
    }

    let isSaved = !!report.saved;
    const saveBtn = document.getElementById('save-btn');
    const setSaveBtnState = () => {
      saveBtn.textContent = isSaved ? '★ Saved' : '☆ Save to library';
    };
    setSaveBtnState();
    saveBtn.addEventListener('click', async () => {
      if (isSaved) return;
      saveBtn.disabled = true;
      try {
        await api.saveReport(id);
        isSaved = true;
        setSaveBtnState();
      } catch (err) {
        alert(err.message);
      } finally {
        saveBtn.disabled = false;
      }
    });

    document.getElementById('pdf-btn').addEventListener('click', () => {
      const el = document.getElementById('pdf-export-root');
      if (!window.html2pdf) {
        alert('PDF export script did not load — check your internet connection and try again.');
        return;
      }
      el.classList.add('pdf-export');
      window
        .html2pdf()
        .set({
          margin: 14,
          filename: slugify(report.query) + '.pdf',
          html2canvas: { scale: 2, backgroundColor: '#ffffff' },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        })
        .from(el)
        .save()
        .then(() => el.classList.remove('pdf-export'));
    });
  });
})();
