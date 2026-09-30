/* =========================================================
   AGENTIA — guest-guard.js
   Loaded on login.html / signup.html. If a token already
   exists, there's no reason to show the form again.
   ========================================================= */
(function () {
  const token = localStorage.getItem('agentia_token');
  if (token) {
    window.location.replace('dashboard.html');
  }
})();
