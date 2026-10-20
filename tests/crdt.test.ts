import { expect, test, describe } from 'vitest';
import { CRDTLog, compareVectorClocks, mergeVectorClocks } from '../src/crdt.js';

describe('CRDTLog', () => {
  test('merges deterministically', () => {
    const peer1 = new CRDTLog();
    peer1.localId = 'peerA';
    const peer2 = new CRDTLog();
    peer2.localId = 'peerB';

    peer1.append({ id: 'v1', vector: [1,2,3], metadata: {} });
    peer2.append({ id: 'v2', vector: [4,5,6], metadata: {} });

    peer1.merge(peer2.log);
    peer2.merge(peer1.log);

    expect(peer1.getState().length).toBe(2);
    expect(peer2.getState().length).toBe(2);
    expect(peer1.getState()[0].id).toBe(peer2.getState()[0].id);
  });

  test('handles tombstone deletion across peers', () => {
    const peer1 = new CRDTLog();
    peer1.localId = 'peerA';
    const peer2 = new CRDTLog();
    peer2.localId = 'peerB';

    peer1.append({ id: 'v1', vector: [1,2,3], metadata: {} });
    peer2.merge(peer1.log);
    expect(peer2.getState().length).toBe(1);

    peer1.delete('v1');
    peer2.merge(peer1.log);
    expect(peer2.getState().length).toBe(0);
  });

  test('tracks and aggregates vector clocks accurately', () => {
    const peer = new CRDTLog();
    peer.localId = 'node-1';
    peer.append({ id: 'v1', vector: [1], metadata: {} });
    peer.append({ id: 'v2', vector: [2], metadata: {} });

    const clock = peer.getVectorClock();
    expect(clock['node-1']).toBe(2);
  });
});

describe('Vector Clock ordering and merging', () => {
  test('identifies identical clocks as EQUALS', () => {
    const a = { node1: 2, node2: 4 };
    const b = { node1: 2, node2: 4 };
    expect(compareVectorClocks(a, b)).toBe('EQUALS');
  });

  test('identifies causal precedence as HAPPENS_BEFORE and HAPPENS_AFTER', () => {
    const past = { node1: 1, node2: 3 };
    const future = { node1: 2, node2: 3 };
    expect(compareVectorClocks(past, future)).toBe('HAPPENS_BEFORE');
    expect(compareVectorClocks(future, past)).toBe('HAPPENS_AFTER');
  });

  test('detects concurrent branches correctly', () => {
    const branchA = { node1: 2, node2: 1 };
    const branchB = { node1: 1, node2: 2 };
    expect(compareVectorClocks(branchA, branchB)).toBe('CONCURRENT');
  });

  test('merges vector clocks by pairwise maximum', () => {
    const a = { node1: 5, node2: 2 };
    const b = { node2: 8, node3: 4 };
    const merged = mergeVectorClocks(a, b);
    expect(merged).toEqual({
      node1: 5,
      node2: 8,
      node3: 4
    });
  });
});

describe('CRDTLog Log Compaction', () => {
  test('purges intermediate mutations and retains only latest operation per id', () => {
    const peer = new CRDTLog();
    peer.append({ id: 'doc-1', vector: [1], metadata: { v: 1 } });
    peer.append({ id: 'doc-1', vector: [2], metadata: { v: 2 } });
    peer.append({ id: 'doc-1', vector: [3], metadata: { v: 3 } });
    peer.append({ id: 'doc-2', vector: [10], metadata: { v: 1 } });

    expect(peer.log.length).toBe(4);
    const result = peer.compact();
    expect(result.purged).toBe(2);
    expect(result.retained).toBe(2);
    expect(peer.log.length).toBe(2);

    const state = peer.getState();
    expect(state.find(o => o.id === 'doc-1')?.metadata.v).toBe(3);
  });

  test('garbage collects expired tombstones when maxAgeMs is exceeded', () => {
    const peer = new CRDTLog();
    peer.append({ id: 'doc-1', vector: [1], metadata: {} });
    const tombstone = peer.delete('doc-1');
    tombstone.timestamp = Date.now() - 50000; // 50s ago

    const result = peer.compact(10000); // maxAge 10s
    expect(result.purged).toBe(2); // original op + tombstone
    expect(result.retained).toBe(0);
    expect(peer.log.length).toBe(0);
  });
});
