# 🗳️ VoteSmart AI — AI Voting Companion

**VoteSmart AI** is an advanced, production-hardened web application designed to empower Indian voters. Powered by Google's cutting-edge **Gemini 2.5 Pro**, this platform provides real-time voter assistance, interactive myth-busting, customized voting journey checklists, and constituency-level insights. 

Built with scalability, security, and accessibility in mind, VoteSmart AI seamlessly integrates the **Google Cloud Ecosystem** to deliver a highly reliable, low-latency, and personalized experience.

---

## 🎯 Hackathon Overview

### 1. Chosen Vertical
**Civic Technology & Democratic Engagement**
Our mission is to strengthen democratic participation by reducing voter friction, combatting electoral misinformation, and making the voting process accessible, transparent, and easy to understand for every citizen, regardless of their background or location.

### 2. Approach and Logic
Voting can often feel overwhelming due to complex bureaucratic procedures, changing rules, and rampant misinformation (especially deepfakes and fake news on social media). Our approach tackles these issues through three logical pillars:
*   **Personalization over Generalization**: Instead of a generic FAQ, we ask for the user's location and "Voter Type" (e.g., NRI, PwD, First-time voter) to generate a highly customized, actionable checklist.
*   **Real-time Fact-Checking**: We implemented a dedicated "MythBuster" engine that leverages Gemini's reasoning capabilities to instantly analyze claims and provide a True/False/Misleading verdict with factual context.
*   **Conversational Accessibility**: A 24/7 AI Chatbot provides immediate answers to specific, edge-case questions, removing the need for users to dig through dense government PDFs.

### 3. How the Solution Works
*   **User Interface (Frontend)**: A responsive, WCAG 2.1 AA compliant React application that guides users through modular features: the Voter Journey, the AI Chat Coach, the MythBuster, and the Constituency Map.
*   **Orchestration Layer (Backend)**: An Express.js Node server that securely manages rate-limiting, request tracing, and communication with external APIs. It acts as a shield, preventing abuse of the LLM endpoints.
*   **AI Engine (Gemini 2.5 Pro)**: The core intelligence. We use strictly engineered system prompts to ensure the model behaves neutrally, factually, and strictly within the domain of Indian elections.
*   **Google Cloud Ecosystem**: 
    *   **Cloud Translation API** automatically detects if a user is typing in Hindi and dynamically translates prompts and responses.
    *   **Google Maps JavaScript API** renders interactive, geospatial constituency data.
    *   **Firebase Firestore & Analytics** persists chat sessions securely and tracks user engagement metrics (like `pdf_downloaded`).

### 4. Assumptions Made
*   **Connectivity**: We assume the user has basic 3G/4G internet connectivity to access the web application.
*   **Privacy-First Location**: We assume users prefer privacy over convenience; therefore, we rely on manual location input (City/State) rather than forcing invasive HTML5 Geolocation tracking.
*   **AI Fallibility**: We assume that while Gemini 2.5 Pro is highly accurate, LLMs can hallucinate. To mitigate this, we implemented strict bounding prompts and UI disclaimers reminding users that the AI is an assistant, and official ECI (Election Commission of India) sources should be consulted for final rulings.

---

## ✨ Key Features

1. **🧑‍🏫 AI Chat Assistant**: Interactive voting coach powered by Gemini 2.5 Pro. Persists multi-turn conversations securely using Firebase Firestore. Automatically detects the user's language (Hindi vs English) using Google Cloud Translation and responds accordingly.
2. **📍 Constituency Insights**: Detailed data visualization for specific constituencies using Recharts, augmented by interactive maps driven by the **Google Maps JavaScript API**.
3. **🗺️ Personalized Voter Journey**: Step-by-step PDF checklist generation. Customizes instructions based on user location and voter type.
4. **🛡️ MythBuster**: Instant, AI-driven fact-checking engine to combat election misinformation.
5. **♿ Accessibility-First**: Keyboard navigability, high-contrast theming, and ARIA labels.

---

## 🔒 Security & Code Quality Implementations

VoteSmart AI is engineered with rigorous production standards:

- **DDoS & Rate Limiting**: `express-rate-limit` splits traffic quotas. Global limits block abuse, while strict API limits protect Gemini API quotas.
- **XSS & Parameter Pollution Defense**: Inputs are sanitized via `xss-clean` and `hpp`. Frontend uses DOMPurify and strict React rendering.
- **Content Security Policy (CSP)**: `helmet` enforces strict resource loading rules, blocking unauthorized inline scripts and untrusted domains.
- **Vulnerability Patching**: Deep dependency auditing resolves vulnerabilities via strict package `overrides`.
- **Standardized Formatting**: Enforced `prettier` and `eslint` configurations across the entire repository.
- **Strict Error Handling**: Custom error boundaries in React prevent full-page crashes; backend utilizes a centralized `morgan` structured logger with request-tracing UUIDs.

---

## 🏗️ Architecture & Technology Stack

### Frontend (React 18)
- **Routing & State**: `react-router-dom` and React Context API.
- **UI & Animations**: `framer-motion` for micro-interactions, `recharts` for dataviz, Vanilla CSS for styling.
- **Google Ecosystem**: Google Maps API, Firebase Analytics, Firebase Firestore.

### Backend (Node.js & Express)
- **AI Engine**: `@google/genai` (Gemini 2.5 Pro).
- **Translation**: `@google-cloud/translate` (Auto-language detection).
- **Performance**: In-memory `lru-cache` for idempotent API routes reducing LLM latency.
- **Security**: `cors`, `helmet`, `hpp`, `xss-clean`, `express-rate-limit`.

---

## 🚀 Quick Start (Local Development)

### Prerequisites
- Node.js (v18+)
- A Google Cloud Project (Gemini API Key, Google Maps Key, Firebase Config)

### 1. Environment Setup

**Backend (`backend/.env`)**:
```env
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
GEMINI_API_KEY=your_gemini_api_key
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

```bash
# Terminal 1: Backend
cd backend
npm install
npm run dev

# Terminal 2: Frontend
cd frontend
npm install
npm start
```

---

## 🌩️ Deployment (Google Cloud Run)

The application is fully containerized and configured for serverless deployment on **Google Cloud Run**.

1. **Deploy Backend**:
```bash
cd backend
gcloud run deploy votesmart-backend --source . --platform managed --region us-central1 --allow-unauthenticated
```

2. **Deploy Frontend**:
```bash
cd frontend
gcloud run deploy votesmart-frontend --source . --platform managed --region us-central1 --allow-unauthenticated --port 80
```

## 📄 License
This project is licensed under the MIT License.
