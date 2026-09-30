/* =========================================================
   AGENTIA — page-research.js
   ========================================================= */
(function () {
  const api = window.AgentiaAPI;
  const ui = window.AgentiaUI;

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

  document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('research-form');
    const queryInput = document.getElementById('query');
    const runBtn = document.getElementById('run-btn');
    const pipelinePanel = document.getElementById('pipeline-panel');
    const pipelineLive = document.getElementById('pipeline-live');
    const resultPanel = document.getElementById('result-panel');
    const errorEl = document.getElementById('research-error');
    const newQueryBtn = document.getElementById('new-query-btn');

    let currentReportId = null;
    let currentQuery = '';

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const query = queryInput.value.trim();
      if (!query) return;

      ui.clearError(errorEl);
      resultPanel.hidden = true;
      pipelinePanel.hidden = false;
      runBtn.disabled = true;
      runBtn.textContent = 'Running…';

      const pipeline = window.AgentiaPipeline.run(pipelineLive);

      try {
        const data = await api.runResearch(query);
        pipeline.finish();
        currentReportId = data.report_id;
        currentQuery = data.query || query;
        renderResult(data);
      } catch (err) {
        pipeline.cancel();
        pipelinePanel.hidden = true;
        ui.showError(errorEl, err);
      } finally {
        runBtn.disabled = false;
        runBtn.textContent = 'Run research  →';
      }
    });

    function renderResult(data) {
      setTimeout(() => {
        pipelinePanel.hidden = true;
        resultPanel.hidden = false;

        document.getElementById('result-query').textContent = data.query || currentQuery;
        document.getElementById('report-body').innerHTML = ui.renderMarkdown(data.report || '');

        const cachedBadge = document.getElementById('result-cached-badge');
        cachedBadge.style.display = data.cached ? 'inline-flex' : 'none';

        const idBadge = document.getElementById('result-id-badge');
        idBadge.textContent = 'report saved';

        const chips = document.getElementById('subtopic-chips');
        chips.innerHTML = Array.isArray(data.subtopics)
          ? data.subtopics.map((s) => `<li>${ui.escapeHtml(s)}</li>`).join('')
          : '';

        let isSaved = false;
        const saveBtn = document.getElementById('save-btn');
        saveBtn.textContent = '☆ Save to library';
        saveBtn.disabled = false;
        saveBtn.onclick = async () => {
          if (isSaved || !currentReportId) return;
          saveBtn.disabled = true;
          try {
            await api.saveReport(currentReportId);
            isSaved = true;
            saveBtn.textContent = '★ Saved';
          } catch (err) {
            alert(err.message);
            saveBtn.disabled = false;
          }
        };

        document.getElementById('pdf-btn').onclick = () => {
          if (!window.html2pdf) {
            alert('PDF export script did not load — check your internet connection and try again.');
            return;
          }
          const el = document.getElementById('pdf-export-root');
          el.classList.add('pdf-export');
          window
            .html2pdf()
            .set({
              margin: 14,
              filename: slugify(data.query || currentQuery) + '.pdf',
              html2canvas: { scale: 2, backgroundColor: '#ffffff' },
              jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
            })
            .from(el)
            .save()
            .then(() => el.classList.remove('pdf-export'));
        };
      }, 250);
    }

    if (newQueryBtn) {
      newQueryBtn.addEventListener('click', () => {
        resultPanel.hidden = true;
        queryInput.value = '';
        queryInput.focus();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }
  });
})();
