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

  const GREEN = '\x1b[32m';
  const RED = '\x1b[31m';
  const YELLOW = '\x1b[33m';
  const MAGENTA = '\x1b[35m';
  const BOLD = '\x1b[1m';
  const RESET = '\x1b[0m';

  console.log(`\n${BOLD}┌──────────────────────────────────────────────────────────┐${RESET}`);
  console.log(`${BOLD}│${RESET}  ${BOLD}RINGKASAN${RESET}                                                ${BOLD}│${RESET}`);
  console.log(`${BOLD}├──────────────────────────────────────────────────────────┤${RESET}`);
  console.log(`${BOLD}│${RESET}  Total Model   : ${BOLD}${summary.total}${RESET}                                    ${BOLD}│${RESET}`);
  console.log(`${BOLD}│${RESET}  ${GREEN}Hidup${RESET}         : ${GREEN}${summary.active}${RESET}                                    ${BOLD}│${RESET}`);
  console.log(`${BOLD}│${RESET}  ${RED}Mati${RESET}          : ${RED}${summary.unavailable}${RESET}                                    ${BOLD}│${RESET}`);
  console.log(`${BOLD}│${RESET}  ${YELLOW}Limit${RESET}         : ${YELLOW}${summary.rateLimited}${RESET}                                    ${BOLD}│${RESET}`);
  console.log(`${BOLD}│${RESET}  ${YELLOW}Timeout${RESET}       : ${YELLOW}${summary.timeout}${RESET}                                    ${BOLD}│${RESET}`);
  console.log(`${BOLD}│${RESET}  ${RED}Auth Error${RESET}    : ${RED}${summary.authError}${RESET}                                    ${BOLD}│${RESET}`);
  console.log(`${BOLD}│${RESET}  ${RED}Provider Error${RESET} : ${RED}${summary.providerError}${RESET}                                    ${BOLD}│${RESET}`);
  console.log(`${BOLD}│${RESET}  ${RED}Invalid${RESET}        : ${RED}${summary.invalidResponse}${RESET}                                    ${BOLD}│${RESET}`);
  console.log(`${BOLD}│${RESET}  ${MAGENTA}Unknown${RESET}        : ${MAGENTA}${summary.unknownError}${RESET}                                    ${BOLD}│${RESET}`);
  console.log(`${BOLD}└──────────────────────────────────────────────────────────┘${RESET}`);
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

  const CYAN = '\x1b[36m';
  const GREEN = '\x1b[32m';
  const BOLD = '\x1b[1m';
  const RESET = '\x1b[0m';

  console.log(`\n${BOLD}${CYAN}╔══════════════════════════════════════════════════════════╗${RESET}`);
  console.log(`${BOLD}${CYAN}║${RESET}  ${BOLD}${CYAN}REKOMENDASI MODEL TERBAIK PER PROVIDER${RESET}                ${BOLD}${CYAN}║${RESET}`);
  console.log(`${BOLD}${CYAN}╚══════════════════════════════════════════════════════════╝${RESET}`);

  for (const [provider, models] of byProvider) {
    // Sort by latency (fastest first)
    const sorted = [...models].sort((a, b) => a.latencyMs - b.latencyMs);
    const best = sorted[0];

    // Extract AI name from model ID (e.g., "gcli/grok-4.7" → "grok-4.7")
    const aiName = best.id.includes('/') ? best.id.split('/').slice(1).join('/') : best.id;

    console.log(`\n  ${BOLD}Provider:${RESET} ${CYAN}${provider}${RESET}`);
    console.log(`  ${BOLD}AI:${RESET}       ${GREEN}${aiName}${RESET}`);
    console.log(`  ${BOLD}Latency:${RESET}  ${GREEN}${formatLatency(best.latencyMs)}${RESET}`);
  }

  console.log(`\n${BOLD}${CYAN}╚══════════════════════════════════════════════════════════╝${RESET}`);
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
