# cr-vector-sync

Experimental vector-search and replication components. This is **not a production-ready database**. Do not rely on it for durable storage, security-sensitive synchronization, or recovery of important data.

`LocalVectorDB` maintains records in an in-memory operation log and ranks the current vectors using WebGPU where available, with a CPU fallback. Filtering is applied to metadata after scoring. Search uses the current in-memory records; it does not treat the OPFS vector-only file as an authoritative database.

```ts
import { LocalVectorDB } from 'cr-vector-sync';
const db = new LocalVectorDB({ name: 'example', dim: 2 });
await db.init();
await db.insert('example', [1, 0], { category: 'notes' });
const results = await db.search([1, 0], 5);
```

The OPFS helper writes vector data when available, but the format does **not** persist record IDs, metadata or the operation log, and initialization does not restore a database. Failed OPFS writes may be silently reported by the helper. Use another storage system for data you need to retain. Named database instances now use distinct OPFS file names; older files are not automatically migrated.

The operation log resolves ordering deterministically and keeps deletion tombstones during compaction. It does not provide authenticated peers, durable synchronization, complete causal-stability tracking or safe tombstone garbage collection. The `BroadcastChannel` adapter communicates between same-origin contexts; it is not an Internet peer-to-peer transport. HNSW and quantization helpers are separate utilities and are not integrated into `LocalVectorDB.search`. WebGPU and OPFS support must be tested in the intended browser and hardware.

Build and test locally with `npm install`, `npm run build`, and `npm test`. Tests alone do not establish security, durability or cross-device compatibility.

[Apache License 2.0](LICENSE).
