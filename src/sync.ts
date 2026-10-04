import { Operation } from './crdt.js';

export interface SyncAdapter {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  broadcast(operations: Operation[]): Promise<void>;
  onReceive(callback: (operations: Operation[]) => void): void;
}
