# VoteSmart — AI Voting Companion

A full-stack, AI-powered web application that helps voters understand and navigate the Indian election process. Built with React, Node.js/Express, and Claude AI (Anthropic).

---

## Project Structure

```
ai-voting-companion/
├── package.json                  ← Root scripts (run both apps concurrently)
├── docker-compose.yml            ← Full production orchestration
├── .env.example                  ← Root env template for docker-compose
├── README.md
├── .gitignore
│
├── backend/
│   ├── server.js                 ← Express entry point
│   ├── package.json
│   ├── Dockerfile
│   ├── .dockerignore
│   ├── .env.example              ← Backend env template
│   ├── routes/
│   │   ├── journey.js            ← POST /api/journey/generate
│   │   ├── simulation.js         ← GET/POST /api/simulation/*
│   │   ├── constituency.js       ← GET /api/constituency/*
│   │   ├── chat.js               ← POST /api/chat/message
│   │   └── mythbuster.js         ← POST /api/mythbuster/check
│   ├── services/
│   │   ├── aiService.js          ← Anthropic Claude (cache + retry + sanitize)
│   │   ├── cacheService.js       ← LRU cache with TTL
│   │   └── loggerService.js      ← Structured JSON logging
│   ├── data/
│   │   └── constituencies.json   ← 16 Indian constituency records (8 states)
│   └── tests/
│       └── smoke.test.js         ← 26 non-AI route tests
│
└── frontend/
    ├── package.json
    ├── Dockerfile
    ├── .dockerignore
    ├── nginx.conf                ← SPA routing + gzip + cache headers
    └── src/
        ├── App.js                ← Router + ErrorBoundary + React.lazy
        ├── index.js
        ├── styles/globals.css
        ├── services/
        │   ├── api.js            ← Axios (timeout, error normalisation, API key)
        │   └── AppContext.js     ← Global user context
        ├── components/
        │   ├── layout/Navbar.js
        │   └── shared/ErrorBoundary.js  ← Catches render crashes per page
        └── pages/
            ├── Home.js / Home.css
            ├── Journey.js / Journey.css
            ├── Simulation.js / Simulation.css
            ├── Constituency.js / Constituency.css
            ├── Chat.js / Chat.css
            └── MythBuster.js / MythBuster.css
```

---

## Quick Start (Development)

### Prerequisites
- Node.js v18+
- An Anthropic API key → https://console.anthropic.com

### 1. Install all dependencies
```bash
npm run install:all
```

### 2. Configure backend environment
```bash
cp backend/.env.example backend/.env
# Edit backend/.env and set ANTHROPIC_API_KEY
```

### 3. Run both servers
```bash
npm run dev
# Frontend: http://localhost:3000
# Backend:  http://localhost:5000
```

### 4. Run smoke tests
```bash
cd backend && npm test
# 26 tests, 0 external dependencies, no API key needed
```

---

## Production Deployment (Docker)

```bash
# 1. Configure environment
cp .env.example .env
# Edit .env — set ANTHROPIC_API_KEY and FRONTEND_URL

# 2. Build and start
docker-compose up --build -d

# 3. Verify
curl http://localhost:5000/api/health
curl http://localhost/
```

---

## Features

| Feature | Description |
|---|---|
| Guided Voter Journey | AI-generated 4-step personalized guide with PDF export |
| Voter Simulation | 16-scene branching decision tree with scoring |
| Constituency Insights | Historical election data + AI analysis for 16 constituencies across 8 states |
| AI Election Coach | Context-aware chat powered by Claude (English + Hindi) |
| MythBuster | Election claim verification with confidence score |
| Multi-language | English and Hindi across all features |

---

## API Endpoints

| Method | Route | Description |
|---|---|---|
| POST | /api/journey/generate | Generate personalized voter journey (AI, cached 2h) |
| GET | /api/journey/voter-types | List voter types |
| GET | /api/simulation/start | Get opening scenario |
| POST | /api/simulation/choice | Submit decision, get next scene |
| GET | /api/constituency/locations | All countries/states/cities |
| GET | /api/constituency/search | Search by state/city |
| GET | /api/constituency/:id | Full constituency data |
| POST | /api/constituency/:id/insights | AI analysis (cached 4h) |
| POST | /api/chat/message | Chat with AI coach |
| GET | /api/chat/suggestions | Suggested prompts |
| POST | /api/mythbuster/check | Fact-check a claim (AI, cached 4h) |
| GET | /api/mythbuster/examples | Example claims |
| GET | /api/health | Health check + uptime |
| GET | /api/cache/stats | Cache hit statistics |

---

## Production Features

### Backend
- **Startup validation** — exits immediately if `ANTHROPIC_API_KEY` is missing
- **Request IDs** — every request tagged with UUID; propagated to logs and response headers
- **Structured logging** — JSON in production, color-coded in development
- **LRU cache** — AI responses cached (journey 2h, insights 4h, mythbuster 4h) — max 500 entries
- **Exponential backoff retry** — 3 attempts on 429/529/500 errors (800ms, 1600ms, 3200ms)
- **Split rate limits** — 200/15min general, 30/15min for AI endpoints
- **Prompt injection defense** — user inputs sanitized (newlines stripped) before AI interpolation
- **Role validation** — chat rejects `system` role, enforces user-first alternation
- **Multi-origin CORS** — comma-separated `FRONTEND_URL` for staging + production
- **Optional API key auth** — set `BACKEND_API_KEY` to lock the backend
- **Content Security Policy** — via Helmet
- **Graceful shutdown** — SIGTERM drains in-flight requests (10s timeout), then exits cleanly
- **Unhandled rejection logging** — prevents silent failures

### Frontend
- **ErrorBoundary per page** — component crash shows recovery UI, not blank screen
- **React.lazy code splitting** — each page loads only when navigated to
- **404 route** — unknown paths show a proper not-found page
- **Auto-resize textarea** — chat input grows with content (max 120px)
- **Timeout error messages** — 30s axios timeout with user-friendly copy
- **Network error messages** — "Cannot reach server" instead of generic error

### Infrastructure
- **Multi-stage Docker build** — frontend built with Node, served with nginx (smaller image)
- **nginx SPA config** — `try_files` fallback for React Router, gzip, immutable cache headers
- **Health-dependent startup** — docker-compose waits for backend healthcheck before starting frontend
- **Non-root Docker user** — backend runs as `appuser` (not root)

---

## Environment Variables

### Backend (`backend/.env`)
| Variable | Required | Default | Description |
|---|---|---|---|
| `ANTHROPIC_API_KEY` | Yes | — | Anthropic API key |
| `PORT` | No | 5000 | HTTP port |
| `NODE_ENV` | No | development | `development` or `production` |
| `FRONTEND_URL` | No | http://localhost:3000 | Comma-separated CORS origins |
| `BACKEND_API_KEY` | No | — | Enables X-Api-Key auth if set |

### Frontend (`frontend/.env.local`)
| Variable | Required | Default | Description |
|---|---|---|---|
| `REACT_APP_API_URL` | No | /api (proxied) | Backend base URL in production |
| `REACT_APP_API_KEY` | No | — | Sent as X-Api-Key if backend auth enabled |

---

## License
MIT — Built for PromptWars Hackathon
