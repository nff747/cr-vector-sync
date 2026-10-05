
import { expect, test, describe } from 'vitest';
import { LocalVectorDB } from '../src/db.js';

describe('LocalVectorDB', () => {
  test('insert and basic CPU fallback search', async () => {
    const db = new LocalVectorDB({ name: 'test', dim: 2 });
    await db.init();
    
    await db.insert('doc1', [1, 0], { name: 'A' });
    await db.insert('doc2', [0, 1], { name: 'B' });
    await db.insert('doc3', [0.707, 0.707], { name: 'C' }); // 45 degrees

    const results = await db.search([1, 0], 2);
    expect(results.length).toBe(2);
    expect(results[0].id).toBe('doc1'); // Cosine sim 1
    expect(results[1].id).toBe('doc3'); // Cosine sim ~0.707
  });
});
