/**
 * Concurrency controller for parallel model testing
 */

/**
 * Execute tasks with limited concurrency
 */
export async function withConcurrency<T, R>(
  tasks: T[],
  concurrency: number,
  fn: (task: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(tasks.length);
  let index = 0;

  async function worker(): Promise<void> {
    while (index < tasks.length) {
      const currentIndex = index++;
      results[currentIndex] = await fn(tasks[currentIndex]);
    }
  }

  // Create worker pool
  const workers: Promise<void>[] = [];
  const workerCount = Math.min(concurrency, tasks.length);

  for (let i = 0; i < workerCount; i++) {
    workers.push(worker());
  }

  await Promise.all(workers);
  return results;
}
