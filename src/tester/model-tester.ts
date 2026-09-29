/**
 * Model health checker
 */

import { RouterClient } from '../router/client.js';
import { ModelCheckResult, ModelStatus } from '../types/index.js';
import { classifyError, classifySuccess } from '../classifier/error-classifier.js';
import { withRetry } from './retry.js';

export interface TesterConfig {
  timeoutMs: number;
  maxRetries: number;
}

/**
 * Test a single model
 */
export async function testModel(
  client: RouterClient,
  modelId: string,
  provider: string,
  config: TesterConfig,
  debug: boolean = false
): Promise<ModelCheckResult> {
  const startTime = Date.now();

  try {
    // Test with retry
    await withRetry(
      async () => {
        // Create abort controller for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), config.timeoutMs);

        try {
          await client.testModel(modelId, debug);
        } finally {
          clearTimeout(timeoutId);
        }
      },
      { maxRetries: config.maxRetries, baseDelayMs: 1000, maxDelayMs: 5000 }
    );

    const latencyMs = Date.now() - startTime;
    const result = classifySuccess();

    return {
      id: modelId,
      provider,
      status: result.status,
      latencyMs,
    };

  } catch (error) {
    const latencyMs = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : String(error);
    const statusCode = extractStatusCode(errorMessage);
    const classification = classifyError(statusCode, errorMessage);

    return {
      id: modelId,
      provider,
      status: classification.status,
      latencyMs,
      error: classification.error,
    };
  }
}

/**
 * Extract status code from error message
 */
function extractStatusCode(errorMessage: string): number {
  const match = errorMessage.match(/(\d{3})/);
  if (match) {
    return parseInt(match[1], 10);
  }
  return 0;
}
