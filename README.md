# @philiprehberger/promise-pool

[![CI](https://github.com/philiprehberger/promise-pool/actions/workflows/ci.yml/badge.svg)](https://github.com/philiprehberger/promise-pool/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/@philiprehberger/promise-pool.svg)](https://www.npmjs.com/package/@philiprehberger/promise-pool)
[![Last updated](https://img.shields.io/github/last-commit/philiprehberger/promise-pool)](https://github.com/philiprehberger/promise-pool/commits/main)

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

### `PoolOptions`

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `concurrency` | `number` | `5` | Max concurrent tasks |
| `stopOnError` | `boolean` | `false` | Stop scheduling after first error |
| `onProgress` | `(progress) => void` | — | Progress callback |

### `PoolResult<T>`

| Property | Type | Description |
|----------|------|-------------|
| `results` | `(T \| undefined)[]` | Results in original order (`undefined` for failed tasks) |
| `errors` | `PoolError[]` | Array of `{ index, error }` for failed tasks |

## Development

```bash
npm install
npm run build
npm test
```

## Support

If you find this project useful:

⭐ [Star the repo](https://github.com/philiprehberger/promise-pool)

🐛 [Report issues](https://github.com/philiprehberger/promise-pool/issues?q=is%3Aissue+is%3Aopen+label%3Abug)

💡 [Suggest features](https://github.com/philiprehberger/promise-pool/issues?q=is%3Aissue+is%3Aopen+label%3Aenhancement)

❤️ [Sponsor development](https://github.com/sponsors/philiprehberger)

🌐 [All Open Source Projects](https://philiprehberger.com/open-source-packages)

💻 [GitHub Profile](https://github.com/philiprehberger)

🔗 [LinkedIn Profile](https://www.linkedin.com/in/philiprehberger)

## License

[MIT](LICENSE)
