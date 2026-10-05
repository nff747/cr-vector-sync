
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
