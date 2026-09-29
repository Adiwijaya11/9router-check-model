/**
 * Type definitions for 9Router API
 */

export interface Model {
  id: string;
  object: string;
  created: number;
  owned_by: string;
}

export interface ModelsResponse {
  object: string;
  data: Model[];
}

export interface ChatCompletionRequest {
  model: string;
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>;
  max_tokens?: number;
  temperature?: number;
}

export interface ChatCompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface ApiError {
  error: {
    message: string;
    type: string;
    code: string;
  };
}

export type ModelStatus =
  | 'ACTIVE'
  | 'UNAVAILABLE'
  | 'RATE_LIMITED'
  | 'AUTH_ERROR'
  | 'PROVIDER_ERROR'
  | 'TIMEOUT'
  | 'INVALID_RESPONSE'
  | 'UNKNOWN_ERROR';

export interface ModelCheckResult {
  id: string;
  provider: string;
  status: ModelStatus;
  latencyMs: number;
  error?: string;
}
