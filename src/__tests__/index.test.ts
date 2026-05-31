import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

const mod = await import('../../dist/index.js');

describe('promise-pool', () => {
  it('should export promisePool', () => {
    assert.ok(mod.promisePool);
  });

  it('should export createPool', () => {
    assert.ok(mod.createPool);
  });

  it('invokes onError for each failed task with the correct PoolError shape', async () => {
    const received: Array<{ index: number; error: unknown }> = [];

    const tasks = [
      () => Promise.resolve('ok-0'),
      () => Promise.reject(new Error('boom-1')),
      () => Promise.resolve('ok-2'),
      () => Promise.reject(new Error('boom-3')),
    ];

    const { results, errors } = await mod.promisePool(tasks, {
      concurrency: 2,
      onError: (poolError: { index: number; error: unknown }) => {
        received.push(poolError);
      },
    });

    assert.equal(received.length, 2);

    const byIndex = new Map(received.map((e) => [e.index, e.error]));
    assert.ok(byIndex.has(1));
    assert.ok(byIndex.has(3));
    assert.equal((byIndex.get(1) as Error).message, 'boom-1');
    assert.equal((byIndex.get(3) as Error).message, 'boom-3');

    assert.equal(errors.length, 2);
    assert.equal(results[0], 'ok-0');
    assert.equal(results[2], 'ok-2');
    assert.equal(results[1], undefined);
    assert.equal(results[3], undefined);
  });

  it('does not crash the pool when onError throws', async () => {
    const tasks = [
      () => Promise.resolve('a'),
      () => Promise.reject(new Error('fail')),
      () => Promise.resolve('c'),
      () => Promise.resolve('d'),
    ];

    const { results, errors } = await mod.promisePool(tasks, {
      concurrency: 2,
      onError: () => {
        throw new Error('handler exploded');
      },
    });

    assert.equal(results[0], 'a');
    assert.equal(results[2], 'c');
    assert.equal(results[3], 'd');
    assert.equal(results[1], undefined);
    assert.equal(errors.length, 1);
    assert.equal(errors[0].index, 1);
  });
});
