# @philiprehberger/promise-pool

[![CI](https://github.com/philiprehberger/ts-promise-pool/actions/workflows/ci.yml/badge.svg)](https://github.com/philiprehberger/ts-promise-pool/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/@philiprehberger/promise-pool.svg)](https://www.npmjs.com/package/@philiprehberger/promise-pool)
[![Last updated](https://img.shields.io/github/last-commit/philiprehberger/ts-promise-pool)](https://github.com/philiprehberger/ts-promise-pool/commits/main)

Concurrent promise execution with configurable pool size

## Installation

```bash
npm install @philiprehberger/promise-pool
```

## Usage

### Batch Execution

```ts
import { promisePool } from '@philiprehberger/promise-pool';

const tasks = urls.map(url => () => fetch(url).then(r => r.json()));

const { results, errors } = await promisePool(tasks, {
  concurrency: 5,
  onProgress: ({ completed, total, percent }) => {
    console.log(`${percent}% done (${completed}/${total})`);
  },
});
```

### Stop on Error

```ts
const { results, errors } = await promisePool(tasks, {
  concurrency: 3,
  stopOnError: true, // Stop scheduling new tasks after first failure
});
```

### AbortSignal Support

Cancel remaining tasks using an `AbortSignal`:

```ts
const controller = new AbortController();

const { results, errors, aborted } = await promisePool(tasks, {
  concurrency: 5,
  signal: controller.signal,
});

// Cancel from elsewhere:
controller.abort();

if (aborted) {
  console.log('Pool was cancelled before all tasks completed');
}
```

### Per-Task Timeout

Set a timeout (in milliseconds) for individual tasks. Tasks that exceed the timeout throw a `TimeoutError`:

```ts
import { promisePool, TimeoutError } from '@philiprehberger/promise-pool';

const { results, errors } = await promisePool(tasks, {
  concurrency: 5,
  taskTimeout: 3000, // 3 seconds per task
});

for (const { index, error } of errors) {
  if (error instanceof TimeoutError) {
    console.log(`Task ${index} timed out after ${error.timeout}ms`);
  }
}
```

### Streaming Results

Process results as each task completes using the `onResult` callback, instead of waiting for all tasks to finish:

```ts
await promisePool(tasks, {
  concurrency: 5,
  onResult: ({ index, value, error, status }) => {
    if (status === 'fulfilled') {
      console.log(`Task ${index} completed:`, value);
    } else {
      console.log(`Task ${index} failed:`, error);
    }
  },
});
```

### Task Prioritization

Assign numeric priorities to tasks. Higher priority tasks are processed first:

```ts
import { promisePool } from '@philiprehberger/promise-pool';
import type { PrioritizedTask } from '@philiprehberger/promise-pool';

const tasks: PrioritizedTask<string>[] = [
  { task: () => fetch('/low').then(r => r.text()), priority: 1 },
  { task: () => fetch('/critical').then(r => r.text()), priority: 10 },
  { task: () => fetch('/medium').then(r => r.text()), priority: 5 },
];

const { results } = await promisePool(tasks, { concurrency: 2 });
// '/critical' runs first, then '/medium', then '/low'
```

### Reusable Pool

```ts
import { createPool } from '@philiprehberger/promise-pool';

const pool = createPool({ concurrency: 3 });

// Tasks are queued and run with at most 3 concurrent
const result1 = pool.run(() => fetch('/api/1'));
const result2 = pool.run(() => fetch('/api/2'));
const result3 = pool.run(() => fetch('/api/3'));
const result4 = pool.run(() => fetch('/api/4')); // waits for a slot
```

## API

| Export | Description |
|--------|-------------|
| `promisePool(tasks, options?)` | Execute tasks with concurrency limit, returns `PoolResult` |
| `createPool(options?)` | Create a reusable pool with `run()` method |
| `TimeoutError` | Error class thrown when a task exceeds its timeout |

### `PoolOptions`

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `concurrency` | `number` | `5` | Max concurrent tasks |
| `stopOnError` | `boolean` | `false` | Stop scheduling after first error |
| `onProgress` | `(progress) => void` | — | Progress callback |
| `signal` | `AbortSignal` | — | Signal to cancel remaining tasks |
| `taskTimeout` | `number` | — | Per-task timeout in milliseconds |
| `onResult` | `(result: TaskResult) => void` | — | Callback invoked as each task completes |

### `PoolResult<T>`

| Property | Type | Description |
|----------|------|-------------|
| `results` | `(T \| undefined)[]` | Results in original order (`undefined` for failed tasks) |
| `errors` | `PoolError[]` | Array of `{ index, error }` for failed tasks |
| `aborted` | `boolean` | Whether the pool was cancelled via AbortSignal |

### `PrioritizedTask<T>`

| Property | Type | Description |
|----------|------|-------------|
| `task` | `() => Promise<T>` | The async task function |
| `priority` | `number` | Priority level (higher runs first, default `0`) |

### `TaskResult<T>`

| Property | Type | Description |
|----------|------|-------------|
| `index` | `number` | Original index of the task |
| `value` | `T \| undefined` | Resolved value (when fulfilled) |
| `error` | `unknown` | Error (when rejected) |
| `status` | `'fulfilled' \| 'rejected'` | Whether the task succeeded or failed |

### `TimeoutError`

| Property | Type | Description |
|----------|------|-------------|
| `index` | `number` | Index of the timed-out task |
| `timeout` | `number` | Timeout duration in milliseconds |

## Development

```bash
npm install
npm run build
npm test
```

## Support

If you find this project useful:

⭐ [Star the repo](https://github.com/philiprehberger/ts-promise-pool)

🐛 [Report issues](https://github.com/philiprehberger/ts-promise-pool/issues?q=is%3Aissue+is%3Aopen+label%3Abug)

💡 [Suggest features](https://github.com/philiprehberger/ts-promise-pool/issues?q=is%3Aissue+is%3Aopen+label%3Aenhancement)

❤️ [Sponsor development](https://github.com/sponsors/philiprehberger)

🌐 [All Open Source Projects](https://philiprehberger.com/open-source-packages)

💻 [GitHub Profile](https://github.com/philiprehberger)

🔗 [LinkedIn Profile](https://www.linkedin.com/in/philiprehberger)

## License

[MIT](LICENSE)
