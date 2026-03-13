export interface PoolOptions {
  concurrency?: number;
  stopOnError?: boolean;
  onProgress?: (progress: PoolProgress) => void;
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
}

export interface PoolError {
  index: number;
  error: unknown;
}
