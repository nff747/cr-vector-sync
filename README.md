# cr-vector-sync ⚡

Local-first, WebGPU-accelerated Vector Database with Conflict-free Replicated Data Type (CRDT) peer-to-peer synchronization.

[![License](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](LICENSE)
[![Vitest](https://img.shields.io/badge/tested%20with-vitest-green.svg)](https://vitest.dev/)

## Features
- **WebGPU Compute Engine**: Hardware-accelerated cosine, euclidean, and dot product calculations in WGSL.
- **Local-First Persistence**: Direct streaming to the Origin Private File System (OPFS).
- **Multi-Peer Sync**: Lamport-clock sequenced CRDT operation log with tombstone deletion support.
- **Hierarchical Navigable Small World (HNSW)**: O(log N) scalable graph indexing.
- **Metadata Filtering**: Rich MongoDB-style `$gt`, `$lt`, `$in` query filtering.
- **Scalar Quantization**: 4x memory compaction with Int8 scalar quantization.

## Quick Start
```bash
npm install cr-vector-sync
```

```typescript
import { LocalVectorDB } from 'cr-vector-sync';

const db = new LocalVectorDB({ name: 'ai-memory', dim: 128 });
await db.init();

await db.insert('doc-1', myEmbedding, { category: 'notes' });
const results = await db.search(queryEmbedding, 5, { filter: { category: 'notes' } });
```

## License
Apache License 2.0 - see [LICENSE](LICENSE) for details.
