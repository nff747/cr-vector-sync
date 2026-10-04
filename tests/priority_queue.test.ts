import { describe, it, expect } from 'vitest';
import { PriorityQueue } from '../src/priority_queue.js';

describe('PriorityQueue', () => {
  it('orders items in min-heap fashion', () => {
    const pq = new PriorityQueue<string>(false);
    pq.push('high', 10);
    pq.push('low', 1);
    pq.push('medium', 5);

    expect(pq.pop()).toBe('low');
    expect(pq.pop()).toBe('medium');
    expect(pq.pop()).toBe('high');
  });

  it('orders items in max-heap fashion when specified', () => {
    const pq = new PriorityQueue<string>(true);
    pq.push('low', 1);
    pq.push('high', 10);
    expect(pq.pop()).toBe('high');
  });
});
