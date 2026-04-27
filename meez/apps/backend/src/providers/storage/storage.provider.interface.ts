export interface StorageProvider {
  upload(key: string, data: Buffer, contentType: string): Promise<string>;
  getUrl(key: string): Promise<string>;
  delete(key: string): Promise<void>;
}
