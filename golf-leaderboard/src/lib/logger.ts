/**
 * Centralized logging utility
 * Replaces console.log statements throughout the codebase
 * Only logs in development to prevent production noise
 */

const isDev = process.env.NODE_ENV !== 'production';

export const logger = {
  /**
   * Debug information (development only)
   * Use for detailed debugging info that's not needed in production
   */
  debug: (...args: any[]) => {
    if (isDev) {
      console.log('[DEBUG]', ...args);
    }
  },

  /**
   * General information (development only)
   * Use for general flow information
   */
  info: (...args: any[]) => {
    if (isDev) {
      console.info('[INFO]', ...args);
    }
  },

  /**
   * Warning messages (always shown)
   * Use for recoverable issues that should be investigated
   */
  warn: (...args: any[]) => {
    console.warn('[WARN]', ...args);
  },

  /**
   * Error messages (always shown)
   * Use for errors that need immediate attention
   */
  error: (...args: any[]) => {
    console.error('[ERROR]', ...args);
  },

  /**
   * Success messages (development only)
   * Use for successful operations that are useful for debugging
   */
  success: (...args: any[]) => {
    if (isDev) {
      console.log('[SUCCESS] ✅', ...args);
    }
  },

  /**
   * API call logging (development only)
   * Use for tracking API requests and responses
   */
  api: (method: string, url: string, data?: any) => {
    if (isDev) {
      console.log(`[API] ${method.toUpperCase()} ${url}`, data || '');
    }
  },

  /**
   * Performance timing (development only)
   * Use for measuring operation duration
   */
  time: (label: string) => {
    if (isDev) {
      console.time(`[PERF] ${label}`);
    }
  },

  /**
   * End performance timing (development only)
   */
  timeEnd: (label: string) => {
    if (isDev) {
      console.timeEnd(`[PERF] ${label}`);
    }
  }
};

/**
 * Group related logs together (development only)
 */
export const logGroup = (label: string, fn: () => void) => {
  if (isDev) {
    console.group(`[GROUP] ${label}`);
    fn();
    console.groupEnd();
  } else {
    fn();
  }
};