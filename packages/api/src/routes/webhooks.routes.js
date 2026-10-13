import { Router } from 'express'
import crypto from 'node:crypto'
import { env } from '../config/env.js'
import { documentService } from '../modules/documents/DocumentService.js'
import { handleDocuSignWebhook as handleLegacyWebhook } from '../services/documentSignature.service.js'
import { logDocuSignWebhook } from '../modules/signatures/providers/docusign/DocuSignLogger.js'

const router = Router()

function verifyConnectSignature(req) {
  if (!env.docusignConnectHmacKey || env.docusignConnectHmacKey === 'sua_chave_hmac') {
    return true
  }

  const signature = req.get('X-DocuSign-Signature-1') || req.get('x-docusign-signature-1')
  if (!signature) return false

  const computed = crypto
    .createHmac('sha256', env.docusignConnectHmacKey)
    .update(JSON.stringify(req.body))
    .digest('base64')

  if (signature.length !== computed.length) return false
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(computed))
}

router.post('/docusign', async (req, res) => {
  try {
    if (!verifyConnectSignature(req)) {
      logDocuSignWebhook('invalid_hmac', {})
      return res.status(401).json({ error: 'INVALID_SIGNATURE' })
    }

    const result = await documentService.handleWebhook(req.body)

    if (!result.handled) {
      const legacy = await handleLegacyWebhook(req.body)
      return res.status(200).json({ received: true, ...legacy })
    }

    res.status(200).json({ received: true, ...result })
  } catch (error) {
    console.error('[DocuSign Webhook]', error)
    res.status(200).json({ received: true, error: error.message })
  }
})

export default router
