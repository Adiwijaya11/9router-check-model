/**
 * Tests for CSV output
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { generateCsvOutput } from './csv.js';
import { ModelCheckResult } from '../types/index.js';

describe('CSV Output', () => {
  it('should generate valid CSV with headers', () => {
    const results: ModelCheckResult[] = [
      { id: 'cc/claude-opus', provider: 'cc', status: 'ACTIVE', latencyMs: 1200 },
    ];

    const csv = generateCsvOutput(results);
    const lines = csv.split('\n');

    assert.equal(lines[0], 'provider,model,status,latencyMs,error');
    assert.equal(lines.length, 2);
  });

  it('should escape fields with commas', () => {
    const results: ModelCheckResult[] = [
      { id: 'model,with,commas', provider: 'cc', status: 'ACTIVE', latencyMs: 1200, error: 'Error, with comma' },
    ];

    const csv = generateCsvOutput(results);
    const lines = csv.split('\n');

    assert.ok(lines[1].includes('"model,with,commas"'));
    assert.ok(lines[1].includes('"Error, with comma"'));
  });

  it('should handle empty results', () => {
    const csv = generateCsvOutput([]);
    const lines = csv.split('\n');

    assert.equal(lines[0], 'provider,model,status,latencyMs,error');
    assert.equal(lines.length, 1);
  });

  it('should include all fields', () => {
    const results: ModelCheckResult[] = [
      { id: 'cc/claude-opus', provider: 'cc', status: 'ACTIVE', latencyMs: 1200 },
    ];

    const csv = generateCsvOutput(results);
    const lines = csv.split('\n');
    const fields = lines[1].split(',');

    assert.equal(fields[0], 'cc');
    assert.equal(fields[1], 'cc/claude-opus');
    assert.equal(fields[2], 'ACTIVE');
    assert.equal(fields[3], '1200');
    assert.equal(fields[4], '');
  });
});
