import { DocuSignProvider } from './docusign/DocuSignProvider.js'

const providers = {
  docusign: DocuSignProvider,
}

export function getSignatureProvider(name = 'docusign') {
  const ProviderClass = providers[name]
  if (!ProviderClass) {
    throw new Error(`SIGNATURE_PROVIDER_NOT_FOUND:${name}`)
  }
  return new ProviderClass()
}

export function listSignatureProviders() {
  return Object.keys(providers)
}

export { DocuSignProvider, isDocuSignConfigured } from './docusign/DocuSignProvider.js'
