/* =========================================================
   AGENTIA — scene-pipeline.js
   Drives the .pipeline-row active/done classes on the
   Research page while a real /research request is in flight.
   Timed to roughly match how long each backend stage tends
   to take, but always resolves instantly once the real
   response comes back — this is a progress indicator, not a
   simulation of the actual work.
   ========================================================= */
(function () {
  function run(rootEl, { stageDelays = [1200, 2400] } = {}) {
    const rows = Array.from(rootEl.querySelectorAll('.pipeline-row'));
    rows.forEach((r) => r.classList.remove('active', 'done'));

    const timers = [];
    let i = 0;

    function activate(index) {
      if (index > 0) rows[index - 1].classList.remove('active');
      if (index > 0) rows[index - 1].classList.add('done');
      if (rows[index]) rows[index].classList.add('active');
    }

    activate(0);
    stageDelays.forEach((delay, idx) => {
      const t = setTimeout(() => activate(idx + 1), stageDelays.slice(0, idx + 1).reduce((a, b) => a + b, 0));
      timers.push(t);
    });

    return {
      finish() {
        timers.forEach(clearTimeout);
        rows.forEach((r) => {
          r.classList.remove('active');
          r.classList.add('done');
        });
      },
      cancel() {
        timers.forEach(clearTimeout);
        rows.forEach((r) => r.classList.remove('active', 'done'));
      },
    };
  }

  window.AgentiaPipeline = { run };
})();
