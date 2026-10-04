import { describe, it, expect } from 'vitest';
import { HNSWGraph } from '../src/hnsw.js';

describe('HNSWGraph', () => {
  it('inserts nodes and retrieves nearest neighbors', async () => {
    const graph = new HNSWGraph(8, 32);
    await graph.insert('doc1', [1, 0, 0]);
    await graph.insert('doc2', [0, 1, 0]);
    await graph.insert('doc3', [0.9, 0.1, 0]);

    const res = await graph.search([1, 0, 0], 2);
    expect(res.length).toBe(2);
    expect(res[0].id).toBe('doc1');
    expect(res[1].id).toBe('doc3');
  });
});
