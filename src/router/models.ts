/**
 * Model discovery and provider extraction
 */

import { Model } from '../types/index.js';

export interface ProviderGroup {
  name: string;
  models: Model[];
}

/**
 * Extract provider name from model ID
 * Model format: provider/model (e.g., "cc/claude-opus-4-5-20251101")
 */
export function extractProvider(modelId: string): string {
  const parts = modelId.split('/');
  if (parts.length >= 2) {
    return parts[0];
  }
  return 'Unknown';
}

/**
 * Group models by provider
 */
export function groupByProvider(models: Model[]): ProviderGroup[] {
  const groups: Map<string, Model[]> = new Map();

  for (const model of models) {
    const provider = extractProvider(model.id);
    if (!groups.has(provider)) {
      groups.set(provider, []);
    }
    groups.get(provider)!.push(model);
  }

  return Array.from(groups.entries()).map(([name, models]) => ({
    name,
    models,
  }));
}
