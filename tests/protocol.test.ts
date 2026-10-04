import { describe, it, expect } from 'vitest';
import { BinaryProtocol } from '../src/protocol.js';
import { Operation } from '../src/crdt.js';

describe('BinaryProtocol', () => {
  it('encodes and decodes operations without loss', () => {
    const ops: Operation[] = [
      { id: '1', vector: [0.1, 0.2], metadata: { title: 'test' }, timestamp: 1000, clock: 1, author: 'peer1' }
    ];
    const encoded = BinaryProtocol.encode(ops);
    const decoded = BinaryProtocol.decode(encoded);
    expect(decoded).toEqual(ops);
  });
});
