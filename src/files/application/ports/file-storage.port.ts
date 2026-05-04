export const FILE_STORAGE = Symbol('FILE_STORAGE');

export interface FileStoragePort {
  upload(params: {
    buffer: Buffer;
    contentType: string;
    originalName: string;
    folder: string;
  }): Promise<{
    key: string;
    url: string;
  }>;

  delete(key: string): Promise<void>;
}
