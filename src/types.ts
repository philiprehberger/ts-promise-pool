export interface PoolOptions {
  concurrency?: number;
  stopOnError?: boolean;
  onProgress?: (progress: PoolProgress) => void;
  signal?: AbortSignal;
  taskTimeout?: number;
  onResult?: (result: TaskResult<unknown>) => void;
}

export interface PoolProgress {
  completed: number;
  failed: number;
  total: number;
  percent: number;
}

export interface PoolResult<T> {
  results: (T | undefined)[];
  errors: PoolError[];
  aborted: boolean;
}

export interface PoolError {
  index: number;
  error: unknown;
}

export interface PrioritizedTask<T> {
  task: () => Promise<T>;
  priority?: number;
}

export interface TaskResult<T> {
  index: number;
  value?: T;
  error?: unknown;
  status: 'fulfilled' | 'rejected';
}

export class TimeoutError extends Error {
  readonly index: number;
  readonly timeout: number;

  constructor(index: number, timeout: number) {
    super(`Task at index ${index} timed out after ${timeout}ms`);
    this.name = 'TimeoutError';
    this.index = index;
    this.timeout = timeout;
  }
}
