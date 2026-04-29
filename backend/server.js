/**
 * server.js — VoteSmart Backend Entry Point
 *
 * Production features implemented:
 *  - Startup validation (fail-fast if ANTHROPIC_API_KEY missing)
 *  - Request ID middleware (every request gets a unique UUID for tracing)
 *  - Structured logging via loggerService
 *  - Multi-origin CORS (comma-separated FRONTEND_URL)
 *  - Split rate limits: general vs AI-hitting endpoints
 *  - Content Security Policy via Helmet
 *  - Optional API key auth for backend-to-backend protection
 *  - Graceful shutdown (SIGTERM/SIGINT drain in-flight requests)
 *  - Cache stats endpoint for observability
 *  - 404 handler and production-safe error handler
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { v4: uuidv4 } = require('uuid');

const logger = require('./services/loggerService');
const { stats: cacheStats } = require('./services/cacheService');

// ── Startup validation ─────────────────────────────────────────────────────
if (!process.env.ANTHROPIC_API_KEY) {
  logger.error('FATAL: ANTHROPIC_API_KEY is not set. Copy backend/.env.example to backend/.env and add your key.');
  process.exit(1);
}

const journeyRoutes = require('./routes/journey');
const simulationRoutes = require('./routes/simulation');
const constituencyRoutes = require('./routes/constituency');
const chatRoutes = require('./routes/chat');
const mythbusterRoutes = require('./routes/mythbuster');

const app = express();
const PORT = parseInt(process.env.PORT, 10) || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';
const IS_PROD = NODE_ENV === 'production';

// ── Request ID middleware ──────────────────────────────────────────────────
// Attaches a unique UUID to every request. Routes pass this to aiService
// for correlated log tracing across cache hits, AI calls, and errors.
app.use((req, res, next) => {
  req.requestId = uuidv4();
  res.setHeader('X-Request-Id', req.requestId);
  next();
});

// ── Security headers (Helmet + CSP) ───────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:'],
      connectSrc: ["'self'"],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: IS_PROD ? [] : null
    }
  },
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

// ── Structured HTTP logging ────────────────────────────────────────────────
morgan.token('request-id', req => req.requestId);
app.use(morgan(
  IS_PROD
    ? ':method :url :status :res[content-length] :response-time ms id=:request-id'
    : 'dev'
));

// ── CORS ───────────────────────────────────────────────────────────────────
const rawOrigins = process.env.FRONTEND_URL || 'http://localhost:3000';
const allowedOrigins = rawOrigins.split(',').map(o => o.trim()).filter(Boolean);

app.use(cors({
  origin: (origin, cb) => {
    // Allow Postman/curl (no origin) in development only
    if (!origin) return IS_PROD ? cb(new Error('CORS: direct access not allowed in production')) : cb(null, true);
    if (allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error(`CORS: origin '${origin}' not in allowlist`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'X-Api-Key']
}));

// ── Body parsing ───────────────────────────────────────────────────────────
app.use(express.json({ limit: '10kb' }));

// ── Optional API key authentication ───────────────────────────────────────
// Set BACKEND_API_KEY in .env to require all API callers to send
// X-Api-Key: <key> header. Leave unset to disable (open in dev).
const BACKEND_API_KEY = process.env.BACKEND_API_KEY;
if (BACKEND_API_KEY) {
  app.use('/api/', (req, res, next) => {
    // Skip auth on health check so load balancers and Docker healthchecks work
    if (req.path === '/health') return next();
    const provided = req.headers['x-api-key'];
    if (!provided || provided !== BACKEND_API_KEY) {
      logger.warn('Unauthorized API access attempt', { requestId: req.requestId, ip: req.ip, path: req.path });
      return res.status(401).json({ error: 'Unauthorized: missing or invalid X-Api-Key header' });
    }
    next();
  });
}

// ── Rate limiting ──────────────────────────────────────────────────────────
// General: 200 req/15min (data routes, health, suggestions)
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: req => req.ip,
  message: { error: 'Too many requests. Please wait before trying again.' },
  handler: (req, res, next, options) => {
    logger.warn('Rate limit hit (general)', { requestId: req.requestId, ip: req.ip, path: req.path });
    res.status(429).json(options.message);
  }
});

// AI-specific: 30 req/15min per IP (prevents Anthropic quota exhaustion)
const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: req => req.ip,
  message: { error: 'AI rate limit reached. Please wait a few minutes before making another AI request.' },
  handler: (req, res, next, options) => {
    logger.warn('Rate limit hit (AI)', { requestId: req.requestId, ip: req.ip, path: req.path });
    res.status(429).json(options.message);
  }
});

app.use('/api/', generalLimiter);
app.use('/api/journey/generate', aiLimiter);
app.use('/api/chat/message', aiLimiter);
app.use('/api/mythbuster/check', aiLimiter);
app.use('/api/constituency/:id/insights', aiLimiter);

// ── Routes ─────────────────────────────────────────────────────────────────
app.use('/api/journey', journeyRoutes);
app.use('/api/simulation', simulationRoutes);
app.use('/api/constituency', constituencyRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/mythbuster', mythbusterRoutes);

// ── Health + observability ─────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    env: NODE_ENV,
    uptime: Math.floor(process.uptime()),
    version: process.env.npm_package_version || '1.0.0'
  });
});

// Cache statistics (useful for monitoring hit rates in production)
app.get('/api/cache/stats', (req, res) => {
  res.json({ status: 'ok', cache: cacheStats() });
});

// ── 404 handler ────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found` });
});

// ── Global error handler ───────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  logger.error('Unhandled error', {
    requestId: req.requestId,
    method: req.method,
    path: req.path,
    message: err.message,
    status: err.status
  });

  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    requestId: req.requestId,
    ...(IS_PROD ? {} : { stack: err.stack })
  });
});

// ── Server startup ─────────────────────────────────────────────────────────
const server = app.listen(PORT, () => {
  logger.info('VoteSmart backend started', {
    port: PORT,
    env: NODE_ENV,
    corsOrigins: allowedOrigins,
    apiKeyAuth: !!BACKEND_API_KEY
  });
});

// ── Graceful shutdown ──────────────────────────────────────────────────────
// On SIGTERM (Docker stop) or SIGINT (Ctrl+C): stop accepting new connections,
// wait for in-flight requests to finish (up to 10s), then exit cleanly.
let shuttingDown = false;

function gracefulShutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  logger.info(`${signal} received — starting graceful shutdown`);

  server.close((err) => {
    if (err) {
      logger.error('Error during server close', { message: err.message });
      process.exit(1);
    }
    logger.info('All connections closed — exiting');
    process.exit(0);
  });

  // Force exit after 10 seconds if connections don't drain
  setTimeout(() => {
    logger.warn('Graceful shutdown timeout — forcing exit');
    process.exit(1);
  }, 10_000).unref();
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Catch unhandled promise rejections — log but don't crash
process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled promise rejection', { reason: String(reason) });
});

process.on('uncaughtException', (err) => {
  logger.error('Uncaught exception — exiting', { message: err.message, stack: err.stack });
  process.exit(1);
});

module.exports = app;
