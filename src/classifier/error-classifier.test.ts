/**
 * Tests for error classifier
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { classifyError, classifySuccess } from './error-classifier.js';

describe('Error Classifier', () => {
  describe('classifySuccess', () => {
    it('should return ACTIVE status', () => {
      const result = classifySuccess();
      assert.equal(result.status, 'ACTIVE');
      assert.equal(result.error, undefined);
    });
  });

  describe('classifyError', () => {
    it('should classify 429 as RATE_LIMITED', () => {
      const result = classifyError(429, 'Too many requests');
      assert.equal(result.status, 'RATE_LIMITED');
    });

    it('should classify rate limit message as RATE_LIMITED', () => {
      const result = classifyError(400, 'Rate limit exceeded');
      assert.equal(result.status, 'RATE_LIMITED');
    });

    it('should classify 401 as AUTH_ERROR', () => {
      const result = classifyError(401, 'Unauthorized');
      assert.equal(result.status, 'AUTH_ERROR');
    });

    it('should classify 403 as AUTH_ERROR', () => {
      const result = classifyError(403, 'Forbidden');
      assert.equal(result.status, 'AUTH_ERROR');
    });

    it('should classify 500 as PROVIDER_ERROR', () => {
      const result = classifyError(500, 'Internal server error');
      assert.equal(result.status, 'PROVIDER_ERROR');
    });

    it('should classify 502 as PROVIDER_ERROR', () => {
      const result = classifyError(502, 'Bad gateway');
      assert.equal(result.status, 'PROVIDER_ERROR');
    });

    it('should classify 503 as PROVIDER_ERROR', () => {
      const result = classifyError(503, 'Service unavailable');
      assert.equal(result.status, 'PROVIDER_ERROR');
    });

    it('should classify 504 as PROVIDER_ERROR', () => {
      const result = classifyError(504, 'Gateway timeout');
      assert.equal(result.status, 'PROVIDER_ERROR');
    });

    it('should classify 408 as TIMEOUT', () => {
      const result = classifyError(408, 'Request timeout');
      assert.equal(result.status, 'TIMEOUT');
    });

    it('should classify timeout message as TIMEOUT', () => {
      const result = classifyError(400, 'Connection timed out');
      assert.equal(result.status, 'TIMEOUT');
    });

    it('should classify 404 as UNAVAILABLE', () => {
      const result = classifyError(404, 'Model not found');
      assert.equal(result.status, 'UNAVAILABLE');
    });

    it('should classify not found message as UNAVAILABLE', () => {
      const result = classifyError(400, 'Model does not exist');
      assert.equal(result.status, 'UNAVAILABLE');
    });

    it('should classify invalid response as INVALID_RESPONSE', () => {
      const result = classifyError(200, 'Invalid response format');
      assert.equal(result.status, 'INVALID_RESPONSE');
    });

    it('should classify unknown errors as UNKNOWN_ERROR', () => {
      const result = classifyError(400, 'Something went wrong');
      assert.equal(result.status, 'UNKNOWN_ERROR');
    });
  });
});
