
import { CRDTLog } from './crdt.js';
import { OPFSSync } from './opfs.js';
import { WebGPUCompute } from './webgpu_compute.js';

export interface VectorDBConfig {
  name: string;
  dim: number;
}

export class LocalVectorDB {
  crdt = new CRDTLog();
  opfs = new OPFSSync();
  compute = new WebGPUCompute();
  dim: number;

  constructor(config: VectorDBConfig) {
    this.dim = config.dim;
  }

  async init() {
    await this.opfs.init();
    await this.compute.init();
    
    // In a real app, we'd read the CRDT log from OPFS/IndexedDB here.
  }

  async insert(id: string, vector: number[], metadata: Record<string, any> = {}) {
    if (vector.length !== this.dim) throw new Error("Vector dimension mismatch");
    this.crdt.append({ id, vector, metadata });
    await this.flush();
  }

  async flush() {
    const state = this.crdt.getState();
    const buffer = new Float32Array(state.length * this.dim);
    for (let i = 0; i < state.length; i++) {
      buffer.set(state[i].vector, i * this.dim);
    }
    await this.opfs.writeVectors(buffer);
  }

  async search(queryVector: number[], topK: number = 5) {
    if (queryVector.length !== this.dim) throw new Error("Vector dimension mismatch");
    
    const state = this.crdt.getState();
    if (state.length === 0) return [];

    let buffer = await this.opfs.readVectors();
    if (!buffer) {
      // Fallback
      buffer = new Float32Array(state.length * this.dim);
      for (let i = 0; i < state.length; i++) {
        buffer.set(state[i].vector, i * this.dim);
      }
    }

    const scores = await this.compute.search(new Float32Array(queryVector), buffer, this.dim, state.length);
    
    const results = state.map((item, i) => ({
      id: item.id,
      metadata: item.metadata,
      score: scores[i]
    }));

    results.sort((a, b) => b.score - a.score);
    return results.slice(0, topK);
  }
}
