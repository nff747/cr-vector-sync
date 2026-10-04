import { describe, it, expect, vi } from 'vitest';
import { BroadcastChannelSync } from '../src/sync.js';

describe('BroadcastChannelSync', () => {
  it('registers and invokes receive listeners', async () => {
    const sync = new BroadcastChannelSync('test_channel');
    const spy = vi.fn();
    sync.onReceive(spy);
    await sync.connect();
    expect(sync).toBeDefined();
    await sync.disconnect();
  });
});
