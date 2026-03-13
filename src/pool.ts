import type { PoolOptions, PoolResult, PoolError, PoolProgress } from './types.js';

export async function promisePool<T>(
  tasks: (() => Promise<T>)[],
  options: PoolOptions = {},
): Promise<PoolResult<T>> {
  const { concurrency = 5, stopOnError = false, onProgress } = options;
  const total = tasks.length;
  const results: (T | undefined)[] = new Array(total).fill(undefined);
  const errors: PoolError[] = [];

  let nextIndex = 0;
  let completed = 0;
  let failed = 0;
  let stopped = false;

  function reportProgress(): void {
    if (onProgress) {
      const progress: PoolProgress = {
        completed,
        failed,
        total,
        percent: total > 0 ? Math.round(((completed + failed) / total) * 100) : 100,
      };
      onProgress(progress);
    }
  }

  async function runNext(): Promise<void> {
    while (nextIndex < total && !stopped) {
      const index = nextIndex++;

      try {
        results[index] = await tasks[index]();
        completed++;
      } catch (error) {
        failed++;
        errors.push({ index, error });

        if (stopOnError) {
          stopped = true;
          return;
        }
      }

      reportProgress();
    }
  }

  const workers = Array.from(
    { length: Math.min(concurrency, total) },
    () => runNext(),
  );

  await Promise.all(workers);

  return { results, errors };
}

export function createPool(options: PoolOptions = {}): {
  run<T>(task: () => Promise<T>): Promise<T>;
} {
  const { concurrency = 5 } = options;

  let active = 0;
  const queue: Array<{ task: () => Promise<unknown>; resolve: (v: unknown) => void; reject: (e: unknown) => void }> = [];

  function tryRunNext(): void {
    if (active >= concurrency || queue.length === 0) return;

    const next = queue.shift()!;
    active++;

    next.task().then(
      (value) => {
        active--;
        next.resolve(value);
        tryRunNext();
      },
      (error) => {
        active--;
        next.reject(error);
        tryRunNext();
      },
    );
  }

  return {
    run<T>(task: () => Promise<T>): Promise<T> {
      return new Promise<T>((resolve, reject) => {
        queue.push({
          task: task as () => Promise<unknown>,
          resolve: resolve as (v: unknown) => void,
          reject,
        });
        tryRunNext();
      });
    },
  };
}
