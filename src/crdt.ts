export type Operation = {
  id: string;
  vector: number[];
  metadata: Record<string, any>;
  timestamp: number;
  clock: number;
  author: string;
  deleted?: boolean;
};

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

  merge(remoteLog: Operation[]) {
    const seen = new Set(this.log.map(o => `${o.id}-${o.author}-${o.clock}`));
    for (const op of remoteLog) {
      if (!seen.has(`${op.id}-${op.author}-${op.clock}`)) {
        this.log.push(op);
        this.logicalClock = Math.max(this.logicalClock, op.clock || 0);
      }
    }
    // Sort deterministically by logical clock, timestamp, then author
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
}
