import { describe, it, expect } from 'vitest';
import { OPFSSync } from '../src/opfs.js';

describe('OPFSSync', () => {
  it('initializes gracefully in headless node environments', async () => {
    const opfs = new OPFSSync();
    await opfs.init();
    expect(opfs.fileHandle).toBeNull();
    const read = await opfs.readVectors();
    expect(read).toBeNull();
  });
});
