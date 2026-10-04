import { Operation } from './crdt.js';

export class BinaryProtocol {
  static encode(operations: Operation[]): Uint8Array {
    const jsonStr = JSON.stringify(operations);
    return new TextEncoder().encode(jsonStr);
  }

  static decode(bytes: Uint8Array): Operation[] {
    const jsonStr = new TextDecoder().decode(bytes);
    return JSON.parse(jsonStr);
  }
}
