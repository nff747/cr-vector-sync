export class PriorityQueue<T> {
  private items: { item: T; priority: number }[] = [];

  constructor(private isMax: boolean = false) {}

  push(item: T, priority: number) {
    this.items.push({ item, priority });
    this.items.sort((a, b) => this.isMax ? b.priority - a.priority : a.priority - b.priority);
  }

  pop(): T | undefined {
    return this.items.shift()?.item;
  }

  peek(): { item: T; priority: number } | undefined {
    return this.items[0];
  }

  size(): number {
    return this.items.length;
  }

  values(): T[] {
    return this.items.map(i => i.item);
  }
}
