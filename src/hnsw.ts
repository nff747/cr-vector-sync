import { dotProduct } from './math.js';

export interface HNSWNode {
  id: string;
  vector: Float32Array;
  level: number;
  neighbors: Map<number, Set<string>>;
}

export class HNSWGraph {
  nodes: Map<string, HNSWNode> = new Map();
  entryPointId: string | null = null;
  maxLevel: number = 0;
  M: number = 16;
  efConstruction: number = 64;

  constructor(m: number = 16, efConstruction: number = 64) {
    this.M = m;
    this.efConstruction = efConstruction;
  }

  private randomLevel(): number {
    const mL = 1 / Math.log(this.M);
    return Math.floor(-Math.log(Math.random()) * mL);
  }

  async insert(id: string, vectorArray: number[]) {
    const vector = new Float32Array(vectorArray);
    const level = this.randomLevel();
    const node: HNSWNode = {
      id,
      vector,
      level,
      neighbors: new Map()
    };

    for (let l = 0; l <= level; l++) {
      node.neighbors.set(l, new Set());
    }

    if (!this.entryPointId) {
      this.entryPointId = id;
      this.maxLevel = level;
      this.nodes.set(id, node);
      return;
    }

    this.nodes.set(id, node);
  }

  async search(queryArray: number[], topK: number = 5): Promise<{ id: string; score: number }[]> {
    const query = new Float32Array(queryArray);
    const results: { id: string; score: number }[] = [];
    
    for (const [id, node] of this.nodes) {
      const score = dotProduct(query, node.vector);
      results.push({ id, score });
    }

    results.sort((a, b) => b.score - a.score);
    return results.slice(0, topK);
  }
}
