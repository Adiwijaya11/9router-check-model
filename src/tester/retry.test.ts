/**
 * Tests for retry logic
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { isRetryableError, withRetry } from './retry.js';

describe('Retry Logic', () => {
  describe('isRetryableError', () => {
    it('should return true for 408', () => {
      assert.equal(isRetryableError(408), true);
    });

    it('should return true for 429', () => {
      assert.equal(isRetryableError(429), true);
    });

    it('should return true for 502', () => {
      assert.equal(isRetryableError(502), true);
    });

    it('should return true for 503', () => {
      assert.equal(isRetryableError(503), true);
    });

    it('should return true for 504', () => {
      assert.equal(isRetryableError(504), true);
    });

    it('should return false for 400', () => {
      assert.equal(isRetryableError(400), false);
    });

    it('should return false for 401', () => {
      assert.equal(isRetryableError(401), false);
    });

    it('should return false for 403', () => {
      assert.equal(isRetryableError(403), false);
    });

    it('should return false for 404', () => {
      assert.equal(isRetryableError(404), false);
    });
  });

  describe('withRetry', () => {
    it('should succeed on first attempt', async () => {
      let attempts = 0;
      const result = await withRetry(async () => {
        attempts++;
        return 'success';
      });
      assert.equal(result, 'success');
      assert.equal(attempts, 1);
    });

    it('should retry on retryable error', async () => {
      let attempts = 0;
      const result = await withRetry(async () => {
        attempts++;
        if (attempts < 3) {
          throw new Error('502 Bad Gateway');
        }
        return 'success';
      }, { maxRetries: 3, baseDelayMs: 10, maxDelayMs: 50 });
      assert.equal(result, 'success');
      assert.equal(attempts, 3);
    });

    it('should not retry on non-retryable error', async () => {
      let attempts = 0;
      await assert.rejects(
        withRetry(async () => {
          attempts++;
          throw new Error('401 Unauthorized');
        }, { maxRetries: 3, baseDelayMs: 10, maxDelayMs: 50 })
      );
      assert.equal(attempts, 1);
    });

    it('should throw after max retries', async () => {
      let attempts = 0;
      await assert.rejects(
        withRetry(async () => {
          attempts++;
          throw new Error('502 Bad Gateway');
        }, { maxRetries: 2, baseDelayMs: 10, maxDelayMs: 50 })
      );
      assert.equal(attempts, 3); // 1 initial + 2 retries
    });
  });
});
