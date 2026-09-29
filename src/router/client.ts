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
   */
  async testModel(modelId: string, debug: boolean = false): Promise<ChatCompletionResponse> {
    const url = `${this.config.baseUrl}/chat/completions`;
    
    const request: ChatCompletionRequest = {
      model: modelId,
      messages: [
        {
          role: 'user',
          content: 'Hi',
        },
      ],
      max_tokens: 1,
    };

    if (debug) {
      console.log(`\n[DEBUG] Request to ${url}`);
      console.log(`[DEBUG] Body: ${JSON.stringify(request, null, 2)}`);
    }

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
      throw new Error(`Model test failed: ${response.status} - ${errorMessage}`);
    }

    const data = await response.json() as ChatCompletionResponse;
    
    if (debug) {
      console.log(`[DEBUG] Response: ${JSON.stringify(data, null, 2)}`);
    }

    return data;
  }
}
