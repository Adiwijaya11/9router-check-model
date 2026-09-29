/**
 * JSON output formatter
 */

import { ModelCheckResult } from '../types/index.js';
import { calculateSummary } from './terminal.js';

export interface JsonOutput {
  summary: {
    total: number;
    active: number;
    unavailable: number;
    rateLimited: number;
    timeout: number;
    authError: number;
    providerError: number;
    invalidResponse: number;
    unknownError: number;
  };
  providers: Array<{
    name: string;
    models: Array<{
      id: string;
      status: string;
      latencyMs: number;
      error?: string;
    }>;
  }>;
}

/**
 * Generate JSON output
 */
export function generateJsonOutput(results: ModelCheckResult[]): JsonOutput {
  const summary = calculateSummary(results);

  // Group by provider
  const byProvider = new Map<string, ModelCheckResult[]>();
  for (const result of results) {
    if (!byProvider.has(result.provider)) {
      byProvider.set(result.provider, []);
    }
    byProvider.get(result.provider)!.push(result);
  }

  const providers = Array.from(byProvider.entries()).map(([name, models]) => ({
    name,
    models: models.map((m) => ({
      id: m.id,
      status: m.status,
      latencyMs: m.latencyMs,
      ...(m.error && { error: m.error }),
    })),
  }));

  return {
    summary,
    providers,
  };
}

/**
 * Output JSON to stdout
 */
export function outputJson(results: ModelCheckResult[]): void {
  const output = generateJsonOutput(results);
  console.log(JSON.stringify(output, null, 2));
}
