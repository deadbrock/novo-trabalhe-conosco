/**
 * Contrato base para provedores de armazenamento de arquivos.
 * Permite trocar LOCAL → Supabase → Railway sem impactar services.
 */
export class StorageProvider {
  /** @returns {Promise<{ key: string, provider: string }>} */
  async upload(_file, _options) {
    throw new Error('StorageProvider.upload() not implemented')
  }

  /** @returns {Promise<{ stream: import('node:stream').Readable, mimeType: string, size: number }>} */
  async download(_key) {
    throw new Error('StorageProvider.download() not implemented')
  }

  async delete(_key) {
    throw new Error('StorageProvider.delete() not implemented')
  }

  async exists(_key) {
    throw new Error('StorageProvider.exists() not implemented')
  }
}
