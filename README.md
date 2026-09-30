# Agentia — Multi-Agent AI Research Platform

Ask a question → three agents (Planner, Executor, Synthesizer) plan it,
research it with live web search, and write it up as a cited report.
Login/logout with JWTs, MongoDB for persistence, Redis for caching repeat
queries and session logout, and a React + Three.js frontend with a
persistent 3D scene behind every page.

```
research-agent/
├── backend/            FastAPI + MongoDB + Redis + Groq + Tavily
└── frontend-app/        React + Vite + Tailwind + react-three-fiber
```

## Architecture

**Agents** (`backend/agents/`) — each one calls **Groq** for reasoning and
**Tavily** for live web search:
- `PlannerAgent` — breaks your question into 3–5 subtopics (Groq)
- `ExecutorAgent` — searches each subtopic (Tavily) and summarizes the
  results with citations (Groq)
- `SynthesizerAgent` — combines every finding into one markdown report with
  a sources section (Groq)

`backend/workflow.py` orchestrates all three and checks **Redis first** —
identical questions are served from cache instantly instead of re-running
the whole pipeline.

**Auth** — `POST /auth/signup` and `POST /auth/login` return a JWT
(`access_token`). Every other route reads the user from that token, not
from a body/query param. `POST /auth/logout` blacklists the token's `jti`
in Redis until it would have expired anyway, so a logged-out token stays
logged out even though JWTs are normally stateless.

**Data** — MongoDB stores users (bcrypt-hashed passwords), reports, and
query history, via Motor (async driver).

**Frontend** — 6 pages (Home, Login/Signup, Dashboard, Research, Library,
Profile) plus a report detail view, all sitting on top of one persistent
`react-three-fiber` scene. See `frontend-app/README.md` for details.

## Running it locally

### 1. Start MongoDB + Redis

```bash
docker compose up -d
```

(Or point `MONGO_URI` / `REDIS_URL` at existing instances if you already
run these.)

### 2. Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows — use `source venv/bin/activate` on Mac/Linux
pip install -r requirements.txt
cp .env.example .env
```

Edit `.env`:
- `GROQ_API_KEY` — from https://console.groq.com/keys
- `TAVILY_API_KEY` — from https://app.tavily.com/
- `JWT_SECRET` — generate one: `python -c "import secrets; print(secrets.token_hex(32))"`
- Leave `MONGO_URI` / `REDIS_URL` as-is if you used `docker compose up -d`

```bash
uvicorn main:app --reload --port 8000
```

Confirm it's healthy at **http://localhost:8000** — you should see
`{"status": "healthy", "mongo": true, "redis": true}`. If `mongo` or
`redis` show `false`, that service isn't reachable yet.

### 3. Frontend

```bash
cd frontend-app
npm install
cp .env.example .env      # VITE_API_URL=http://localhost:8000
npm run dev
```

Open the printed local URL (usually **http://localhost:5173**).

### 4. Try it

Sign up → you're logged in immediately (JWT issued on signup) → land on
the Dashboard → run a research query on the Research page → watch the
Plan/Gather/Synthesize animation → the report saves automatically and you
can bookmark it → find it again in Library → sign out (this actually
invalidates the token server-side via the Redis blacklist, not just a
local clear).

## Notes

- CORS is restricted to `CORS_ORIGINS` in the backend `.env` (defaults to
  the Vite dev port), not wide open — update it if you deploy the frontend
  elsewhere.
- Repeat the exact same research query and it'll come back near-instantly
  the second time — that's the Redis cache, not a faster model.
- `GROQ_MODEL` defaults to `llama-3.3-70b-versatile`; change it in
  `backend/.env` if you want a different Groq model.
