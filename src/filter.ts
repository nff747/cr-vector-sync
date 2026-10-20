import { euclideanDistance } from './math.js';

export type FilterExpression = Record<string, any>;

export function matchesFilter(metadata: Record<string, any> = {}, filter?: FilterExpression): boolean {
  if (!filter || Object.keys(filter).length === 0) return true;

  for (const [key, expected] of Object.entries(filter)) {
    const actual = metadata[key];
    if (typeof expected === 'object' && expected !== null && !Array.isArray(expected)) {
      if ('$eq' in expected && actual !== expected.$eq) return false;
      if ('$ne' in expected && actual === expected.$ne) return false;
      if ('$gt' in expected && !(actual > expected.$gt)) return false;
      if ('$gte' in expected && !(actual >= expected.$gte)) return false;
      if ('$lt' in expected && !(actual < expected.$lt)) return false;
      if ('$lte' in expected && !(actual <= expected.$lte)) return false;
      if ('$in' in expected && Array.isArray(expected.$in) && !expected.$in.includes(actual)) return false;
      if ('$nin' in expected && Array.isArray(expected.$nin) && expected.$nin.includes(actual)) return false;
      if ('$exists' in expected && (actual !== undefined) !== Boolean(expected.$exists)) return false;
      if ('$contains' in expected) {
        if (typeof actual === 'string' && !actual.includes(String(expected.$contains))) return false;
        if (Array.isArray(actual) && !actual.includes(expected.$contains)) return false;
      }
      if ('$regex' in expected) {
        const re = expected.$regex instanceof RegExp ? expected.$regex : new RegExp(expected.$regex);
        if (typeof actual !== 'string' || !re.test(actual)) return false;
      }
    } else {
      if (actual !== expected) return false;
    }
  }

  return true;
}

/**
 * Filters out near-duplicate items whose vector distance to an accepted item is within threshold.
 */
export function deduplicateVectors<T extends { vector: ArrayLike<number> }>(
  items: T[],
  distanceThreshold: number = 1e-4,
  distanceFn: (a: ArrayLike<number>, b: ArrayLike<number>) => number = euclideanDistance
): T[] {
  const result: T[] = [];
  for (const item of items) {
    if (!item.vector || item.vector.length === 0) {
      result.push(item);
      continue;
    }
    let isDuplicate = false;
    for (const accepted of result) {
      if (!accepted.vector || accepted.vector.length === 0) continue;
      if (accepted.vector.length === item.vector.length) {
        const dist = distanceFn(item.vector, accepted.vector);
        if (dist <= distanceThreshold) {
          isDuplicate = true;
          break;
        }
      }
    }
    if (!isDuplicate) {
      result.push(item);
    }
  }
  return result;
}
