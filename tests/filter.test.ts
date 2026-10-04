import { describe, it, expect } from 'vitest';
import { matchesFilter } from '../src/filter.js';

describe('Metadata Filter Engine', () => {
  it('filters by exact match', () => {
    expect(matchesFilter({ category: 'tech' }, { category: 'tech' })).toBe(true);
    expect(matchesFilter({ category: 'books' }, { category: 'tech' })).toBe(false);
  });

  it('filters by numeric range operators', () => {
    expect(matchesFilter({ price: 100 }, { price: { $gt: 50, $lte: 100 } })).toBe(true);
    expect(matchesFilter({ price: 101 }, { price: { $lte: 100 } })).toBe(false);
  });

  it('filters with $in operator', () => {
    expect(matchesFilter({ tag: 'ai' }, { tag: { $in: ['ai', 'webgpu'] } })).toBe(true);
    expect(matchesFilter({ tag: 'crypto' }, { tag: { $in: ['ai', 'webgpu'] } })).toBe(false);
  });
});
