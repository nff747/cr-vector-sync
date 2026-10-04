import { describe, it, expect } from 'vitest';
import { runBenchmark } from '../src/bench.js';

describe('Benchmark Harness', () => {
  it('runs vector benchmark without crashing', async () => {
    const stats = await runBenchmark(50, 8);
    expect(stats.resultsCount).toBe(10);
    expect(stats.searchDurationMs).toBeGreaterThan(0);
  });
});
