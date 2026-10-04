import { describe, it, expect } from 'vitest';
import { WebGPUCompute } from '../src/webgpu_compute.js';

describe('WebGPUCompute Engine', () => {
  it('computes euclidean distances in CPU fallback mode', async () => {
    const compute = new WebGPUCompute();
    const query = new Float32Array([0, 0]);
    const dataset = new Float32Array([3, 4, 1, 1]);
    const scores = await compute.search(query, dataset, 2, 2, 'euclidean');

    expect(scores[0]).toBeCloseTo(-5.0);
    expect(scores[1]).toBeCloseTo(-Math.SQRT2);
  });

  it('computes dot product in CPU fallback mode', async () => {
    const compute = new WebGPUCompute();
    const query = new Float32Array([1, 2]);
    const dataset = new Float32Array([3, 4, -1, 1]);
    const scores = await compute.search(query, dataset, 2, 2, 'dot_product');

    expect(scores[0]).toBe(11);
    expect(scores[1]).toBe(1);
  });
});
