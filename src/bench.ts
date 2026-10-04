import { LocalVectorDB } from './db.js';

export async function runBenchmark(numVectors: number = 1000, dim: number = 64) {
  const db = new LocalVectorDB({ name: 'bench', dim });
  await db.init();

  const dataset = [];
  for (let i = 0; i < numVectors; i++) {
    const vector = Array.from({ length: dim }, () => Math.random() - 0.5);
    dataset.push({ id: `item_${i}`, vector });
  }

  const startInsert = performance.now();
  await db.insertBatch(dataset);
  const insertDuration = performance.now() - startInsert;

  const query = Array.from({ length: dim }, () => Math.random() - 0.5);
  const startSearch = performance.now();
  const results = await db.search(query, 10);
  const searchDuration = performance.now() - startSearch;

  return {
    numVectors,
    dim,
    insertDurationMs: insertDuration,
    searchDurationMs: searchDuration,
    resultsCount: results.length
  };
}
