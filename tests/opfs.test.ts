import { describe, it, expect } from 'vitest';
import { OPFSSync } from '../src/opfs.js';

describe('OPFSSync', () => {
  it('correctly reports availability in headless node environments', () => {
    const opfs = new OPFSSync();
    expect(opfs.isAvailable()).toBe(false);
  });

  it('initializes gracefully in headless node environments without crashing', async () => {
    const opfs = new OPFSSync();
    const initialized = await opfs.init();
    expect(initialized).toBe(false);
    expect(opfs.fileHandle).toBeNull();
    const read = await opfs.readVectors();
    expect(read).toBeNull();
  });

  it('returns zero size and false writes when uninitialized', async () => {
    const opfs = new OPFSSync();
    const size = await opfs.getSize();
    expect(size).toBe(0);

    const writeOk = await opfs.writeVectors(new Float32Array([1, 2, 3]));
    expect(writeOk).toBe(false);

    const atomicOk = await opfs.writeVectorsAtomic(new Float32Array([1, 2, 3]));
    expect(atomicOk).toBe(false);
  });
});
