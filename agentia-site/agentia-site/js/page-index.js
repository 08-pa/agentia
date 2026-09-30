/* =========================================================
   AGENTIA — page-index.js
   The marketing page itself is handled by script.js (hero
   console animation, 3D scene, reveal, mobile nav). This just
   swaps the header/hero CTAs to "Go to dashboard" if the
   visitor already has a session, instead of showing them a
   sign-up prompt they don't need.
   ========================================================= */
(function () {
  if (!window.AgentiaAPI || !window.AgentiaAPI.isAuthenticated()) return;

  const headerCta = document.getElementById('header-cta');
  if (headerCta) {
    headerCta.innerHTML = '<a href="dashboard.html" class="btn btn-solid">Go to dashboard →</a>';
  }

  const heroCta = document.getElementById('hero-cta');
  if (heroCta) {
    heroCta.textContent = 'Go to dashboard →';
    heroCta.href = 'dashboard.html';
  }
})();
