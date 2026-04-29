# 🗳️ VoteSmart AI — AI Voting Companion

**VoteSmart AI** is an advanced, production-hardened web application designed to empower Indian voters. Powered by Google's cutting-edge **Gemini 2.5 Pro**, this platform provides real-time voter assistance, interactive myth-busting, customized voting journey checklists, and constituency-level insights. 

Built with scalability, security, and accessibility in mind, VoteSmart AI seamlessly integrates the **Google Cloud Ecosystem** (Cloud Run, Google Maps Platform, Firebase Analytics, Firestore, and Cloud Translation API) to deliver a highly reliable, low-latency, and personalized experience.

---

## ✨ Key Features

1. **🧑‍🏫 AI Chat Assistant**: Interactive voting coach powered by Gemini 2.5 Pro. Persists multi-turn conversations securely using Firebase Firestore. Automatically detects the user's language (Hindi vs English) using Google Cloud Translation and responds accordingly.
2. **📍 Constituency Insights**: Detailed data visualization for specific constituencies using Recharts, augmented by interactive maps driven by the **Google Maps JavaScript API**.
3. **🗺️ Personalized Voter Journey**: Step-by-step PDF checklist generation. Customizes instructions based on user location and voter type (e.g., General, NRI, PwD, First-time).
4. **🛡️ MythBuster**: Instant, AI-driven fact-checking engine to combat election misinformation and deepfakes.
5. **♿ Accessibility-First**: WCAG 2.1 AA compliant UI, keyboard navigability, high-contrast theming, and ARIA labels.

---

## 🔒 Security & Code Quality Implementations

VoteSmart AI is engineered with rigorous production standards:

- **DDoS & Rate Limiting**: `express-rate-limit` splits traffic quotas. Global limits block abuse, while strict API limits protect Gemini API quotas.
- **XSS & Parameter Pollution Defense**: Inputs are sanitized via `xss-clean` and `hpp`. Frontend uses DOMPurify and strict React rendering.
- **Content Security Policy (CSP)**: `helmet` enforces strict resource loading rules, blocking unauthorized inline scripts and untrusted domains.
- **Vulnerability Patching**: Deep dependency auditing resolves vulnerabilities (e.g., enforcing stable versions of `serialize-javascript`, `cross-spawn`).
- **Standardized Formatting**: Enforced `prettier` and `eslint` configurations across the entire repository.
- **Strict Error Handling**: Custom error boundaries in React prevent full-page crashes; backend utilizes a centralized `morgan` & `winston` structured logger with request-tracing UUIDs.
- **Production CI/CD Ready**: Multi-stage `Dockerfile` environments configured specifically for Google Cloud Run deployment.

---

## 🏗️ Architecture & Technology Stack

### Frontend (React 18)
- **Routing & State**: `react-router-dom` and React Context API.
- **UI & Animations**: `framer-motion` for micro-interactions, `recharts` for dataviz, Vanilla CSS (PostCSS) for styling.
- **Google Ecosystem**: Google Maps API (`@react-google-maps/api`), Firebase Analytics (Event Tracking), Firebase Firestore (Chat Persistence).
- **Fonts**: `Inter` and `Plus Jakarta Sans` optimized via Google Fonts.

### Backend (Node.js & Express)
- **AI Engine**: `@google/genai` (Gemini 2.5 Pro).
- **Translation**: `@google-cloud/translate` (Auto-language detection and deep integration).
- **Performance**: In-memory `lru-cache` for idempotent API routes (like MythBuster and Journey checklists) reducing LLM latency by up to 90% on cache-hits.
- **Security**: `cors`, `helmet`, `hpp`, `xss-clean`, `express-rate-limit`.

---

## 🚀 Quick Start (Local Development)

### Prerequisites
- Node.js (v18+)
- Docker & Docker Compose (optional)
- A Google Cloud Project (Gemini API Key, Google Maps Key, Firebase Config)

### 1. Environment Setup

**Backend (`backend/.env`)**:
```env
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
GEMINI_API_KEY=your_gemini_api_key
# Required if testing translation locally
GOOGLE_APPLICATION_CREDENTIALS=./service-account.json
```

**Frontend (`frontend/.env.development`)**:
```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_GOOGLE_MAPS_API_KEY=your_maps_key
REACT_APP_FIREBASE_PROJECT_ID=your_project
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
REACT_APP_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
```

### 2. Run Locally

You can spin up both servers concurrently:

```bash
npm install
npm run dev
```
- Frontend runs at `http://localhost:3000`
- Backend runs at `http://localhost:5000`

### 3. Run with Docker Compose
```bash
docker-compose up --build
```

---

## 🌩️ Deployment (Google Cloud Run)

The application is fully containerized and configured for serverless deployment on **Google Cloud Run**.

1. **Deploy Backend**:
```bash
cd backend
gcloud run deploy votesmart-backend \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```
*Note: Ensure you set the `GEMINI_API_KEY` secret in the Cloud Run dashboard.*

2. **Deploy Frontend**:
```bash
cd frontend
gcloud run deploy votesmart-frontend \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --port 80
```

---

## 📊 Observability
- **Firebase Analytics**: Tracks `page_view`, `journey_started`, `myth_checked`, and `pdf_downloaded` events for behavioral insights.
- **Backend Logging**: View backend telemetry safely using Google Cloud Logging.

## 📄 License
This project is licensed under the MIT License.
