#!/usr/bin/env node

/**
 * 9Router Model Checker
 * 
 * Unofficial CLI tool for checking 9Router model availability.
 */

import * as readline from 'node:readline';
import { loadConfig, validateConfig } from './config/config.js';
import { RouterClient } from './router/client.js';
import { groupByProvider } from './router/models.js';
import { testModel } from './tester/model-tester.js';
import { withConcurrency } from './tester/concurrency.js';
import { displayTerminal } from './output/terminal.js';
import { outputJson } from './output/json.js';
import { outputCsv } from './output/csv.js';
import { ModelCheckResult } from './types/index.js';

const CURRENT_VERSION = '0.1.4';
const NPM_PACKAGE_NAME = '9router-check';

interface CliOptions {
  concurrency: number;
  json: boolean;
  csv: boolean;
  provider?: string;
  baseUrl?: string;
  help: boolean;
  version: boolean;
  debug: boolean;
  noUpdateCheck: boolean;
}

function parseArgs(args: string[]): CliOptions {
  const options: CliOptions = {
    concurrency: 3,
    json: false,
    csv: false,
    help: false,
    version: false,
    debug: false,
    noUpdateCheck: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    switch (arg) {
      case '--help':
      case '-h':
        options.help = true;
        break;
      case '--version':
      case '-v':
        options.version = true;
        break;
      case '--json':
        options.json = true;
        break;
      case '--csv':
        options.csv = true;
        break;
      case '--concurrency':
      case '-c':
        const value = args[++i];
        if (value) {
          options.concurrency = parseInt(value, 10);
          if (isNaN(options.concurrency) || options.concurrency < 1) {
            console.error('Error: --concurrency must be a positive number');
            process.exit(1);
          }
        }
        break;
      case '--provider':
      case '-p':
        const provider = args[++i];
        if (provider) {
          options.provider = provider;
        }
        break;
      case '--base-url':
      case '-b':
        const baseUrl = args[++i];
        if (baseUrl) {
          options.baseUrl = baseUrl;
        }
        break;
      case '--debug':
        options.debug = true;
        break;
      case '--no-update-check':
        options.noUpdateCheck = true;
        break;
    }
  }

  return options;
}

function showWelcome(): void {
  const RESET = '\x1b[0m';
  const BOLD = '\x1b[1m';
  const DIM = '\x1b[2m';
  const CYAN = '\x1b[36m';
  const GREEN = '\x1b[32m';
  const RED = '\x1b[31m';
  const YELLOW = '\x1b[33m';
  const MAGENTA = '\x1b[35m';

  console.log(`
${BOLD}${CYAN}╔══════════════════════════════════════════════════════════╗${RESET}
${BOLD}${CYAN}║${RESET}      ${BOLD}9Router Model Checker${RESET} ${DIM}v${CURRENT_VERSION}${RESET}                    ${BOLD}${CYAN}║${RESET}
${BOLD}${CYAN}╚══════════════════════════════════════════════════════════╝${RESET}

${DIM}Unofficial CLI tool for checking 9Router model availability.${RESET}

${BOLD}┌──────────────────────────────────────────────────────────┐${RESET}
${BOLD}│${RESET}  ${BOLD}STATUS PENGECEKAN${RESET}                                    ${BOLD}│${RESET}
${BOLD}├──────────────┬───────────────────────────────────────────┤${RESET}
${BOLD}│${RESET}  ${GREEN}✓ HIDUP${RESET}        │ Model berfungsi normal dan dapat digunakan  ${BOLD}│${RESET}
${BOLD}│${RESET}  ${RED}✗ MATI${RESET}         │ Model tidak ditemukan / tidak tersedia   ${BOLD}│${RESET}
${BOLD}│${RESET}  ${YELLOW}⚠ LIMIT${RESET}        │ Rate limit (429) - terlalu banyak request${BOLD}│${RESET}
${BOLD}│${RESET}  ${RED}✗ AUTH ERROR${RESET}   │ Auth gagal (401/403) - API key salah     ${BOLD}│${RESET}
${BOLD}│${RESET}  ${RED}✗ PROVIDER ERROR${RESET} │ Server error (5xx) - masalah di provider  ${BOLD}│${RESET}
${BOLD}│${RESET}  ${YELLOW}⚠ TIMEOUT${RESET}      │ Request timeout - respons terlalu lambat  ${BOLD}│${RESET}
${BOLD}│${RESET}  ${RED}✗ INVALID${RESET}      │ Response tidak valid - format salah      ${BOLD}│${RESET}
${BOLD}│${RESET}  ${MAGENTA}? UNKNOWN${RESET}      │ Error tidak dikenali - perlu investigasi  ${BOLD}│${RESET}
${BOLD}└──────────────┴───────────────────────────────────────────┘${RESET}
`);
}

function showHelp(): void {
  console.log(`
9Router Model Checker

Unofficial CLI tool for checking 9Router model availability.

Usage:
  9router-check [options]

Options:
  -h, --help              Show this help message
  -v, --version           Show version
  -b, --base-url <url>    9Router base URL (default: http://localhost:20128/v1)
  -c, --concurrency <n>   Max concurrent requests (default: 3)
  -p, --provider <name>   Filter by provider
      --json              Output as JSON
      --csv               Output as CSV
      --debug             Show debug request/response
      --no-update-check   Skip update check

Environment Variables:
  NINE_ROUTER_BASE_URL    9Router API base URL
  NINE_ROUTER_API_KEY     9Router API key

Examples:
  9router-check
  9router-check --base-url http://localhost:20128/v1
  9router-check --concurrency 5
  9router-check --json
  9router-check --provider cc
`);
}

function showVersion(): void {
  console.log(CURRENT_VERSION);
}

/**
 * Check if a newer version is available on npm
 */
async function checkForUpdate(): Promise<string | null> {
  try {
    const response = await fetch(`https://registry.npmjs.org/${NPM_PACKAGE_NAME}/latest`, {
      signal: AbortSignal.timeout(3000),
    });
    
    if (!response.ok) return null;
    
    const data = await response.json() as { version: string };
    
    if (data.version !== CURRENT_VERSION) {
      return data.version;
    }
  } catch {
    // Silently fail - don't block main functionality
  }
  return null;
}

/**
 * Prompt user for update
 */
async function promptUpdate(latestVersion: string): Promise<boolean> {
  const YELLOW = '\x1b[33m';
  const RESET = '\x1b[0m';
  const BOLD = '\x1b[1m';
  const CYAN = '\x1b[36m';
  
  console.log(`\n${YELLOW}${BOLD}╔══════════════════════════════════════════════════════════╗${RESET}`);
  console.log(`${YELLOW}${BOLD}║${RESET}  ${YELLOW}Update tersedia!${RESET}                                        ${YELLOW}${BOLD}║${RESET}`);
  console.log(`${YELLOW}${BOLD}║${RESET}  Versi saat ini: ${CURRENT_VERSION}  →  Versi terbaru: ${latestVersion}      ${YELLOW}${BOLD}║${RESET}`);
  console.log(`${YELLOW}${BOLD}╚══════════════════════════════════════════════════════════╝${RESET}`);
  
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const answer = await new Promise<string>((resolve) => {
    rl.question(`\n${CYAN}${BOLD}Update sekarang? (y/n): ${RESET}`, (ans: string) => {
      rl.close();
      resolve(ans.trim().toLowerCase());
    });
  });
  
  return answer === 'y' || answer === 'yes';
}

/**
 * Run update command
 */
async function runUpdate(): Promise<void> {
  const { exec } = await import('node:child_process');
  const { promisify } = await import('node:util');
  const execAsync = promisify(exec);

  const CYAN = '\x1b[36m';
  const GREEN = '\x1b[32m';
  const RED = '\x1b[31m';
  const BOLD = '\x1b[1m';
  const RESET = '\x1b[0m';

  console.log(`\n${CYAN}${BOLD}Updating 9router-check...${RESET}\n`);

  try {
    const { stdout, stderr } = await execAsync('npm install -g 9router-check');
    if (stdout) console.log(stdout);
    if (stderr) console.error(stderr);
    console.log(`\n${GREEN}${BOLD}Update berhasil! Silakan jalankan ulang 9router-check.${RESET}\n`);
  } catch (error) {
    console.error(`\n${RED}${BOLD}Update gagal.${RESET}`);
    console.error(`  Jalankan manual: ${BOLD}npm install -g 9router-check${RESET}\n`);
  }
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const options = parseArgs(args);

  if (options.help) {
    showHelp();
    return;
  }

  if (options.version) {
    showVersion();
    return;
  }

  // Check for updates BEFORE welcome
  if (!options.noUpdateCheck) {
    const latestVersion = await checkForUpdate();
    if (latestVersion) {
      const wantsUpdate = await promptUpdate(latestVersion);
      if (wantsUpdate) {
        await runUpdate();
        return; // Exit after update - user should re-run
      }
    }
  }

  // Show welcome screen
  showWelcome();

  // Load configuration (will prompt for API key if not set)
  const config = await loadConfig(options.baseUrl);
  const errors = validateConfig(config);

  if (errors.length > 0) {
    console.error('Configuration errors:');
    for (const error of errors) {
      console.error(`  - ${error}`);
    }
    console.error('\nPlease set the required environment variables.');
    console.error('See .env.example for reference.');
    process.exit(1);
  }

  console.log(`\nBase URL: ${config.baseUrl}`);
  console.log(`API Key: ${config.apiKey ? '***' + config.apiKey.slice(-4) : 'Not set'}\n`);

  // Create API client
  const client = new RouterClient(config);

  try {
    // Fetch models
    console.log('Fetching models...');
    const modelsResponse = await client.getModels();

    // Filter by provider if specified
    let models = modelsResponse.data;
    if (options.provider) {
      models = models.filter((m) => m.id.startsWith(`${options.provider}/`));
    }

    // Group by provider
    const providerGroups = groupByProvider(models);

    // Test all models with concurrency
    const results: ModelCheckResult[] = [];

    for (const group of providerGroups) {
      console.log(`\nCek model dari provider: ${group.name} (${group.models.length} model)`);
      
      const groupResults = await withConcurrency(
        group.models,
        options.concurrency,
        async (model) => {
          return testModel(client, model.id, group.name, {
            timeoutMs: config.timeoutMs,
            maxRetries: config.maxRetries,
          }, options.debug);
        }
      );
      results.push(...groupResults);
    }

    // Output results
    if (options.json) {
      outputJson(results);
    } else if (options.csv) {
      outputCsv(results);
    } else {
      displayTerminal(results, { useColor: true });
    }

  } catch (error) {
    console.error('\nError connecting to 9Router:');
    console.error(`  ${error instanceof Error ? error.message : String(error)}`);
    console.error('\nTroubleshooting:');
    console.error('  1. Pastikan 9Router berjalan');
    console.error('  2. Cek Base URL benar (default: http://localhost:20128/v1)');
    console.error('  3. Cek API Key benar');
    console.error('  4. Cek koneksi network');
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('Unexpected error:', error);
  process.exit(1);
});
