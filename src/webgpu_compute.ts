const shaderCode = `
@group(0) @binding(0) var<storage, read> dataset: array<f32>;
@group(0) @binding(1) var<storage, read> query: array<f32>;
@group(0) @binding(2) var<storage, read_write> scores: array<f32>;

struct Params {
  dim: u32,
  num_vectors: u32,
  metric: u32, // 0 = Cosine, 1 = Euclidean, 2 = DotProduct
}
@group(0) @binding(3) var<uniform> params: Params;

@compute @workgroup_size(64)
fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
  let idx = global_id.x;
  if (idx >= params.num_vectors) {
    return;
  }

  let offset = idx * params.dim;
  var dot_product: f32 = 0.0;
  var norm_dataset: f32 = 0.0;
  var norm_query: f32 = 0.0;
  var dist_sq: f32 = 0.0;

  for (var i: u32 = 0u; i < params.dim; i = i + 1u) {
    let a = dataset[offset + i];
    let b = query[i];
    let diff = a - b;
    dist_sq = dist_sq + diff * diff;
    dot_product = dot_product + a * b;
    norm_dataset = norm_dataset + a * a;
    norm_query = norm_query + b * b;
  }

  if (params.metric == 0u) {
    // Cosine Similarity
    var sim: f32 = 0.0;
    if (norm_dataset > 0.0 && norm_query > 0.0) {
      sim = dot_product / (sqrt(norm_dataset) * sqrt(norm_query));
    }
    scores[idx] = sim;
  } else if (params.metric == 1u) {
    // Negative Euclidean Distance (higher is closer)
    scores[idx] = -sqrt(dist_sq);
  } else {
    // Pure Dot Product
    scores[idx] = dot_product;
  }
}
`;

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

  async search(
    query: Float32Array,
    dataset: Float32Array,
    dim: number,
    numVectors: number,
    metric: 'cosine' | 'euclidean' | 'dot_product' = 'cosine'
  ): Promise<Float32Array> {
    if (!this.device || !this.pipeline) {
      return this.cpuSearch(query, dataset, dim, numVectors, metric);
    }

    const metricId = metric === 'cosine' ? 0 : metric === 'euclidean' ? 1 : 2;

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
      size: 16,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    this.device.queue.writeBuffer(paramsBuffer, 0, new Uint32Array([dim, numVectors, metricId, 0]));

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

  cpuSearch(
    query: Float32Array,
    dataset: Float32Array,
    dim: number,
    numVectors: number,
    metric: 'cosine' | 'euclidean' | 'dot_product' = 'cosine'
  ): Float32Array {
    const scores = new Float32Array(numVectors);
    for (let i = 0; i < numVectors; i++) {
      let dot = 0;
      let normA = 0;
      let normB = 0;
      let distSq = 0;

      for (let j = 0; j < dim; j++) {
        const a = dataset[i * dim + j];
        const b = query[j];
        const diff = a - b;
        distSq += diff * diff;
        dot += a * b;
        normA += a * a;
        normB += b * b;
      }

      if (metric === 'cosine') {
        scores[i] = (normA > 0 && normB > 0) ? dot / (Math.sqrt(normA) * Math.sqrt(normB)) : 0;
      } else if (metric === 'euclidean') {
        scores[i] = -Math.sqrt(distSq);
      } else {
        scores[i] = dot;
      }
    }
    return scores;
  }
}
