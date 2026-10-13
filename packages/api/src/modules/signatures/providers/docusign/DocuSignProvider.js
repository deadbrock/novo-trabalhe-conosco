import fs from 'node:fs'
import docusign from 'docusign-esign'
import { env } from '../../../../config/env.js'
import { DocuSignError, wrapDocuSignError } from './DocuSignError.js'
import {
  logDocuSignError,
  logDocuSignRequest,
  logDocuSignResponse,
} from './DocuSignLogger.js'
import {
  buildEthnicDeclarationDocuSignTabs,
  buildEthnicDeclarationEnvelopeTabUpdates,
  buildEthnicDeclarationFieldValues,
} from './ethnicDeclarationTabs.js'
import { isDocuSignPollingError, isDocuSignRateLimited, markDocuSignRateLimited } from './DocuSignSyncThrottle.js'

const SCOPES = ['signature', 'impersonation']

function isEnvelopeSignedStatus(status) {
  const normalized = String(status || '').toLowerCase()
  return normalized === 'signed' || normalized === 'completed'
}

function isRecipientSignedStatus(status) {
  const normalized = String(status || '').toLowerCase()
  return normalized === 'completed' || normalized === 'signed'
}

let cachedToken = null
let cachedTokenExpiresAt = 0
const templateTabsCache = new Map()

function readPrivateKey() {
  if (env.docusignPrivateKeyPath && fs.existsSync(env.docusignPrivateKeyPath)) {
    return fs.readFileSync(env.docusignPrivateKeyPath, 'utf8')
  }
  if (env.docusignPrivateKey) {
    return env.docusignPrivateKey.replace(/\\n/g, '\n')
  }
  return ''
}

export class DocuSignProvider {
  static providerName = 'docusign'

  isConfigured() {
    return Boolean(
      env.docusignIntegrationKey &&
        env.docusignUserId &&
        env.docusignAccountId &&
        readPrivateKey(),
    )
  }

  assertConfigured() {
    if (!this.isConfigured()) {
      throw new DocuSignError('DocuSign não configurado.', { code: 'DOCUSIGN_NOT_CONFIGURED', status: 503 })
    }
  }

  async getAccessToken() {
    this.assertConfigured()

    if (cachedToken && Date.now() < cachedTokenExpiresAt - 60_000) {
      return cachedToken
    }

    logDocuSignRequest('jwt_token')

    try {
      const apiClient = new docusign.ApiClient()
      apiClient.setOAuthBasePath(env.docusignOAuthBasePath)

      const response = await apiClient.requestJWTUserToken(
        env.docusignIntegrationKey,
        env.docusignUserId,
        SCOPES,
        Buffer.from(readPrivateKey()),
        3600,
      )

      cachedToken = response.body.access_token
      cachedTokenExpiresAt = Date.now() + (response.body.expires_in || 3600) * 1000

      logDocuSignResponse('jwt_token', { expiresIn: response.body.expires_in })
      return cachedToken
    } catch (error) {
      logDocuSignError('jwt_token', error)
      throw wrapDocuSignError(error, 'jwt_token')
    }
  }

  async getApiClient() {
    const accessToken = await this.getAccessToken()
    const apiClient = new docusign.ApiClient()
    apiClient.setBasePath(env.docusignBasePath)
    apiClient.addDefaultHeader('Authorization', `Bearer ${accessToken}`)
    return apiClient
  }

  async getTemplateRoleTabs(templateId, templateRole = 'Candidato', documentId = '1') {
    const cacheKey = `${templateId}:${templateRole}:${documentId}`
    if (templateTabsCache.has(cacheKey)) {
      return templateTabsCache.get(cacheKey)
    }

    this.assertConfigured()
    logDocuSignRequest('template_role_tabs', { templateId, templateRole })

    try {
      const apiClient = await this.getApiClient()
      const templatesApi = new docusign.TemplatesApi(apiClient)
      const recipients = await templatesApi.listRecipients(env.docusignAccountId, templateId)
      const signer = (recipients.signers || []).find((entry) => entry.roleName === templateRole)

      if (!signer?.recipientId) {
        logDocuSignResponse('template_role_tabs', { templateId, templateRole, found: false })
        return null
      }

      const tabs = await templatesApi.getDocumentTabs(
        env.docusignAccountId,
        templateId,
        documentId,
        signer.recipientId,
      )

      logDocuSignResponse('template_role_tabs', {
        templateId,
        templateRole,
        textTabs: tabs.textTabs?.length || 0,
        checkboxTabs: tabs.checkboxTabs?.length || 0,
      })

      templateTabsCache.set(cacheKey, tabs)
      return tabs
    } catch (error) {
      logDocuSignError('template_role_tabs', error)
      throw wrapDocuSignError(error, 'template_role_tabs')
    }
  }

  async getEnvelopeSignerTabs(envelopeId, { clientUserId = null, email = null, roleName = null, documentId = '1' }) {
    this.assertConfigured()
    logDocuSignRequest('envelope_signer_tabs', { envelopeId, clientUserId, roleName })

    try {
      const apiClient = await this.getApiClient()
      const envelopesApi = new docusign.EnvelopesApi(apiClient)
      const recipients = await envelopesApi.listRecipients(env.docusignAccountId, envelopeId)
      const normalizedEmail = String(email || '').trim().toLowerCase()

      const signer = (recipients.signers || []).find((entry) => {
        if (clientUserId && entry.clientUserId === clientUserId) return true
        if (normalizedEmail && String(entry.email || '').trim().toLowerCase() === normalizedEmail) return true
        if (roleName && entry.roleName === roleName) return true
        return false
      })

      if (!signer?.recipientId) {
        throw new DocuSignError('Signatário não encontrado no envelope.', {
          code: 'SIGNER_NOT_FOUND',
          status: 404,
        })
      }

      const tabs = await envelopesApi.getDocumentTabs(
        env.docusignAccountId,
        envelopeId,
        documentId,
        signer.recipientId,
      )

      logDocuSignResponse('envelope_signer_tabs', {
        envelopeId,
        recipientId: signer.recipientId,
        textTabs: tabs.textTabs?.length || 0,
      })

      return { recipientId: signer.recipientId, tabs }
    } catch (error) {
      logDocuSignError('envelope_signer_tabs', error)
      const wrapped = wrapDocuSignError(error, 'envelope_signer_tabs')
      if (isDocuSignPollingError(wrapped)) markDocuSignRateLimited()
      throw wrapped
    }
  }

  async updateRecipientTabs(envelopeId, recipientId, tabs) {
    this.assertConfigured()
    logDocuSignRequest('update_recipient_tabs', { envelopeId, recipientId })

    try {
      const apiClient = await this.getApiClient()
      const envelopesApi = new docusign.EnvelopesApi(apiClient)
      const result = await envelopesApi.updateTabs(env.docusignAccountId, envelopeId, recipientId, {
        tabs: docusign.Tabs.constructFromObject(tabs),
      })

      logDocuSignResponse('update_recipient_tabs', { envelopeId, recipientId })
      return result
    } catch (error) {
      logDocuSignError('update_recipient_tabs', error)
      throw wrapDocuSignError(error, 'update_recipient_tabs')
    }
  }

  async prefillEthnicDeclarationTabs(
    envelopeId,
    { candidate, raceCategory = null, clientUserId = null, email = null, roleName = 'Candidato' },
  ) {
    const fieldValues = buildEthnicDeclarationFieldValues({ candidate })
    const { recipientId, tabs } = await this.getEnvelopeSignerTabs(envelopeId, {
      clientUserId,
      email,
      roleName,
    })

    const updates = buildEthnicDeclarationEnvelopeTabUpdates(fieldValues, tabs.textTabs || [])

    if (raceCategory && tabs.checkboxTabs?.length) {
      const checkboxTabs = buildEthnicDeclarationDocuSignTabs({
        candidate,
        raceCategory,
        templateCheckboxTabs: tabs.checkboxTabs,
      }).checkboxTabs

      if (checkboxTabs?.length) {
        updates.checkboxTabs = checkboxTabs.map((tab) => {
          const existing = tabs.checkboxTabs.find(
            (entry) => entry.tabLabel === tab.tabLabel || entry.tabId === tab.tabId,
          )
          return existing?.tabId ? { tabId: existing.tabId, selected: 'true' } : tab
        })
      }
    }

    if (!updates.textTabs?.length) return

    await this.updateRecipientTabs(envelopeId, recipientId, updates)
  }

  async createEnvelope({
    email,
    name,
    clientUserId,
    documentName,
    documentBase64 = null,
    templateId = null,
    templateRole = 'Candidato',
    emailSubject,
    tabs = null,
  }) {
    this.assertConfigured()
    logDocuSignRequest('create_envelope', { documentName, templateId: templateId || null })

    try {
      const apiClient = await this.getApiClient()
      const envelopesApi = new docusign.EnvelopesApi(apiClient)
      let envelopeDefinition

      if (templateId) {
        const rolePayload = {
          email,
          name,
          roleName: templateRole,
          clientUserId,
        }

        if (tabs) {
          rolePayload.tabs = docusign.Tabs.constructFromObject(tabs)
        }

        const role = docusign.TemplateRole.constructFromObject(rolePayload)

        envelopeDefinition = docusign.EnvelopeDefinition.constructFromObject({
          templateId,
          templateRoles: [role],
          status: 'sent',
          emailSubject: emailSubject || `Assinatura — ${documentName}`,
        })
      } else {
        if (!documentBase64) {
          throw new DocuSignError('Documento PDF não informado.', { code: 'DOCUMENT_MISSING', status: 400 })
        }

        const document = docusign.Document.constructFromObject({
          documentBase64,
          name: documentName,
          fileExtension: 'pdf',
          documentId: '1',
        })

        const signer = docusign.Signer.constructFromObject({
          email,
          name,
          recipientId: '1',
          clientUserId,
          routingOrder: '1',
        })

        const signHere = docusign.SignHere.constructFromObject({
          documentId: '1',
          pageNumber: '1',
          recipientId: '1',
          anchorString: '/sign_here/',
          anchorUnits: 'pixels',
          anchorXOffset: '0',
          anchorYOffset: '0',
        })

        signer.tabs = docusign.Tabs.constructFromObject({ signHereTabs: [signHere] })

        envelopeDefinition = docusign.EnvelopeDefinition.constructFromObject({
          emailSubject: emailSubject || `Assinatura — ${documentName}`,
          documents: [document],
          recipients: docusign.Recipients.constructFromObject({ signers: [signer] }),
          status: 'sent',
        })
      }

      const result = await envelopesApi.createEnvelope(env.docusignAccountId, { envelopeDefinition })
      logDocuSignResponse('create_envelope', { envelopeId: result.envelopeId })

      return {
        envelopeId: result.envelopeId,
        status: result.status || 'sent',
      }
    } catch (error) {
      logDocuSignError('create_envelope', error)
      throw wrapDocuSignError(error, 'create_envelope')
    }
  }

  async voidEnvelope(envelopeId, voidedReason = 'Substituído por nova versão do documento.') {
    this.assertConfigured()
    logDocuSignRequest('void_envelope', { envelopeId })

    try {
      const apiClient = await this.getApiClient()
      const envelopesApi = new docusign.EnvelopesApi(apiClient)
      const result = await envelopesApi.update(env.docusignAccountId, envelopeId, {
        envelope: { status: 'voided', voidedReason },
      })

      logDocuSignResponse('void_envelope', { envelopeId, status: result.status || 'voided' })
      return result
    } catch (error) {
      logDocuSignError('void_envelope', error)
      throw wrapDocuSignError(error, 'void_envelope')
    }
  }

  async getEmbeddedSigningUrl({ envelopeId, email, name, clientUserId, returnUrl }) {
    this.assertConfigured()
    logDocuSignRequest('embedded_signing_url', { envelopeId })

    try {
      const apiClient = await this.getApiClient()
      const envelopesApi = new docusign.EnvelopesApi(apiClient)

      const viewRequest = docusign.RecipientViewRequest.constructFromObject({
        returnUrl,
        authenticationMethod: 'none',
        email,
        userName: name,
        clientUserId,
      })

      const view = await envelopesApi.createRecipientView(env.docusignAccountId, envelopeId, {
        recipientViewRequest: viewRequest,
      })

      logDocuSignResponse('embedded_signing_url', { envelopeId })
      return view.url
    } catch (error) {
      logDocuSignError('embedded_signing_url', error)
      throw wrapDocuSignError(error, 'embedded_signing_url')
    }
  }

  async getEnvelopeStatus(envelopeId) {
    this.assertConfigured()
    logDocuSignRequest('envelope_status', { envelopeId })

    try {
      const apiClient = await this.getApiClient()
      const envelopesApi = new docusign.EnvelopesApi(apiClient)
      const envelope = await envelopesApi.getEnvelope(env.docusignAccountId, envelopeId)

      logDocuSignResponse('envelope_status', { envelopeId, status: envelope.status })
      return envelope.status
    } catch (error) {
      logDocuSignError('envelope_status', error)
      throw wrapDocuSignError(error, 'envelope_status')
    }
  }

  async isSigningComplete(envelopeId, { clientUserId = null, email = null } = {}) {
    if (isDocuSignRateLimited()) {
      throw new DocuSignError('Limite de consultas DocuSign atingido.', {
        code: 'HOURLY_ENVELOPE_POLLING_LIMIT_EXCEEDED',
        status: 429,
      })
    }

    this.assertConfigured()
    logDocuSignRequest('recipient_status', { envelopeId, clientUserId, email })

    try {
      const apiClient = await this.getApiClient()
      const envelopesApi = new docusign.EnvelopesApi(apiClient)
      const recipients = await envelopesApi.listRecipients(env.docusignAccountId, envelopeId)
      const signers = recipients.signers || []
      const normalizedEmail = String(email || '').trim().toLowerCase()

      const matchedSigner = signers.find((signer) => {
        if (clientUserId && signer.clientUserId === clientUserId) return true
        if (normalizedEmail && String(signer.email || '').trim().toLowerCase() === normalizedEmail) {
          return true
        }
        return false
      })

      const recipientSigned = Boolean(matchedSigner && isRecipientSignedStatus(matchedSigner.status))

      logDocuSignResponse('recipient_status', {
        envelopeId,
        recipientSigned,
        matchedRecipientStatus: matchedSigner?.status || null,
      })

      return recipientSigned
    } catch (error) {
      logDocuSignError('recipient_status', error)
      throw wrapDocuSignError(error, 'recipient_status')
    }
  }

  async downloadSignedPdf(envelopeId) {
    return this.downloadEnvelopeDocument(envelopeId, 'combined', 'download_signed_pdf')
  }

  async downloadCertificate(envelopeId) {
    return this.downloadEnvelopeDocument(envelopeId, 'certificate', 'download_certificate')
  }

  async downloadEnvelopeDocument(envelopeId, documentId, action) {
    this.assertConfigured()
    logDocuSignRequest(action, { envelopeId, documentId })

    try {
      const apiClient = await this.getApiClient()
      const envelopesApi = new docusign.EnvelopesApi(apiClient)
      const pdfBytes = await envelopesApi.getDocument(env.docusignAccountId, envelopeId, documentId)
      const buffer = Buffer.from(pdfBytes, 'binary')

      logDocuSignResponse(action, { envelopeId, documentId, size: buffer.length })
      return buffer
    } catch (error) {
      logDocuSignError(action, error)
      throw wrapDocuSignError(error, action)
    }
  }
}

export function isDocuSignConfigured() {
  return new DocuSignProvider().isConfigured()
}
