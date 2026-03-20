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
});
