/**
 * Retry logic with exponential backoff
 */

export interface RetryConfig {
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs: number;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 2,
  baseDelayMs: 1000,
  maxDelayMs: 10000,
};

/**
 * Check if error is retryable
 */
export function isRetryableError(statusCode: number): boolean {
  // Retry on: timeout, network errors, 5xx server errors
  return (
    statusCode === 408 || // Request Timeout
    statusCode === 429 || // Rate limit (with backoff)
    statusCode === 502 || // Bad Gateway
    statusCode === 503 || // Service Unavailable
    statusCode === 504    // Gateway Timeout
  );
}

/**
 * Calculate delay with exponential backoff and jitter
 */
function calculateDelay(attempt: number, config: RetryConfig): number {
  const exponentialDelay = config.baseDelayMs * Math.pow(2, attempt);
  const jitter = Math.random() * 1000;
  return Math.min(exponentialDelay + jitter, config.maxDelayMs);
}

/**
 * Execute function with retry logic
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  config: RetryConfig = DEFAULT_RETRY_CONFIG
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Don't retry on last attempt
      if (attempt === config.maxRetries) {
        break;
      }

      // Check if error is retryable
      const statusCode = extractStatusCode(error);
      if (!isRetryableError(statusCode)) {
        throw error;
      }

      // Wait before retrying
      const delay = calculateDelay(attempt, config);
      console.error(`  Retry ${attempt + 1}/${config.maxRetries} after ${delay}ms...`);
      await sleep(delay);
    }
  }

  throw lastError;
}

/**
 * Extract status code from error
 */
function extractStatusCode(error: unknown): number {
  if (error instanceof Error) {
    const match = error.message.match(/(\d{3})/);
    if (match) {
      return parseInt(match[1], 10);
    }
  }
  return 0;
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
