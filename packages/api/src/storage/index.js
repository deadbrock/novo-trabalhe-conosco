import { env } from '../config/env.js'
import { LocalStorageProvider } from './LocalStorageProvider.js'

let instance = null

/**
 * Factory de storage — adicionar SupabaseStorageProvider / RailwayStorageProvider aqui.
 */
export function getStorageProvider() {
  if (instance) return instance

  switch (env.storageProvider) {
    case 'LOCAL':
    default:
      instance = new LocalStorageProvider(env.storageLocalPath)
      break
    // case 'SUPABASE':
    //   instance = new SupabaseStorageProvider({ url: env.supabaseUrl, key: env.supabaseKey, bucket: env.supabaseBucket })
    //   break
  }

  return instance
}

export class StorageService {
  constructor(provider = getStorageProvider()) {
    this.provider = provider
  }

  upload(file, options) {
    return this.provider.upload(file, options)
  }

  download(key) {
    return this.provider.download(key)
  }

  delete(key) {
    return this.provider.delete(key)
  }

  exists(key) {
    return this.provider.exists(key)
  }
}

export const storageService = new StorageService()
