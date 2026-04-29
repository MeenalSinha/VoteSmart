import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { chatAPI } from '../services/api';
import { useApp } from '../services/AppContext';
import './Chat.css';

// Stable initial greeting builder — avoids recreating on every render
function buildGreeting(language) {
  return language === 'hi'
    ? 'नमस्ते! मैं आपका AI चुनाव कोच हूं। चुनाव प्रक्रिया के बारे में कोई भी सवाल पूछें।'
    : "Hello! I'm your AI Election Coach. Ask me anything about the voting process, election rules, or how democracy works in India.";
}

export default function Chat() {
  const { userContext, t } = useApp();
  const [messages, setMessages] = useState(() => [{
    role: 'assistant',
    content: buildGreeting(userContext.language),
    timestamp: new Date().toISOString()
  }]);
  const [input, setInput]             = useState('');
  const [loading, setLoading]         = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [isListening, setIsListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);

  const messagesEndRef  = useRef(null);
  const inputRef        = useRef(null);
  const recognitionRef  = useRef(null);

  // Check voice support on mount
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    setVoiceSupported(true);
    const recognition = new SpeechRecognition();
    recognition.continuous    = false;
    recognition.interimResults = true;
    recognition.lang          = userContext.language === 'hi' ? 'hi-IN' : 'en-IN';
    recognition.onresult      = (event) => {
      const transcript = Array.from(event.results).map(r => r[0].transcript).join('');
      setInput(transcript);
    };
    recognition.onend  = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);
    recognitionRef.current = recognition;
  }, [userContext.language]);

  useEffect(() => {
    chatAPI.getSuggestions(userContext.language)
      .then(res => setSuggestions(res.data))
      .catch(() => {});
  }, [userContext.language]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = useCallback(async (text) => {
    const content = (text || input).trim();
    if (!content || loading) return;

    setInput('');
    if (inputRef.current) inputRef.current.style.height = 'auto';

    const userMsg       = { role: 'user', content, timestamp: new Date().toISOString() };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setLoading(true);

    try {
      const apiMessages = updatedMessages.map(m => ({ role: m.role, content: m.content }));
      const res = await chatAPI.sendMessage(
        apiMessages,
        {
          location:  userContext.city ? `${userContext.city}, ${userContext.state}` : 'India',
          voterType: userContext.voterType || 'general'
        },
        userContext.language
      );
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: res.data.reply,
        timestamp: res.data.timestamp
      }]);
    } catch (e) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: e.message || 'Sorry, could not get a response. Please try again.',
        timestamp: new Date().toISOString(),
        isError: true
      }]);
    } finally {
      setLoading(false);
    }
  }, [input, loading, messages, userContext]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }, [sendMessage]);

  const handleInputChange = useCallback((e) => {
    if (e.target.value.length <= 500) setInput(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
  }, []);

  const toggleVoice = useCallback(() => {
    if (!recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.lang = userContext.language === 'hi' ? 'hi-IN' : 'en-IN';
      recognitionRef.current.start();
      setIsListening(true);
    }
  }, [isListening, userContext.language]);

  const clearChat = useCallback(() => {
    setMessages([{
      role: 'assistant',
      content: buildGreeting(userContext.language),
      timestamp: new Date().toISOString()
    }]);
  }, [userContext.language]);

  const formatTime = useCallback((iso) => {
    try { return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); }
    catch { return ''; }
  }, []);

  return (
    <main className="chat-page" role="main">
      <div className="chat-page__header">
        <div className="container">
          <div className="chat-header-row">
            <div className="chat-header-info">
              <div className="chat-avatar" aria-hidden="true">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                  <circle cx="10" cy="8" r="3" stroke="white" strokeWidth="1.4"/>
                  <path d="M4 17c0-3.314 2.686-6 6-6s6 2.686 6 6" stroke="white" strokeWidth="1.4" strokeLinecap="round"/>
                </svg>
              </div>
              <div>
                <h1>{t('chat.title')}</h1>
                <div className="chat-status">
                  <div className="chat-status-dot" aria-hidden="true" />
                  <span className="text-small text-muted">Online · Answers in seconds</span>
                </div>
              </div>
            </div>
            <div className="chat-header-actions">
              {userContext.city && (
                <span className="badge badge-blue text-small">{userContext.city}</span>
              )}
              <button
                className="btn-secondary chat-clear-btn"
                onClick={clearChat}
                aria-label="Clear chat history"
              >
                <svg aria-hidden="true" width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M2 4h10M5 4V2.5h4V4M6 7v3M8 7v3M3 4l.75 7.5h6.5L11 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Clear
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container">
        <div className="chat-layout">
          {/* Chat window */}
          <div className="chat-window">
            {/* role="log" semantically represents a live message feed */}
            <div
              className="chat-messages"
              role="log"
              aria-live="polite"
              aria-label="Conversation with AI Election Coach"
              aria-atomic="false"
            >
              <AnimatePresence>
                {messages.map((msg, i) => (
                  <motion.div
                    key={`${msg.role}-${i}`}
                    className={`chat-message chat-message--${msg.role} ${msg.isError ? 'chat-message--error' : ''}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    {msg.role === 'assistant' && (
                      <div className="chat-message__avatar" aria-hidden="true">
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                          <circle cx="7" cy="5.5" r="2.2" stroke="white" strokeWidth="1.2"/>
                          <path d="M2.5 12c0-2.485 2.015-4.5 4.5-4.5s4.5 2.015 4.5 4.5" stroke="white" strokeWidth="1.2" strokeLinecap="round"/>
                        </svg>
                      </div>
                    )}
                    <div className="chat-message__content">
                      <p>{msg.content}</p>
                      <div className="chat-message__time text-xs" aria-label={`Sent at ${formatTime(msg.timestamp)}`}>
                        {formatTime(msg.timestamp)}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {loading && (
                <motion.div
                  className="chat-message chat-message--assistant"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  aria-label="AI is typing"
                >
                  <div className="chat-message__avatar" aria-hidden="true">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                      <circle cx="7" cy="5.5" r="2.2" stroke="white" strokeWidth="1.2"/>
                      <path d="M2.5 12c0-2.485 2.015-4.5 4.5-4.5s4.5 2.015 4.5 4.5" stroke="white" strokeWidth="1.2" strokeLinecap="round"/>
                    </svg>
                  </div>
                  <div className="chat-message__content chat-typing" aria-hidden="true">
                    <span /><span /><span />
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Suggested prompts */}
            {messages.length <= 1 && suggestions.length > 0 && (
              <div className="chat-suggestions">
                <div className="chat-suggestions__label text-xs text-muted">{t('chat.suggested')}</div>
                <div className="chat-suggestions__list">
                  {suggestions.slice(0, 4).map((s, i) => (
                    <button
                      key={`sug-${i}`}
                      className="chat-suggestion-btn"
                      onClick={() => sendMessage(s)}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input */}
            <div className="chat-input-area">
              {isListening && (
                <div className="chat-voice-indicator" role="status" aria-live="polite">
                  <div className="chat-voice-pulse" aria-hidden="true" />
                  <span className="text-small">Listening... speak now</span>
                </div>
              )}
              <div className="chat-input-wrap">
                <label htmlFor="chat-input" className="sr-only">
                  {t('chat.placeholder')}
                </label>
                <textarea
                  id="chat-input"
                  ref={inputRef}
                  className="chat-input"
                  placeholder={t('chat.placeholder')}
                  value={input}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  rows={1}
                  style={{ overflowY: 'auto' }}
                  disabled={loading}
                  aria-label={t('chat.placeholder')}
                  maxLength={500}
                />

                {voiceSupported && (
                  <button
                    className={`chat-voice-btn ${isListening ? 'active' : ''}`}
                    onClick={toggleVoice}
                    aria-label={isListening ? 'Stop voice input' : 'Start voice input'}
                    aria-pressed={isListening}
                    type="button"
                  >
                    <svg aria-hidden="true" width="15" height="15" viewBox="0 0 15 15" fill="none">
                      <rect x="5" y="1" width="5" height="8" rx="2.5" stroke="currentColor" strokeWidth="1.3"/>
                      <path d="M2.5 7.5A5 5 0 0012.5 7.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                      <path d="M7.5 12.5v2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                    </svg>
                  </button>
                )}

                <button
                  className="chat-send-btn"
                  onClick={() => sendMessage()}
                  disabled={!input.trim() || loading}
                  aria-label={t('chat.send')}
                  aria-busy={loading}
                  type="button"
                >
                  {loading
                    ? <div className="spinner" style={{ width: 16, height: 16, borderColor: 'rgba(255,255,255,0.3)', borderTopColor: 'white' }} />
                    : (
                      <svg aria-hidden="true" width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M2 8l12-5-5 12-2-5-5-2z" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )
                  }
                </button>
              </div>
              <p className="chat-disclaimer text-xs text-muted">
                AI responses are for informational purposes only. For official information, visit the{' '}
                <a
                  href="https://eci.gov.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Election Commission of India website (opens in new tab)"
                >
                  Election Commission of India
                </a>.
              </p>
            </div>
          </div>

          {/* Sidebar */}
          <aside className="chat-sidebar" aria-label="Chat tools">
            <div className="chat-sidebar__card card">
              <h2 className="chat-sidebar__heading">Common Questions</h2>
              <div className="chat-sidebar__list">
                {suggestions.map((s, i) => (
                  <button key={`side-sug-${i}`} className="chat-sidebar__item" onClick={() => sendMessage(s)}>
                    <svg aria-hidden="true" width="13" height="13" viewBox="0 0 13 13" fill="none">
                      <path d="M2 6.5h9M8 3l3.5 3.5L8 10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="chat-sidebar__card card">
              <h2 className="chat-sidebar__heading">Context</h2>
              <div className="chat-context-items">
                <div className="chat-context-item">
                  <span className="text-xs text-muted">Location</span>
                  <span className="text-small">{userContext.city || 'Not set'}</span>
                </div>
                <div className="chat-context-item">
                  <span className="text-xs text-muted">Voter Type</span>
                  <span className="text-small">{userContext.voterType?.replace('-', ' ') || 'Not set'}</span>
                </div>
                <div className="chat-context-item">
                  <span className="text-xs text-muted">Language</span>
                  <span className="text-small">{userContext.language === 'hi' ? 'Hindi' : 'English'}</span>
                </div>
                {voiceSupported && (
                  <div className="chat-context-item">
                    <span className="text-xs text-muted">Voice Input</span>
                    <span className="text-small badge badge-green" style={{ padding: '2px 8px', fontSize: 11 }}>
                      Available
                    </span>
                  </div>
                )}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
