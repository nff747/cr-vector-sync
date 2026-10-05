
export class OPFSSync {
  directory: FileSystemDirectoryHandle | null = null;
  fileHandle: FileSystemFileHandle | null = null;

  async init() {
    if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.getDirectory) {
      this.directory = await navigator.storage.getDirectory();
      this.fileHandle = await this.directory.getFileHandle('cr_vector_store.dat', { create: true });
    }
  }

  async writeVectors(vectors: Float32Array) {
    if (!this.fileHandle) return; // Fallback for environments without OPFS
    const writable = await this.fileHandle.createWritable();
    await writable.write(vectors);
    await writable.close();
  }

  async readVectors(): Promise<Float32Array | null> {
    if (!this.fileHandle) return null;
    const file = await this.fileHandle.getFile();
    const arrayBuffer = await file.arrayBuffer();
    return new Float32Array(arrayBuffer);
  }
}
