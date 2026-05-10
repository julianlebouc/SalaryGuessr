/**
 * Logger utility to send client-side logs to the backend.
 */

const API_URL = process.env.REACT_APP_API_URL || '';

/**
 * Sends a log message to the backend server.
 * @param {string} message - The message to log.
 * @param {string} level - Log level ('info', 'warning', 'error').
 * @param {Object} context - Additional metadata.
 */
export const logToServer = async (message, level = 'info', context = {}) => {
  try {

    await fetch(`${API_URL}/log`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        level,
        context: {
          ...context,
          url: window.location.href,
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString(),
        },
      }),
    });
  } catch (err) {
    console.error('Failed to send log to server:', err);
  }
};

export const logger = {
  info: (msg, ctx) => logToServer(msg, 'info', ctx),
  warn: (msg, ctx) => logToServer(msg, 'warning', ctx),
  error: (msg, ctx) => logToServer(msg, 'error', ctx),
};

export default logger;
