import { expect, test, describe } from 'vitest';
import { LocalVectorDB } from '../src/db.js';

describe('LocalVectorDB', () => {
  test('insert and basic CPU fallback search', async () => {
    const db = new LocalVectorDB({ name: 'test', dim: 2 });
    await db.init();
    
    await db.insert('doc1', [1, 0], { name: 'A', group: 'alpha' });
    await db.insert('doc2', [0, 1], { name: 'B', group: 'beta' });
    await db.insert('doc3', [0.707, 0.707], { name: 'C', group: 'alpha' });

    const results = await db.search([1, 0], 2);
    expect(results.length).toBe(2);
    expect(results[0].id).toBe('doc1');
    expect(results[1].id).toBe('doc3');
  });

  test('filters results using metadata expressions', async () => {
    const db = new LocalVectorDB({ name: 'test', dim: 2 });
    await db.init();
    
    await db.insert('d1', [1, 0], { category: 'news', priority: 1 });
    await db.insert('d2', [0.9, 0.1], { category: 'ads', priority: 5 });

    const filtered = await db.search([1, 0], 5, { filter: { category: 'news' } });
    expect(filtered.length).toBe(1);
    expect(filtered[0].id).toBe('d1');
  });

  test('scores the current records instead of an unrelated persisted vector file', async () => {
    const db = new LocalVectorDB({ name:'test', dim:2 });
    await db.init();
    await db.insert('east', [1,0]);
    await db.insert('north', [0,1]);
    db.opfs.readVectors = async () => new Float32Array([0,1,1,0]);
    expect((await db.search([1,0], 1))[0].id).toBe('east');
  });

  test('rejects an invalid batch before appending any record', async () => {
    const db = new LocalVectorDB({ name:'test', dim:2 });
    await expect(db.insertBatch([{id:'valid',vector:[1,0]}, {id:'invalid',vector:[1]}])).rejects.toThrow('dimension');
    expect(db.crdt.getState()).toHaveLength(0);
  });
});
