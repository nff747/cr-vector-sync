export class OPFSSync {
  directory: FileSystemDirectoryHandle | null = null;
  fileHandle: FileSystemFileHandle | null = null;
  private readonly FILENAME = 'cr_vector_store.dat';
  private readonly TMP_FILENAME = 'cr_vector_store.dat.tmp';
  private readonly MAGIC_HEADER = 0x56454354; // 'VECT' in hex

  isAvailable(): boolean {
    return typeof navigator !== 'undefined' && Boolean(navigator.storage?.getDirectory);
  }

  async init(): Promise<boolean> {
    if (this.isAvailable()) {
      try {
        this.directory = await navigator.storage.getDirectory();
        this.fileHandle = await this.directory.getFileHandle(this.FILENAME, { create: true });
        return true;
      } catch {
        this.directory = null;
        this.fileHandle = null;
        return false;
      }
    }
    return false;
  }

  async writeVectors(vectors: Float32Array): Promise<boolean> {
    if (!this.fileHandle) return false;
    try {
      const writable = await this.fileHandle.createWritable();
      await writable.write(vectors as unknown as BufferSource);
      await writable.close();
      return true;
    } catch {
      return false;
    }
  }

  async writeVectorsAtomic(vectors: Float32Array): Promise<boolean> {
    if (!this.directory) return false;
    try {
      const tmpHandle = await this.directory.getFileHandle(this.TMP_FILENAME, { create: true });
      const writable = await tmpHandle.createWritable();
      await writable.write(vectors as unknown as BufferSource);
      await writable.close();

      // Read back from tmp
      const tmpFile = await tmpHandle.getFile();
      const arrayBuffer = await tmpFile.arrayBuffer();

      // Write to main file safely
      this.fileHandle = await this.directory.getFileHandle(this.FILENAME, { create: true });
      const mainWritable = await this.fileHandle.createWritable();
      await mainWritable.write(arrayBuffer);
      await mainWritable.close();

      // Remove temp file
      await this.directory.removeEntry(this.TMP_FILENAME).catch(() => {});
      return true;
    } catch {
      return false;
    }
  }

  async readVectors(): Promise<Float32Array | null> {
    if (!this.fileHandle) return null;
    try {
      const file = await this.fileHandle.getFile();
      const arrayBuffer = await file.arrayBuffer();
      return new Float32Array(arrayBuffer);
    } catch {
      return null;
    }
  }

  async getSize(): Promise<number> {
    if (!this.fileHandle) return 0;
    try {
      const file = await this.fileHandle.getFile();
      return file.size;
    } catch {
      return 0;
    }
  }

  async clear(): Promise<void> {
    if (this.directory) {
      await this.directory.removeEntry(this.FILENAME).catch(() => {});
      await this.directory.removeEntry(this.TMP_FILENAME).catch(() => {});
      this.fileHandle = await this.directory.getFileHandle(this.FILENAME, { create: true });
    }
  }
}
