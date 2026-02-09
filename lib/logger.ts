/**
 * Production-safe logger.
 * In production, only errors and warnings are logged (no stack traces or sensitive data).
 * In development, full console output is preserved.
 */

const isDev = process.env.NODE_ENV === 'development';

export const logger = {
  error(message: string, ...args: unknown[]) {
    if (isDev) {
      console.error(message, ...args);
    } else {
      // In production, log message only (no potentially sensitive error details)
      console.error(`[ERROR] ${message}`);
    }
  },

  warn(message: string, ...args: unknown[]) {
    if (isDev) {
      console.warn(message, ...args);
    } else {
      console.warn(`[WARN] ${message}`);
    }
  },

  info(message: string, ...args: unknown[]) {
    if (isDev) {
      console.info(message, ...args);
    }
    // Silenced in production
  },

  debug(message: string, ...args: unknown[]) {
    if (isDev) {
      console.debug(message, ...args);
    }
    // Silenced in production
  },
};
