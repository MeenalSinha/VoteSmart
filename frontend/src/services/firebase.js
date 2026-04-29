/**
 * firebase.js — Firebase integration for VoteSmart
 *
 * Services used:
 *  - Firebase Analytics: tracks user interactions and page views
 *  - Firestore: persists chat conversation history across sessions
 */

import { initializeApp } from 'firebase/app';
import { getAnalytics, logEvent, isSupported } from 'firebase/analytics';
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  limit,
  serverTimestamp,
} from 'firebase/firestore';

// Firebase project configuration
// These are safe to expose in the frontend (protected by Firebase Security Rules)
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || 'demo-key',
  authDomain:
    process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || 'votesmart-ai-voting-companion.firebaseapp.com',
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || 'votesmart-ai-voting-companion',
  storageBucket:
    process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || 'votesmart-ai-voting-companion.appspot.com',
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.REACT_APP_FIREBASE_APP_ID || '',
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID || '',
};

// Initialize Firebase app (singleton)
const app = initializeApp(firebaseConfig);

// Firestore database
export const db = getFirestore(app);

// Analytics — only loaded in browser environments that support it
let analytics = null;
isSupported()
  .then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
      logEvent(analytics, 'app_open', { app_name: 'VoteSmart' });
    }
  })
  .catch(() => {
    // Analytics not supported in this environment — fail silently
  });

// ── Analytics helpers ─────────────────────────────────────────────────────

/**
 * Track a custom event in Firebase Analytics.
 * Fails silently if analytics is not initialized (e.g., SSR, unsupported browser).
 */
export function trackEvent(eventName, params = {}) {
  try {
    if (analytics) {
      logEvent(analytics, eventName, {
        ...params,
        app_name: 'VoteSmart',
        timestamp: new Date().toISOString(),
      });
    }
  } catch {
    // Analytics event tracking should never crash the app
  }
}

// Pre-built event trackers for key user interactions
export const analyticsEvents = {
  pageView: (pageName) => trackEvent('page_view', { page_title: pageName }),
  journeyStarted: (voterType, location) =>
    trackEvent('journey_started', { voter_type: voterType, location }),
  journeyCompleted: (voterType) => trackEvent('journey_completed', { voter_type: voterType }),
  chatMessage: (language) => trackEvent('chat_message_sent', { language }),
  mythChecked: (claimLength) => trackEvent('myth_checked', { claim_length: claimLength }),
  constituencyViewed: (name, state) =>
    trackEvent('constituency_viewed', { constituency: name, state }),
  simulationDone: (score) => trackEvent('simulation_completed', { score }),
  pdfDownloaded: () => trackEvent('pdf_downloaded'),
  languageChanged: (lang) => trackEvent('language_changed', { language: lang }),
};

// ── Firestore: Chat history ───────────────────────────────────────────────

const CHAT_COLLECTION = 'chat_sessions';

/**
 * Save a chat exchange (user + AI reply) to Firestore.
 * Uses an anonymous session ID stored in localStorage.
 */
export async function saveChatMessage(userMessage, aiReply, language = 'en') {
  try {
    const sessionId = getOrCreateSessionId();
    await addDoc(collection(db, CHAT_COLLECTION), {
      sessionId,
      userMessage: userMessage.substring(0, 500),
      aiReply: aiReply.substring(0, 1000),
      language,
      timestamp: serverTimestamp(),
    });
  } catch {
    // Firestore writes should never block the UI
  }
}

/**
 * Load the last N chat messages for this session from Firestore.
 */
export async function loadChatHistory(maxMessages = 10) {
  try {
    const sessionId = getOrCreateSessionId();
    const q = query(
      collection(db, CHAT_COLLECTION),
      orderBy('timestamp', 'desc'),
      limit(maxMessages)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs
      .map((doc) => doc.data())
      .filter((msg) => msg.sessionId === sessionId)
      .reverse();
  } catch {
    return [];
  }
}

// ── Session management ─────────────────────────────────────────────────────

function getOrCreateSessionId() {
  const key = 'votesmart_session_id';
  let id = sessionStorage.getItem(key);
  if (!id) {
    id = `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    sessionStorage.setItem(key, id);
  }
  return id;
}
