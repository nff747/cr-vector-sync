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
});
