/**
 * loggerService.js
 * Structured JSON logger for production; pretty-print for development.
 *
 * Every log entry includes:
 *   - timestamp (ISO)
 *   - level (info / warn / error)
 *   - requestId (propagated from middleware)
 *   - message
 *   - optional metadata object
 */

const NODE_ENV = process.env.NODE_ENV || 'development';

function format(level, message, meta = {}) {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...meta
  };

  if (NODE_ENV === 'production') {
    return JSON.stringify(entry);
  }

  // Human-readable for dev
  const color = { info: '\x1b[36m', warn: '\x1b[33m', error: '\x1b[31m', reset: '\x1b[0m' };
  const c = color[level] || color.reset;
  const metaStr = Object.keys(meta).length
    ? ' ' + JSON.stringify(meta)
    : '';
  return `${c}[${level.toUpperCase()}]${color.reset} ${entry.timestamp} ${message}${metaStr}`;
}

const logger = {
  info: (message, meta) => console.log(format('info', message, meta)),
  warn: (message, meta) => console.warn(format('warn', message, meta)),
  error: (message, meta) => console.error(format('error', message, meta))
};

module.exports = logger;
