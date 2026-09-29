/**
 * Tests for model discovery
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { extractProvider, groupByProvider } from './models.js';
import { Model } from '../types/index.js';

describe('Model Discovery', () => {
  describe('extractProvider', () => {
    it('should extract provider from model ID with slash', () => {
      assert.equal(extractProvider('cc/claude-opus-4-5-20251101'), 'cc');
    });

    it('should extract provider from model ID with multiple slashes', () => {
      assert.equal(extractProvider('provider/sub/model'), 'provider');
    });

    it('should return Unknown for model ID without slash', () => {
      assert.equal(extractProvider('model-name'), 'Unknown');
    });

    it('should return Unknown for empty string', () => {
      assert.equal(extractProvider(''), 'Unknown');
    });
  });

  describe('groupByProvider', () => {
    it('should group models by provider', () => {
      const models: Model[] = [
        { id: 'cc/claude-opus', object: 'model', created: 1, owned_by: 'cc' },
        { id: 'cc/claude-sonnet', object: 'model', created: 1, owned_by: 'cc' },
        { id: 'gemini/pro', object: 'model', created: 1, owned_by: 'gemini' },
      ];

      const groups = groupByProvider(models);
      assert.equal(groups.length, 2);
      assert.equal(groups[0].name, 'cc');
      assert.equal(groups[0].models.length, 2);
      assert.equal(groups[1].name, 'gemini');
      assert.equal(groups[1].models.length, 1);
    });

    it('should handle empty model list', () => {
      const groups = groupByProvider([]);
      assert.equal(groups.length, 0);
    });

    it('should handle models without provider', () => {
      const models: Model[] = [
        { id: 'model-a', object: 'model', created: 1, owned_by: 'unknown' },
        { id: 'model-b', object: 'model', created: 1, owned_by: 'unknown' },
      ];

      const groups = groupByProvider(models);
      assert.equal(groups.length, 1);
      assert.equal(groups[0].name, 'Unknown');
      assert.equal(groups[0].models.length, 2);
    });
  });
});
