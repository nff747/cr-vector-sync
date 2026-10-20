import { describe, it, expect } from 'vitest';
import { matchesFilter, deduplicateVectors } from '../src/filter.js';

describe('Metadata Filter Engine', () => {
  it('filters by exact match', () => {
    expect(matchesFilter({ category: 'tech' }, { category: 'tech' })).toBe(true);
    expect(matchesFilter({ category: 'books' }, { category: 'tech' })).toBe(false);
  });

  it('filters by numeric range operators', () => {
    expect(matchesFilter({ price: 100 }, { price: { $gt: 50, $lte: 100 } })).toBe(true);
    expect(matchesFilter({ price: 101 }, { price: { $lte: 100 } })).toBe(false);
  });

  it('filters with $in and $nin operators', () => {
    expect(matchesFilter({ tag: 'ai' }, { tag: { $in: ['ai', 'webgpu'] } })).toBe(true);
    expect(matchesFilter({ tag: 'crypto' }, { tag: { $in: ['ai', 'webgpu'] } })).toBe(false);
    expect(matchesFilter({ tag: 'crypto' }, { tag: { $nin: ['ai', 'webgpu'] } })).toBe(true);
    expect(matchesFilter({ tag: 'ai' }, { tag: { $nin: ['ai', 'webgpu'] } })).toBe(false);
  });

  it('filters with $exists, $contains, and $regex', () => {
    expect(matchesFilter({ author: 'Alice' }, { author: { $exists: true } })).toBe(true);
    expect(matchesFilter({}, { author: { $exists: true } })).toBe(false);
    expect(matchesFilter({ tags: ['wasm', 'gpu'] }, { tags: { $contains: 'gpu' } })).toBe(true);
    expect(matchesFilter({ title: 'Vector Database' }, { title: { $contains: 'Vector' } })).toBe(true);
    expect(matchesFilter({ title: 'Vector Database' }, { title: { $regex: '^Vector.*' } })).toBe(true);
    expect(matchesFilter({ title: 'Graph Database' }, { title: { $regex: '^Vector.*' } })).toBe(false);
  });
});

describe('Vector Deduplication', () => {
  it('filters out near-duplicate embeddings within distance threshold', () => {
    const items = [
      { id: '1', vector: [1.0, 2.0, 3.0] },
      { id: '2', vector: [1.00001, 2.00001, 3.00001] }, // near-duplicate of 1
      { id: '3', vector: [5.0, 5.0, 5.0] }, // distinct
      { id: '4', vector: [5.00002, 5.0, 5.0] }, // near-duplicate of 3
      { id: '5', vector: [10.0, 20.0, 30.0] } // distinct
    ];

    const deduplicated = deduplicateVectors(items, 1e-3);
    expect(deduplicated.map(d => d.id)).toEqual(['1', '3', '5']);
  });

  it('preserves items with empty vectors', () => {
    const items = [
      { id: 'empty-1', vector: [] },
      { id: 'empty-2', vector: [] }
    ];
    expect(deduplicateVectors(items).length).toBe(2);
  });
});
