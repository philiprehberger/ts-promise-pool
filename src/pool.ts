import type { PoolOptions, PoolResult, PoolError, PoolProgress, PrioritizedTask, TaskResult } from './types.js';
import { TimeoutError } from './types.js';

function wrapWithTimeout<T>(
  task: () => Promise<T>,
  index: number,
  timeout: number,
): () => Promise<T> {
  return () =>
    new Promise<T>((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new TimeoutError(index, timeout));
      }, timeout);

      task().then(
        (value) => {
          clearTimeout(timer);
          resolve(value);
        },
        (error) => {
          clearTimeout(timer);
          reject(error);
        },
      );
    });
}

export async function promisePool<T>(
  tasks: (() => Promise<T>)[] | PrioritizedTask<T>[],
  options: PoolOptions = {},
): Promise<PoolResult<T>> {
  const {
    concurrency = 5,
    stopOnError = false,
    onProgress,
    signal,
    taskTimeout,
    onResult,
  } = options;

  // Normalize tasks: support both plain function arrays and prioritized tasks
  const normalizedTasks = normalizeTasks(tasks);
  const total = normalizedTasks.length;
  const results: (T | undefined)[] = new Array(total).fill(undefined);
  const errors: PoolError[] = [];

  let nextIndex = 0;
  let completed = 0;
  let failed = 0;
  let stopped = false;
  let aborted = false;

  // Check if already aborted
  if (signal?.aborted) {
    return { results, errors, aborted: true };
  }

  // Listen for abort
  const abortHandler = signal
    ? () => {
        stopped = true;
        aborted = true;
      }
    : undefined;

  if (signal && abortHandler) {
    signal.addEventListener('abort', abortHandler, { once: true });
  }

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

  function emitResult(taskResult: TaskResult<T>): void {
    if (onResult) {
      onResult(taskResult as TaskResult<unknown>);
    }
  }

  async function runNext(): Promise<void> {
    while (nextIndex < total && !stopped) {
      const index = nextIndex++;
      const entry = normalizedTasks[index];
      const taskFn = taskTimeout
        ? wrapWithTimeout(entry.task, entry.originalIndex, taskTimeout)
        : entry.task;

      try {
        const value = await taskFn();
        results[entry.originalIndex] = value;
        completed++;
        emitResult({ index: entry.originalIndex, value, status: 'fulfilled' });
      } catch (error) {
        failed++;
        errors.push({ index: entry.originalIndex, error });
        emitResult({ index: entry.originalIndex, error, status: 'rejected' });

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

  // Clean up abort listener
  if (signal && abortHandler) {
    signal.removeEventListener('abort', abortHandler);
  }

  return { results, errors, aborted };
}

interface NormalizedTask<T> {
  task: () => Promise<T>;
  priority: number;
  originalIndex: number;
}

function normalizeTasks<T>(
  tasks: (() => Promise<T>)[] | PrioritizedTask<T>[],
): NormalizedTask<T>[] {
  const normalized: NormalizedTask<T>[] = tasks.map((t, i) => {
    if (typeof t === 'function') {
      return { task: t, priority: 0, originalIndex: i };
    }
    return { task: t.task, priority: t.priority ?? 0, originalIndex: i };
  });

  // Sort by priority descending (higher priority runs first)
  // Use stable sort to preserve insertion order for equal priorities
  normalized.sort((a, b) => b.priority - a.priority);

  return normalized;
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
