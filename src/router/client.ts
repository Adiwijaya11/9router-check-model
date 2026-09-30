/**
 * 9Router API Client
 * 
 * Abstraction layer for 9Router API.
 * Uses OpenAI-compatible endpoints.
 */

import { Config } from '../config/config.js';
import { ModelsResponse, ChatCompletionRequest, ChatCompletionResponse, ApiError } from '../types/index.js';

export class RouterClient {
  private config: Config;

  constructor(config: Config) {
    this.config = config;
  }

  /**
   * Get list of available models from 9Router
   */
  async getModels(): Promise<ModelsResponse> {
    const url = `${this.config.baseUrl}/models`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorBody = await response.json() as ApiError;
      throw new Error(`Failed to fetch models: ${response.status} - ${errorBody.error?.message || response.statusText}`);
    }

    return response.json() as Promise<ModelsResponse>;
  }

  /**
   * Send a chat completion request to test a model
   * Tries multiple request formats until one succeeds
   */
  async testModel(modelId: string, debug: boolean = false): Promise<ChatCompletionResponse> {
    const url = `${this.config.baseUrl}/chat/completions`;

    // Try different request formats (fallback)
    const requestFormats: ChatCompletionRequest[] = [
      // Format 1: Simple with max_tokens
      {
        model: modelId,
        messages: [{ role: 'user', content: 'Hi' }],
        max_tokens: 5,
      },
      // Format 2: Without max_tokens
      {
        model: modelId,
        messages: [{ role: 'user', content: 'Hi' }],
      },
      // Format 3: With temperature
      {
        model: modelId,
        messages: [{ role: 'user', content: 'Hi' }],
        max_tokens: 5,
        temperature: 0.7,
      },
    ];

    let lastError: Error | null = null;

    for (let i = 0; i < requestFormats.length; i++) {
      const request = requestFormats[i];

      if (debug) {
        console.log(`\n[DEBUG] Attempt ${i + 1}/${requestFormats.length}`);
        console.log(`[DEBUG] Request to ${url}`);
        console.log(`[DEBUG] Body: ${JSON.stringify(request, null, 2)}`);
      }

      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(request),
        });

        if (debug) {
          console.log(`[DEBUG] Response status: ${response.status} ${response.statusText}`);
        }

        if (!response.ok) {
          const errorBody = await response.json().catch(() => ({})) as ApiError;
          const errorMessage = errorBody.error?.message || response.statusText;
          if (debug) {
            console.log(`[DEBUG] Error body: ${JSON.stringify(errorBody, null, 2)}`);
          }
          lastError = new Error(`Model test failed: ${response.status} - ${errorMessage}`);
          continue; // Try next format
        }

        const data = await response.json() as ChatCompletionResponse;

        if (debug) {
          console.log(`[DEBUG] Response: ${JSON.stringify(data, null, 2)}`);
        }

        return data; // Success!
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        if (debug) {
          console.log(`[DEBUG] Fetch error: ${lastError.message}`);
        }
        continue; // Try next format
      }
    }

    // All formats failed
    throw lastError || new Error('All request formats failed');
  }
}
