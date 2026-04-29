/**
 * AppContext.js
 * Global state with localStorage persistence.
 * Saves: language, location, voterType, journeyData
 * Clears: simulationScore (intentionally ephemeral)
 */
import React, { createContext, useContext, useState, useEffect } from 'react';

const AppContext = createContext(null);

const STORAGE_KEY = 'votesmart_session';

function loadSession() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function saveSession(userContext, journeyData) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ userContext, journeyData }));
  } catch {
    // Storage quota exceeded or private browsing — fail silently
  }
}

export function AppProvider({ children }) {
  // Lazy initializer — loadSession() runs only once (not on every re-render)
  const [userContext, setUserContext] = useState(() => {
    const session = loadSession();
    return session?.userContext || {
      country: '',
      state: '',
      city: '',
      voterType: '',
      language: 'en'
    };
  });
  const [journeyData, setJourneyDataState] = useState(() => {
    const session = loadSession();
    return session?.journeyData || null;
  });
  const [simulationScore, setSimulationScore] = useState(0);

  // Persist on every change
  useEffect(() => {
    saveSession(userContext, journeyData);
  }, [userContext, journeyData]);

  const updateUserContext = (updates) => {
    setUserContext(prev => ({ ...prev, ...updates }));
  };

  const setJourneyData = (data) => {
    setJourneyDataState(data);
  };

  const clearSession = () => {
    localStorage.removeItem(STORAGE_KEY);
    setUserContext({ country: '', state: '', city: '', voterType: '', language: 'en' });
    setJourneyDataState(null);
    setSimulationScore(0);
  };

  // i18n helper — returns translated string or English fallback
  const t = (key) => {
    if (userContext.language !== 'hi') return UI_STRINGS.en[key] || key;
    return UI_STRINGS.hi[key] || UI_STRINGS.en[key] || key;
  };

  return (
    <AppContext.Provider value={{
      userContext,
      updateUserContext,
      journeyData,
      setJourneyData,
      simulationScore,
      setSimulationScore,
      clearSession,
      t
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

// UI string translations
const UI_STRINGS = {
  en: {
    // Navbar
    'nav.home': 'Home',
    'nav.journey': 'Voter Journey',
    'nav.simulation': 'Simulation',
    'nav.constituency': 'Constituency',
    'nav.chat': 'AI Coach',
    'nav.mythbuster': 'MythBuster',
    'nav.start': 'Start Journey',
    // Journey
    'journey.title': 'Voter Journey',
    'journey.subtitle': 'Your personalized guide to voting',
    'journey.location.heading': 'Where do you vote?',
    'journey.location.sub': 'We\'ll personalize your journey based on your location.',
    'journey.votertype.heading': 'Tell us about yourself',
    'journey.votertype.sub': 'We\'ll customize your guide based on your voter profile.',
    'journey.generating': 'Building your journey',
    'journey.generating.sub': 'AI is generating your personalized guide...',
    'journey.cta.next': 'What should I do next?',
    'journey.download': 'Download Checklist',
    'journey.complete': 'Journey Complete',
    // Simulation
    'sim.title': 'Voter Simulation',
    'sim.subtitle': 'Practice election day scenarios',
    'sim.start': 'Begin Simulation',
    'sim.score': 'Score',
    'sim.retry': 'Try Again',
    // Constituency
    'const.title': 'Constituency Insights',
    'const.subtitle': 'Explore historical election data',
    'const.select': 'Select a constituency',
    'const.ai': 'AI Analysis',
    // Chat
    'chat.title': 'AI Election Coach',
    'chat.placeholder': 'Ask about voting, elections, registration...',
    'chat.send': 'Send',
    'chat.suggested': 'Suggested questions',
    // MythBuster
    'myth.title': 'MythBuster',
    'myth.subtitle': 'Verify election claims with AI fact-checking',
    'myth.placeholder': 'Paste an election claim to verify...',
    'myth.check': 'Check Claim',
    'myth.examples': 'Try These Examples',
    // Home
    'home.hero.badge': 'AI-Powered Civic Tool',
    'home.hero.title.1': 'Your intelligent guide to',
    'home.hero.title.2': 'informed voting',
    'home.cta.primary': 'Start Your Journey',
    'home.cta.secondary': 'Try Simulation',
  },
  hi: {
    // Navbar
    'nav.home': 'होम',
    'nav.journey': 'मतदाता यात्रा',
    'nav.simulation': 'सिमुलेशन',
    'nav.constituency': 'निर्वाचन क्षेत्र',
    'nav.chat': 'AI कोच',
    'nav.mythbuster': 'मिथ बस्टर',
    'nav.start': 'यात्रा शुरू करें',
    // Journey
    'journey.title': 'मतदाता यात्रा',
    'journey.subtitle': 'मतदान के लिए आपका व्यक्तिगत मार्गदर्शक',
    'journey.location.heading': 'आप कहाँ मतदान करते हैं?',
    'journey.location.sub': 'हम आपकी लोकेशन के आधार पर आपकी यात्रा को व्यक्तिगत बनाएंगे।',
    'journey.votertype.heading': 'अपने बारे में बताएं',
    'journey.votertype.sub': 'हम आपकी मतदाता प्रोफ़ाइल के अनुसार आपका मार्गदर्शन करेंगे।',
    'journey.generating': 'आपकी यात्रा बन रही है',
    'journey.generating.sub': 'AI आपका व्यक्तिगत मार्गदर्शक बना रहा है...',
    'journey.cta.next': 'मुझे आगे क्या करना चाहिए?',
    'journey.download': 'चेकलिस्ट डाउनलोड करें',
    'journey.complete': 'यात्रा पूर्ण',
    // Simulation
    'sim.title': 'मतदाता सिमुलेशन',
    'sim.subtitle': 'चुनाव दिवस का अभ्यास करें',
    'sim.start': 'सिमुलेशन शुरू करें',
    'sim.score': 'स्कोर',
    'sim.retry': 'दोबारा प्रयास',
    // Constituency
    'const.title': 'निर्वाचन क्षेत्र की जानकारी',
    'const.subtitle': 'ऐतिहासिक चुनाव डेटा देखें',
    'const.select': 'एक निर्वाचन क्षेत्र चुनें',
    'const.ai': 'AI विश्लेषण',
    // Chat
    'chat.title': 'AI चुनाव कोच',
    'chat.placeholder': 'मतदान, चुनाव, पंजीकरण के बारे में पूछें...',
    'chat.send': 'भेजें',
    'chat.suggested': 'सुझाए गए प्रश्न',
    // MythBuster
    'myth.title': 'मिथ बस्टर',
    'myth.subtitle': 'AI से चुनावी दावों की जांच करें',
    'myth.placeholder': 'किसी चुनावी दावे को यहाँ paste करें...',
    'myth.check': 'दावा जाँचें',
    'myth.examples': 'उदाहरण देखें',
    // Home
    'home.hero.badge': 'AI-संचालित नागरिक उपकरण',
    'home.hero.title.1': 'सूचित मतदान के लिए',
    'home.hero.title.2': 'आपका बुद्धिमान मार्गदर्शक',
    'home.cta.primary': 'यात्रा शुरू करें',
    'home.cta.secondary': 'सिमुलेशन आज़माएं',
  }
};
