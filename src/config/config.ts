/**
 * Configuration management for 9Router API
 */

import * as readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';

export interface Config {
  baseUrl: string;
  apiKey: string;
  timeoutMs: number;
  maxRetries: number;
  concurrency: number;
}

/**
 * Prompt user for input (hidden for API key)
 */
async function promptInput(message: string, hidden: boolean = false): Promise<string> {
  const rl = readline.createInterface({ input, output });
  
  if (hidden) {
    output.write(message);
  } else {
    output.write(message);
  }
  
  return new Promise((resolve) => {
    let value = '';
    
    input.on('data', (char) => {
      const str = char.toString();
      
      if (str === '\n' || str === '\r') {
        output.write('\n');
        input.removeAllListeners('data');
        rl.close();
        resolve(value.trim());
      } else if (str === '\u007f') { // Backspace
        value = value.slice(0, -1);
      } else {
        value += str;
      }
    });
  });
}

/**
 * Load configuration from environment variables or prompt
 */
export async function loadConfig(cliBaseUrl?: string): Promise<Config> {
  // Priority: CLI arg > env var > prompt
  let baseUrl = cliBaseUrl || process.env.NINE_ROUTER_BASE_URL || '';
  let apiKey = process.env.NINE_ROUTER_API_KEY || '';

  // If no base URL, prompt user
  if (!baseUrl) {
    baseUrl = await promptInput('Enter 9Router Base URL (default: http://localhost:20128/v1): ');
    if (!baseUrl) {
      baseUrl = 'http://localhost:20128/v1';
    }
  }

  // If no API key, prompt user
  if (!apiKey) {
    apiKey = await promptInput('Enter 9Router API Key: ', true);
  }

  return {
    baseUrl,
    apiKey,
    timeoutMs: 30000,
    maxRetries: 2,
    concurrency: 3,
  };
}

export function validateConfig(config: Config): string[] {
  const errors: string[] = [];

  if (!config.baseUrl) {
    errors.push('Base URL is required');
  }

  if (!config.apiKey) {
    errors.push('API Key is required');
  }

  return errors;
}
