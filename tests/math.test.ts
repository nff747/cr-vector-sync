import { describe, it, expect } from 'vitest';
import { euclideanDistance, dotProduct, normalizeL2 } from '../src/math.js';

describe('Vector Math Utilities', () => {
  it('computes euclidean distance accurately', () => {
    expect(euclideanDistance([0, 0], [3, 4])).toBe(5);
  });

  it('computes dot product accurately', () => {
    expect(dotProduct([1, 2, 3], [4, 5, 6])).toBe(32);
  });

  it('normalizes vector to unit length', () => {
    const norm = normalizeL2(new Float32Array([3, 4]));
    expect(norm[0]).toBeCloseTo(0.6);
    expect(norm[1]).toBeCloseTo(0.8);
  });
});
