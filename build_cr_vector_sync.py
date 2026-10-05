import os
import subprocess

def write_file(path, content):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w") as f:
        f.write(content)

src_index = """export * from './db.js';
export * from './crdt.js';
export * from './opfs.js';
export * from './webgpu_compute.js';
"""

src_crdt = """
export type Operation = {
  id: string;
  vector: number[];
  metadata: Record<string, any>;
  timestamp: number;
  author: string;
};

export class CRDTLog {
  log: Operation[] = [];
  localId: string = crypto.randomUUID();

  append(op: Omit<Operation, 'timestamp' | 'author'>) {
    const fullOp = {
      ...op,
      timestamp: Date.now(),
      author: this.localId
    };
    this.log.push(fullOp);
    return fullOp;
  }

  merge(remoteLog: Operation[]) {
    const seen = new Set(this.log.map(o => `${o.id}-${o.author}-${o.timestamp}`));
    for (const op of remoteLog) {
      if (!seen.has(`${op.id}-${op.author}-${op.timestamp}`)) {
        this.log.push(op);
      }
    }
    // Sort by timestamp then author to guarantee deterministic state
    this.log.sort((a, b) => {
      if (a.timestamp === b.timestamp) {
        return a.author.localeCompare(b.author);
      }
      return a.timestamp - b.timestamp;
    });
  }

  getState() {
    // Return latest state per ID
    const state = new Map<string, Operation>();
    for (const op of this.log) {
      state.set(op.id, op);
    }
    return Array.from(state.values());
  }
}
"""

src_opfs = """
export class OPFSSync {
  directory: FileSystemDirectoryHandle | null = null;
  fileHandle: FileSystemFileHandle | null = null;

  async init() {
    if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.getDirectory) {
      this.directory = await navigator.storage.getDirectory();
      this.fileHandle = await this.directory.getFileHandle('cr_vector_store.dat', { create: true });
    }
  }

  async writeVectors(vectors: Float32Array) {
    if (!this.fileHandle) return; // Fallback for environments without OPFS
    const writable = await this.fileHandle.createWritable();
    await writable.write(vectors);
    await writable.close();
  }

  async readVectors(): Promise<Float32Array | null> {
    if (!this.fileHandle) return null;
    const file = await this.fileHandle.getFile();
    const arrayBuffer = await file.arrayBuffer();
    return new Float32Array(arrayBuffer);
  }
}
"""

src_shader = """
@group(0) @binding(0) var<storage, read> dataset: array<f32>;
@group(0) @binding(1) var<storage, read> query: array<f32>;
@group(0) @binding(2) var<storage, read_write> scores: array<f32>;

struct Params {
  dim: u32,
  num_vectors: u32,
}
@group(0) @binding(3) var<uniform> params: Params;

@compute @workgroup_size(64)
fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
  let idx = global_id.x;
  if (idx >= params.num_vectors) {
    return;
  }

  var dot_product: f32 = 0.0;
  var norm_dataset: f32 = 0.0;
  var norm_query: f32 = 0.0;

  let offset = idx * params.dim;

  for (var i: u32 = 0u; i < params.dim; i = i + 1u) {
    let a = dataset[offset + i];
    let b = query[i];
    dot_product = dot_product + a * b;
    norm_dataset = norm_dataset + a * a;
    norm_query = norm_query + b * b;
  }

  // Cosine similarity
  var sim = 0.0;
  if (norm_dataset > 0.0 && norm_query > 0.0) {
    sim = dot_product / (sqrt(norm_dataset) * sqrt(norm_query));
  }
  
  scores[idx] = sim;
}
"""

src_webgpu = """
import shaderCode from './shader.wgsl';

export class WebGPUCompute {
  device: GPUDevice | null = null;
  pipeline: GPUComputePipeline | null = null;

  async init() {
    if (typeof navigator === 'undefined' || !navigator.gpu) return;
    const adapter = await navigator.gpu.requestAdapter();
    if (!adapter) return;
    this.device = await adapter.requestDevice();

    const module = this.device.createShaderModule({ code: shaderCode });
    this.pipeline = this.device.createComputePipeline({
      layout: 'auto',
      compute: { module, entryPoint: 'main' }
    });
  }

  async search(query: Float32Array, dataset: Float32Array, dim: number, numVectors: number): Promise<Float32Array> {
    if (!this.device || !this.pipeline) {
      // CPU Fallback
      return this.cpuSearch(query, dataset, dim, numVectors);
    }

    const datasetBuffer = this.device.createBuffer({
      size: dataset.byteLength,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    });
    this.device.queue.writeBuffer(datasetBuffer, 0, dataset);

    const queryBuffer = this.device.createBuffer({
      size: query.byteLength,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    });
    this.device.queue.writeBuffer(queryBuffer, 0, query);

    const scoresBuffer = this.device.createBuffer({
      size: numVectors * 4,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC,
    });

    const paramsBuffer = this.device.createBuffer({
      size: 8,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    this.device.queue.writeBuffer(paramsBuffer, 0, new Uint32Array([dim, numVectors]));

    const bindGroup = this.device.createBindGroup({
      layout: this.pipeline.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: { buffer: datasetBuffer } },
        { binding: 1, resource: { buffer: queryBuffer } },
        { binding: 2, resource: { buffer: scoresBuffer } },
        { binding: 3, resource: { buffer: paramsBuffer } },
      ]
    });

    const encoder = this.device.createCommandEncoder();
    const pass = encoder.beginComputePass();
    pass.setPipeline(this.pipeline);
    pass.setBindGroup(0, bindGroup);
    pass.dispatchWorkgroups(Math.ceil(numVectors / 64));
    pass.end();

    const readBuffer = this.device.createBuffer({
      size: numVectors * 4,
      usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST,
    });
    encoder.copyBufferToBuffer(scoresBuffer, 0, readBuffer, 0, numVectors * 4);
    
    this.device.queue.submit([encoder.finish()]);

    await readBuffer.mapAsync(GPUMapMode.READ);
    const result = new Float32Array(readBuffer.getMappedRange());
    const out = new Float32Array(result);
    readBuffer.unmap();
    return out;
  }

  cpuSearch(query: Float32Array, dataset: Float32Array, dim: number, numVectors: number): Float32Array {
    const scores = new Float32Array(numVectors);
    for (let i = 0; i < numVectors; i++) {
      let dot = 0;
      let normA = 0;
      let normB = 0;
      for (let j = 0; j < dim; j++) {
        const a = dataset[i * dim + j];
        const b = query[j];
        dot += a * b;
        normA += a * a;
        normB += b * b;
      }
      scores[i] = (normA > 0 && normB > 0) ? dot / (Math.sqrt(normA) * Math.sqrt(normB)) : 0;
    }
    return scores;
  }
}
"""

src_db = """
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
"""

test_db = """
import { expect, test, describe } from 'vitest';
import { LocalVectorDB } from '../src/db.js';

describe('LocalVectorDB', () => {
  test('insert and basic CPU fallback search', async () => {
    const db = new LocalVectorDB({ name: 'test', dim: 2 });
    await db.init();
    
    await db.insert('doc1', [1, 0], { name: 'A' });
    await db.insert('doc2', [0, 1], { name: 'B' });
    await db.insert('doc3', [0.707, 0.707], { name: 'C' }); // 45 degrees

    const results = await db.search([1, 0], 2);
    expect(results.length).toBe(2);
    expect(results[0].id).toBe('doc1'); // Cosine sim 1
    expect(results[1].id).toBe('doc3'); // Cosine sim ~0.707
  });
});
"""

test_crdt = """
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
});
"""

files = {
    "src/index.ts": src_index,
    "src/crdt.ts": src_crdt,
    "src/opfs.ts": src_opfs,
    "src/shader.wgsl": src_shader,
    "src/webgpu_compute.ts": src_webgpu,
    "src/db.ts": src_db,
    "tests/db.test.ts": test_db,
    "tests/crdt.test.ts": test_crdt
}

for path, content in files.items():
    write_file(path, content)

subprocess.run(["git", "add", "."])
subprocess.run(["git", "commit", "-m", "feat: implement CRDT vector log, OPFS storage, and WebGPU compute backend"])
