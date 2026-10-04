import { expect, test, describe } from 'vitest';
import { CRDTLog } from '../src/crdt.js';

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
});
