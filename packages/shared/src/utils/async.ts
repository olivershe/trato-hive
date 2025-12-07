/**
 * Async Utilities
 */

/**
 * Sleep utility for async operations
 * @param ms milliseconds to sleep
 */
export const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms))
