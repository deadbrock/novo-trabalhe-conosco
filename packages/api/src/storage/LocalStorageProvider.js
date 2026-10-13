import fs from 'node:fs'
import path from 'node:path'
import { createReadStream } from 'node:fs'
import { StorageProvider } from './StorageProvider.js'

export class LocalStorageProvider extends StorageProvider {
  constructor(basePath) {
    super()
    this.basePath = basePath
    this.ensureDir()
  }

  ensureDir() {
    if (!fs.existsSync(this.basePath)) {
      fs.mkdirSync(this.basePath, { recursive: true })
    }
  }

  resolveKey(key) {
    const resolved = path.resolve(this.basePath, key)
    if (!resolved.startsWith(path.resolve(this.basePath))) {
      throw new Error('INVALID_STORAGE_KEY')
    }
    return resolved
  }

  async upload(file, { key, directory = '' }) {
    const dir = directory ? path.join(this.basePath, directory) : this.basePath
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })

    const storageKey = directory ? `${directory}/${path.basename(key)}` : key
    const dest = this.resolveKey(storageKey)

    if (file.path) {
      if (!fs.existsSync(file.path)) {
        throw new Error(`UPLOAD_TEMP_MISSING: arquivo temporário não encontrado (${file.path})`)
      }
      fs.renameSync(file.path, dest)
    } else if (file.buffer) {
      fs.writeFileSync(dest, file.buffer)
    } else {
      throw new Error('UPLOAD_FILE_MISSING: nenhum arquivo recebido para upload')
    }

    return { key: storageKey, provider: 'LOCAL' }
  }

  async download(key) {
    const filePath = this.resolveKey(key)
    if (!fs.existsSync(filePath)) throw new Error('FILE_NOT_FOUND')

    const stat = fs.statSync(filePath)
    return {
      stream: createReadStream(filePath),
      mimeType: 'application/octet-stream',
      size: stat.size,
    }
  }

  async delete(key) {
    const filePath = this.resolveKey(key)
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
  }

  async exists(key) {
    return fs.existsSync(this.resolveKey(key))
  }
}
