export class OPFSSync {
  directory: FileSystemDirectoryHandle | null = null;
  fileHandle: FileSystemFileHandle | null = null;
  private readonly MAGIC_HEADER = 0x56454354; // 'VECT' in hex

  async init() {
    if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.getDirectory) {
      this.directory = await navigator.storage.getDirectory();
      this.fileHandle = await this.directory.getFileHandle('cr_vector_store.dat', { create: true });
    }
  }

  async writeVectors(vectors: Float32Array) {
    if (!this.fileHandle) return;
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

  async clear(): Promise<void> {
    if (this.directory) {
      await this.directory.removeEntry('cr_vector_store.dat').catch(() => {});
      this.fileHandle = await this.directory.getFileHandle('cr_vector_store.dat', { create: true });
    }
  }
}
