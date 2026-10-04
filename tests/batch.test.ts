import { describe, it, expect } from 'vitest';
import { LocalVectorDB } from '../src/db.js';

describe('Batch Operations', () => {
  it('inserts multiple vectors in a single flush', async () => {
    const db = new LocalVectorDB({ name: 'batch_test', dim: 3 });
    await db.init();

    await db.insertBatch([
      { id: '1', vector: [1, 0, 0] },
      { id: '2', vector: [0, 1, 0] },
      { id: '3', vector: [0, 0, 1] }
    ]);

    const res = await db.search([1, 0, 0], 3);
    expect(res.length).toBe(3);
    expect(res[0].id).toBe('1');
  });
});
