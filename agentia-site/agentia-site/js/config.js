/* =========================================================
   AGENTIA — frontend config
   Change API_BASE_URL to wherever your FastAPI backend runs.
   Make sure this exact origin is listed in the backend's
   CORS_ORIGINS (backend/.env), or every request below will
   be blocked by the browser.
   ========================================================= */
window.AGENTIA_CONFIG = {
  API_BASE_URL: "http://localhost:8000"
};