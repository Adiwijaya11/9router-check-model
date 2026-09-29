/**
 * Tests for JSON output
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { generateJsonOutput } from './json.js';
import { ModelCheckResult } from '../types/index.js';

describe('JSON Output', () => {
  it('should generate valid JSON structure', () => {
    const results: ModelCheckResult[] = [
      { id: 'cc/claude-opus', provider: 'cc', status: 'ACTIVE', latencyMs: 1200 },
      { id: 'cc/claude-sonnet', provider: 'cc', status: 'ACTIVE', latencyMs: 800 },
      { id: 'gemini/pro', provider: 'gemini', status: 'UNAVAILABLE', latencyMs: 500, error: 'Not found' },
    ];

    const output = generateJsonOutput(results);

    assert.equal(output.summary.total, 3);
    assert.equal(output.summary.active, 2);
    assert.equal(output.summary.unavailable, 1);
    assert.equal(output.providers.length, 2);
  });

  it('should group models by provider', () => {
    const results: ModelCheckResult[] = [
      { id: 'cc/claude-opus', provider: 'cc', status: 'ACTIVE', latencyMs: 1200 },
      { id: 'gemini/pro', provider: 'gemini', status: 'ACTIVE', latencyMs: 800 },
    ];

    const output = generateJsonOutput(results);

    assert.equal(output.providers.length, 2);
    assert.equal(output.providers[0].name, 'cc');
    assert.equal(output.providers[0].models.length, 1);
    assert.equal(output.providers[1].name, 'gemini');
    assert.equal(output.providers[1].models.length, 1);
  });

  it('should include error field when present', () => {
    const results: ModelCheckResult[] = [
      { id: 'cc/claude-opus', provider: 'cc', status: 'UNAVAILABLE', latencyMs: 500, error: 'Not found' },
    ];

    const output = generateJsonOutput(results);

    assert.equal(output.providers[0].models[0].error, 'Not found');
  });

  it('should handle empty results', () => {
    const output = generateJsonOutput([]);

    assert.equal(output.summary.total, 0);
    assert.equal(output.providers.length, 0);
  });
});
