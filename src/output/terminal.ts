/**
 * Terminal output formatter
 */

import { ModelCheckResult, ModelStatus } from '../types/index.js';

export interface TerminalOptions {
  useColor: boolean;
}

const STATUS_SYMBOLS: Record<ModelStatus, string> = {
  ACTIVE: '✓',
  UNAVAILABLE: '✗',
  RATE_LIMITED: '⚠',
  AUTH_ERROR: '✗',
  PROVIDER_ERROR: '✗',
  TIMEOUT: '⚠',
  INVALID_RESPONSE: '✗',
  UNKNOWN_ERROR: '?',
};

const STATUS_LABELS: Record<ModelStatus, string> = {
  ACTIVE: 'HIDUP',
  UNAVAILABLE: 'MATI',
  RATE_LIMITED: 'LIMIT',
  AUTH_ERROR: 'AUTH ERROR',
  PROVIDER_ERROR: 'PROVIDER ERROR',
  TIMEOUT: 'TIMEOUT',
  INVALID_RESPONSE: 'INVALID',
  UNKNOWN_ERROR: 'UNKNOWN',
};

const STATUS_COLORS: Record<ModelStatus, string> = {
  ACTIVE: '\x1b[32m', // Green - HIDUP
  UNAVAILABLE: '\x1b[31m', // Red - MATI
  RATE_LIMITED: '\x1b[33m', // Yellow - LIMIT
  AUTH_ERROR: '\x1b[31m', // Red - AUTH ERROR
  PROVIDER_ERROR: '\x1b[31m', // Red - PROVIDER ERROR
  TIMEOUT: '\x1b[33m', // Yellow - TIMEOUT
  INVALID_RESPONSE: '\x1b[31m', // Red - INVALID
  UNKNOWN_ERROR: '\x1b[35m', // Magenta - UNKNOWN
};

const RESET_COLOR = '\x1b[0m';

/**
 * Format latency for display
 */
function formatLatency(latencyMs: number): string {
  if (latencyMs < 1000) {
    return `${latencyMs}ms`;
  }
  return `${(latencyMs / 1000).toFixed(2)}s`;
}

/**
 * Display results in terminal (only active models)
 */
export function displayTerminal(
  results: ModelCheckResult[],
  options: TerminalOptions = { useColor: true }
): void {
  // Filter only active models
  const activeModels = results.filter((r) => r.status === 'ACTIVE');

  if (activeModels.length === 0) {
    console.log('\nTidak ada model aktif yang ditemukan.');
    return;
  }

  // Group by provider
  const byProvider = new Map<string, ModelCheckResult[]>();
  for (const result of activeModels) {
    if (!byProvider.has(result.provider)) {
      byProvider.set(result.provider, []);
    }
    byProvider.get(result.provider)!.push(result);
  }

  // Display by provider
  for (const [provider, models] of byProvider) {
    console.log(`\nProvider: ${provider}`);
    console.log('─'.repeat(50));

    for (const model of models) {
      const symbol = STATUS_SYMBOLS[model.status];
      const label = STATUS_LABELS[model.status];
      const latency = formatLatency(model.latencyMs);

      if (options.useColor) {
        const color = STATUS_COLORS[model.status];
        console.log(`${color}${symbol}${RESET_COLOR} ${model.id.padEnd(30)} ${label.padEnd(15)} ${latency}`);
      } else {
        console.log(`${symbol} ${model.id.padEnd(30)} ${label.padEnd(15)} ${latency}`);
      }
    }
  }

  // Display summary
  displaySummary(results);

  // Display recommendations (1 per provider)
  displayRecommendations(activeModels);
}

/**
 * Display summary statistics
 */
function displaySummary(results: ModelCheckResult[]): void {
  const summary = calculateSummary(results);

  console.log('\n' + '─'.repeat(50));
  console.log(`Total Model   : ${summary.total}`);
  console.log(`Hidup         : ${summary.active}`);
  console.log(`Mati          : ${summary.unavailable}`);
  console.log(`Limit         : ${summary.rateLimited}`);
  console.log(`Timeout       : ${summary.timeout}`);
  console.log(`Auth Error    : ${summary.authError}`);
  console.log(`Provider Error: ${summary.providerError}`);
  console.log(`Invalid       : ${summary.invalidResponse}`);
  console.log(`Unknown       : ${summary.unknownError}`);
  console.log('─'.repeat(50));
}

/**
 * Display recommendations (1 best model per provider)
 */
function displayRecommendations(activeModels: ModelCheckResult[]): void {
  if (activeModels.length === 0) {
    return;
  }

  // Group by provider
  const byProvider = new Map<string, ModelCheckResult[]>();
  for (const model of activeModels) {
    if (!byProvider.has(model.provider)) {
      byProvider.set(model.provider, []);
    }
    byProvider.get(model.provider)!.push(model);
  }

  console.log('\n' + '═'.repeat(50));
  console.log('REKOMENDASI MODEL TERBAIK PER PROVIDER');
  console.log('═'.repeat(50));

  for (const [provider, models] of byProvider) {
    // Sort by latency (fastest first)
    const sorted = [...models].sort((a, b) => a.latencyMs - b.latencyMs);
    const best = sorted[0];

    console.log(`\n  Provider: ${provider}`);
    console.log(`  Model: ${best.id}`);
    console.log(`  Latency: ${formatLatency(best.latencyMs)}`);
  }

  console.log('\n' + '═'.repeat(50));
}

/**
 * Calculate summary statistics
 */
export function calculateSummary(results: ModelCheckResult[]) {
  const summary = {
    total: results.length,
    active: 0,
    unavailable: 0,
    rateLimited: 0,
    timeout: 0,
    authError: 0,
    providerError: 0,
    invalidResponse: 0,
    unknownError: 0,
  };

  for (const result of results) {
    switch (result.status) {
      case 'ACTIVE':
        summary.active++;
        break;
      case 'UNAVAILABLE':
        summary.unavailable++;
        break;
      case 'RATE_LIMITED':
        summary.rateLimited++;
        break;
      case 'TIMEOUT':
        summary.timeout++;
        break;
      case 'AUTH_ERROR':
        summary.authError++;
        break;
      case 'PROVIDER_ERROR':
        summary.providerError++;
        break;
      case 'INVALID_RESPONSE':
        summary.invalidResponse++;
        break;
      case 'UNKNOWN_ERROR':
        summary.unknownError++;
        break;
    }
  }

  return summary;
}
