import { describe, it, expect } from 'vitest';
import {
  euclideanDistance,
  dotProduct,
  normalizeL2,
  manhattanDistance,
  chebyshevDistance,
  cosineDistance,
  areVectorsEqual,
} from '../src/math.js';

describe('Vector Math Utilities', () => {
  it('computes euclidean distance accurately', () => {
    expect(euclideanDistance([0, 0], [3, 4])).toBe(5);
  });

  it('throws on dimension mismatch for euclidean distance', () => {
    expect(() => euclideanDistance([0, 0], [1])).toThrow('Dimension mismatch');
  });

  it('computes dot product accurately', () => {
    expect(dotProduct([1, 2, 3], [4, 5, 6])).toBe(32);
  });

  it('throws on dimension mismatch for dot product', () => {
    expect(() => dotProduct([1, 2], [1, 2, 3])).toThrow('Dimension mismatch');
  });

  it('normalizes vector to unit length', () => {
    const norm = normalizeL2(new Float32Array([3, 4]));
    expect(norm[0]).toBeCloseTo(0.6);
    expect(norm[1]).toBeCloseTo(0.8);
  });

  it('handles zero norm in normalizeL2 gracefully', () => {
    const zeroVec = new Float32Array([0, 0, 0]);
    expect(normalizeL2(zeroVec)).toEqual(zeroVec);
  });

  it('computes Manhattan (L1) distance accurately', () => {
    expect(manhattanDistance([1, 2, 3], [4, 0, 3])).toBe(3 + 2 + 0); // 5
  });

  it('computes Chebyshev (L-infinity) distance accurately', () => {
    expect(chebyshevDistance([1, 5, 2], [4, 2, 9])).toBe(7); // max(|1-4|, |5-2|, |2-9|) = 7
  });

  it('computes cosine distance accurately', () => {
    // Parallel vectors: cosine similarity = 1.0 -> distance = 0.0
    expect(cosineDistance([1, 0, 0], [5, 0, 0])).toBeCloseTo(0.0);
    // Orthogonal vectors: cosine similarity = 0.0 -> distance = 1.0
    expect(cosineDistance([1, 0], [0, 1])).toBeCloseTo(1.0);
    // Opposite vectors: cosine similarity = -1.0 -> distance = 2.0
    expect(cosineDistance([1, 0], [-1, 0])).toBeCloseTo(2.0);
  });

  it('evaluates vector equality within tolerance epsilon', () => {
    expect(areVectorsEqual([1.0, 2.0, 3.0], [1.0000001, 2.0000002, 2.9999999])).toBe(true);
    expect(areVectorsEqual([1.0, 2.0], [1.05, 2.0], 1e-4)).toBe(false);
    expect(areVectorsEqual([1.0], [1.0, 2.0])).toBe(false);
  });
});
