/**
 * Tests for concurrency controller
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { withConcurrency } from './concurrency.js';

describe('Concurrency Controller', () => {
  it('should execute all tasks', async () => {
    const tasks = [1, 2, 3, 4, 5];
    const results = await withConcurrency(tasks, 2, async (x) => x * 2);
    assert.deepEqual(results, [2, 4, 6, 8, 10]);
  });

  it('should respect concurrency limit', async () => {
    const tasks = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    let running = 0;
    let maxRunning = 0;

    await withConcurrency(tasks, 3, async (x) => {
      running++;
      maxRunning = Math.max(maxRunning, running);
      await new Promise((resolve) => setTimeout(resolve, 10));
      running--;
      return x;
    });

    assert.equal(maxRunning, 3);
  });

  it('should handle empty task list', async () => {
    const results = await withConcurrency([], 3, async (x) => x);
    assert.deepEqual(results, []);
  });

  it('should handle single task', async () => {
    const results = await withConcurrency([1], 3, async (x) => x * 2);
    assert.deepEqual(results, [2]);
  });

  it('should handle concurrency larger than task count', async () => {
    const tasks = [1, 2, 3];
    const results = await withConcurrency(tasks, 10, async (x) => x * 2);
    assert.deepEqual(results, [2, 4, 6]);
  });
});
