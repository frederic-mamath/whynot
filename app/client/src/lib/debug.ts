/**
 * Debug logging utility
 * Logs messages only in development environment
 */
export const debugLog = (...args: any[]) => {
  if (import.meta.env.DEV) {
    console.debug(...args);
  }
};
