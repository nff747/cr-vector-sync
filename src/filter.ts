export type FilterExpression = Record<string, any>;

export function matchesFilter(metadata: Record<string, any> = {}, filter?: FilterExpression): boolean {
  if (!filter || Object.keys(filter).length === 0) return true;

  for (const [key, expected] of Object.entries(filter)) {
    const actual = metadata[key];
    if (typeof expected === 'object' && expected !== null) {
      if ('$eq' in expected && actual !== expected.$eq) return false;
      if ('$ne' in expected && actual === expected.$ne) return false;
      if ('$gt' in expected && !(actual > expected.$gt)) return false;
      if ('$gte' in expected && !(actual >= expected.$gte)) return false;
      if ('$lt' in expected && !(actual < expected.$lt)) return false;
      if ('$lte' in expected && !(actual <= expected.$lte)) return false;
      if ('$in' in expected && !expected.$in.includes(actual)) return false;
    } else {
      if (actual !== expected) return false;
    }
  }

  return true;
}
