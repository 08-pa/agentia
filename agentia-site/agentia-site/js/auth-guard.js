/* =========================================================
   AGENTIA — auth-guard.js
   Loaded before the page renders on every authenticated page.
   No token → straight to login.html, no flash of protected
   content first.
   ========================================================= */
(function () {
  const token = localStorage.getItem('agentia_token');
  if (!token) {
    const next = encodeURIComponent(location.pathname.split('/').pop() || 'dashboard.html');
    window.location.replace('login.html?next=' + next);
  }
})();
