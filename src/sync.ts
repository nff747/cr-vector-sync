import { Operation } from './crdt.js';

export interface SyncAdapter {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  broadcast(operations: Operation[]): Promise<void>;
  onReceive(callback: (operations: Operation[]) => void): void;
}

export class BroadcastChannelSync implements SyncAdapter {
  private channel: BroadcastChannel | null = null;
  private listeners: ((ops: Operation[]) => void)[] = [];

  constructor(private channelName: string) {}

  async connect(): Promise<void> {
    if (typeof BroadcastChannel !== 'undefined') {
      this.channel = new BroadcastChannel(this.channelName);
      this.channel.onmessage = (event) => {
        for (const listener of this.listeners) {
          listener(event.data);
        }
      };
    }
  }

  async disconnect(): Promise<void> {
    if (this.channel) {
      this.channel.close();
      this.channel = null;
    }
  }

  async broadcast(operations: Operation[]): Promise<void> {
    if (this.channel) {
      this.channel.postMessage(operations);
    }
  }

  onReceive(callback: (operations: Operation[]) => void): void {
    this.listeners.push(callback);
  }
}
