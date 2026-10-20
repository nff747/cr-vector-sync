export type Operation = {
  id: string;
  vector: number[];
  metadata: Record<string, any>;
  timestamp: number;
  clock: number;
  author: string;
  deleted?: boolean;
};

export type VectorClock = Record<string, number>;

export type CausalRelation = 'EQUALS' | 'HAPPENS_BEFORE' | 'HAPPENS_AFTER' | 'CONCURRENT';

/**
 * Compares two vector clocks to establish their partial order causal relationship.
 */
export function compareVectorClocks(a: VectorClock, b: VectorClock): CausalRelation {
  let aHasGreater = false;
  let bHasGreater = false;
  const allPeers = new Set([...Object.keys(a), ...Object.keys(b)]);

  for (const peer of allPeers) {
    const valA = a[peer] || 0;
    const valB = b[peer] || 0;
    if (valA > valB) aHasGreater = true;
    if (valB > valA) bHasGreater = true;
  }

  if (!aHasGreater && !bHasGreater) return 'EQUALS';
  if (aHasGreater && !bHasGreater) return 'HAPPENS_AFTER';
  if (!aHasGreater && bHasGreater) return 'HAPPENS_BEFORE';
  return 'CONCURRENT';
}

/**
 * Merges two vector clocks by computing the component-wise maximum.
 */
export function mergeVectorClocks(a: VectorClock, b: VectorClock): VectorClock {
  const merged: VectorClock = { ...a };
  for (const [peer, clock] of Object.entries(b)) {
    merged[peer] = Math.max(merged[peer] || 0, clock);
  }
  return merged;
}

export class CRDTLog {
  log: Operation[] = [];
  localId: string = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'peer-' + Math.random().toString(36).substring(2, 9);
  logicalClock: number = 0;

  append(op: Omit<Operation, 'timestamp' | 'clock' | 'author'>) {
    this.logicalClock += 1;
    const fullOp: Operation = {
      ...op,
      timestamp: Date.now(),
      clock: this.logicalClock,
      author: this.localId
    };
    this.log.push(fullOp);
    return fullOp;
  }

  delete(id: string) {
    this.logicalClock += 1;
    const tombstone: Operation = {
      id,
      vector: [],
      metadata: {},
      timestamp: Date.now(),
      clock: this.logicalClock,
      author: this.localId,
      deleted: true
    };
    this.log.push(tombstone);
    return tombstone;
  }

  merge(remoteLog: Operation[]) {
    const seen = new Set(this.log.map(o => `${o.id}-${o.author}-${o.clock}`));
    for (const op of remoteLog) {
      if (!seen.has(`${op.id}-${op.author}-${op.clock}`)) {
        this.log.push(op);
        this.logicalClock = Math.max(this.logicalClock, op.clock || 0);
      }
    }
    this.log.sort((a, b) => {
      if (a.clock !== b.clock) {
        return a.clock - b.clock;
      }
      if (a.timestamp !== b.timestamp) {
        return a.timestamp - b.timestamp;
      }
      return a.author.localeCompare(b.author);
    });
  }

  getState() {
    const state = new Map<string, Operation>();
    for (const op of this.log) {
      if (op.deleted) {
        state.delete(op.id);
      } else {
        state.set(op.id, op);
      }
    }
    return Array.from(state.values());
  }

  getVectorClock(): VectorClock {
    const clock: VectorClock = {};
    for (const op of this.log) {
      clock[op.author] = Math.max(clock[op.author] || 0, op.clock);
    }
    return clock;
  }
}
