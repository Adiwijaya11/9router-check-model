/**
 * Error classifier for model health checks
 */

import { ModelStatus } from '../types/index.js';

export interface ClassificationResult {
  status: ModelStatus;
  error?: string;
}

/**
 * Classify HTTP status code and error message into model status
 */
export function classifyError(statusCode: number, errorMessage: string): ClassificationResult {
  const message = errorMessage.toLowerCase();

  // Rate limiting
  if (statusCode === 429 || message.includes('rate limit') || message.includes('too many requests')) {
    return { status: 'RATE_LIMITED', error: errorMessage };
  }

  // Authentication errors
  if (statusCode === 401 || statusCode === 403 || message.includes('unauthorized') || message.includes('forbidden')) {
    return { status: 'AUTH_ERROR', error: errorMessage };
  }

  // Provider errors (5xx)
  if (statusCode >= 500 || message.includes('provider error') || message.includes('bad gateway') || message.includes('service unavailable')) {
    return { status: 'PROVIDER_ERROR', error: errorMessage };
  }

  // Timeout
  if (statusCode === 408 || message.includes('timeout') || message.includes('timed out')) {
    return { status: 'TIMEOUT', error: errorMessage };
  }

  // Model not found / unavailable
  if (statusCode === 404 || message.includes('not found') || message.includes('unavailable') || message.includes('does not exist')) {
    return { status: 'UNAVAILABLE', error: errorMessage };
  }

  // Invalid response
  if (message.includes('invalid') || message.includes('parse') || message.includes('format')) {
    return { status: 'INVALID_RESPONSE', error: errorMessage };
  }

  // Default
  return { status: 'UNKNOWN_ERROR', error: errorMessage };
}

/**
 * Classify successful response
 */
export function classifySuccess(): ClassificationResult {
  return { status: 'ACTIVE' };
}
