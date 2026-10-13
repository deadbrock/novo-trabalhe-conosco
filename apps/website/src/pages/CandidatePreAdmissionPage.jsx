import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Upload, FileCheck, AlertCircle, Camera, FileSignature, ArrowRight } from 'lucide-react'
import { SeoHead } from '@/components/seo/SeoHead'
import { Heading } from '@/components/ui/Heading/Heading'
import { Text } from '@/components/ui/Text/Text'
import { Badge } from '@/components/ui/Badge/Badge'
import { Button } from '@/components/ui/Button/Button'
import { useAuth } from '@/context/AuthContext'
import { candidateService } from '@/services/candidateService'
import { ROUTES } from '@/constants/routes'

const STATUS_LABELS = {
  PENDING_UPLOAD: { label: 'Envie os documentos', variant: 'amber' },
  UNDER_REVIEW: { label: 'Em análise pelo RH', variant: 'blue' },
}

const ETHNIC_DECLARATION_ROUTE = ROUTES.CANDIDATE_ETHNIC_DECLARATION

function isEthnicDeclarationItem(doc) {
  return doc.electronicSignature
    || doc.slug === 'autodeclaracao'
    || /autodeclara/i.test(doc.label || '')
}

function needsEthnicSignature(doc) {
  return isEthnicDeclarationItem(doc) && ['PENDING', 'REJECTED'].includes(doc.status)
}

const ITEM_STATUS = {
  PENDING: { label: 'Pendente', variant: 'default' },
  UPLOADED: { label: 'Enviado', variant: 'blue' },
  APPROVED: { label: 'Aprovado', variant: 'green' },
  REJECTED: { label: 'Reprovado — reenvie', variant: 'red' },
}

export function CandidatePreAdmissionPage() {
  const { token } = useAuth()
  const [documentations, setDocumentations] = useState([])
  const [loading, setLoading] = useState(true)
  const [feedback, setFeedback] = useState('')
  const [uploadingItem, setUploadingItem] = useState(null)
  const fileInputRef = useRef(null)
  const [activeUpload, setActiveUpload] = useState(null)

  async function loadDocumentations() {
    setLoading(true)
    try {
      const data = await candidateService.getDocumentations(token)
      setDocumentations(data.documentations || [])
    } catch {
      setFeedback('Erro ao carregar documentação.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDocumentations()
  }, [token])

  async function handleUpload(documentationId, itemId, file) {
    setFeedback('')
    setUploadingItem(itemId)
    try {
      await candidateService.uploadDocumentationDocument(token, documentationId, itemId, file)
      await loadDocumentations()
    } catch (err) {
      setFeedback(err.message || 'Erro ao enviar documento.')
    } finally {
      setUploadingItem(null)
      setActiveUpload(null)
    }
  }

  const guidance = documentations[0]?.guidance
  const showEthnicBanner = documentations.some((item) =>
    item.items.some((doc) => needsEthnicSignature(doc)),
  )

  if (loading) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-neutral-200 border-t-brand-red-600 animate-spin" />
      </div>
    )
  }

  return (
    <>
      <SeoHead title="Documentação" noindex />

      <Heading as="h1" level={3}>Documentação</Heading>
      <Text className="mt-2">
        Envie os documentos solicitados pelo RH. Somente candidatos liberados para esta etapa recebem acesso a este checklist.
      </Text>

      {feedback && (
        <p className="mt-4 text-sm text-brand-red-600 bg-brand-red-50 rounded-xl px-4 py-3">{feedback}</p>
      )}

      {!documentations.length ? (
        <div className="mt-10 rounded-2xl border border-dashed border-brand-blue-200 bg-white p-10 text-center">
          <FileCheck className="mx-auto text-brand-blue-300 mb-3" size={32} />
          <Text size="sm">Nenhuma solicitação de documentação no momento.</Text>
          <Text size="sm" className="mt-2 text-neutral-500">
            Quando o RH liberar o envio após a entrevista, o checklist aparecerá aqui com orientações detalhadas.
          </Text>
          <Link to={ROUTES.CANDIDATE_PORTAL} className="inline-block mt-4">
            <Button variant="outline" size="sm">Voltar ao portal</Button>
          </Link>
        </div>
      ) : (
        <div className="mt-8 space-y-8">
          {showEthnicBanner && (
            <section className="rounded-2xl border border-brand-blue-200 bg-gradient-to-br from-brand-blue-50 to-white p-5 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-blue-600 text-white">
                    <FileSignature size={20} />
                  </div>
                  <div>
                    <h2 className="font-display font-semibold text-neutral-900">Autodeclaração Étnico-Racial</h2>
                    <Text size="sm" className="mt-1 max-w-xl">
                      Assine eletronicamente pelo portal. Seus dados são preenchidos automaticamente — não é necessário imprimir nem enviar PDF.
                    </Text>
                  </div>
                </div>
                <Link to={ETHNIC_DECLARATION_ROUTE} className="shrink-0 w-full sm:w-auto">
                  <Button className="w-full sm:w-auto min-h-[44px]">
                    <FileSignature size={16} />
                    Assinar autodeclaração
                    <ArrowRight size={16} />
                  </Button>
                </Link>
              </div>
            </section>
          )}

          {guidance && (
            <section className="rounded-2xl border border-amber-200 bg-amber-50/60 p-5 space-y-3">
              <div className="flex items-start gap-3">
                <Camera className="text-amber-700 shrink-0 mt-0.5" size={20} />
                <div>
                  <h2 className="font-display font-semibold text-neutral-900">{guidance.title}</h2>
                  <Text size="sm" className="mt-1">{guidance.intro}</Text>
                </div>
              </div>
              <ul className="space-y-2 pl-1">
                {guidance.tips.map((tip) => (
                  <li key={tip} className="text-sm text-neutral-700 flex gap-2">
                    <span className="text-amber-600 shrink-0">•</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
              <p className="text-xs text-neutral-600">{guidance.uploadHint}</p>
            </section>
          )}

          {documentations.map((item) => {
            const status = STATUS_LABELS[item.status] || STATUS_LABELS.PENDING_UPLOAD
            const canUpload = ['PENDING_UPLOAD', 'UNDER_REVIEW'].includes(item.status)

            return (
              <section key={item.id} className="rounded-2xl border border-brand-blue-100 bg-white p-6 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div>
                    <h2 className="font-display text-lg font-semibold text-neutral-900">{item.jobTitle}</h2>
                    <Text size="sm" className="mt-1">
                      {item.progress.uploadedRequired}/{item.progress.totalRequired} documentos enviados
                    </Text>
                    {item.status === 'UNDER_REVIEW' && !item.hasRejectedItems && (
                      <Text size="sm" className="mt-2 text-brand-blue-700">
                        Sua documentação foi recebida e está em análise pelo RH.
                      </Text>
                    )}
                  </div>
                  <Badge variant={status.variant}>{status.label}</Badge>
                </div>

                {item.hasRejectedItems && (
                  <div className="rounded-xl border border-red-200 bg-red-50/50 px-4 py-3 flex gap-3">
                    <AlertCircle className="text-red-600 shrink-0 mt-0.5" size={18} />
                    <div>
                      <p className="text-sm font-medium text-red-800">Correção necessária</p>
                      <p className="text-sm text-red-700 mt-1">{item.rejectionHint}</p>
                    </div>
                  </div>
                )}

                <ul className="space-y-4">
                  {item.items
                    .filter((doc, index, list) => {
                      if (!isEthnicDeclarationItem(doc)) return true
                      return list.findIndex((entry) => isEthnicDeclarationItem(entry)) === index
                    })
                    .map((doc) => {
                    const docStatus = ITEM_STATUS[doc.status] || ITEM_STATUS.PENDING
                    const ethnic = isEthnicDeclarationItem(doc)
                    const showUpload = canUpload && !ethnic && ['PENDING', 'REJECTED'].includes(doc.status)
                    const showSignButton = ethnic && doc.status !== 'APPROVED'

                    return (
                      <li key={doc.id} className="rounded-xl border border-neutral-100 bg-brand-blue-50/30 p-4">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-medium text-neutral-900">{doc.label}</p>
                              {doc.required ? (
                                <span className="text-[10px] uppercase tracking-wide text-brand-red-600 font-semibold">
                                  Obrigatório
                                </span>
                              ) : (
                                <span className="text-[10px] uppercase tracking-wide text-neutral-400 font-semibold">
                                  Se aplicável
                                </span>
                              )}
                              <Badge variant={docStatus.variant}>{docStatus.label}</Badge>
                            </div>
                            {doc.description && (
                              <Text size="sm" className="mt-1">{doc.description}</Text>
                            )}
                            {doc.helpUrl && (
                              <a
                                href={doc.helpUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-sm text-brand-blue-600 hover:underline mt-1 inline-block"
                              >
                                Acessar site para emissão →
                              </a>
                            )}
                            {doc.rejectionReason && (
                              <div className="mt-2 rounded-lg bg-red-50 border border-red-100 px-3 py-2">
                                <p className="text-xs font-medium text-red-800">Motivo informado pelo RH:</p>
                                <p className="text-xs text-red-700 mt-0.5">{doc.rejectionReason}</p>
                              </div>
                            )}
                            {doc.documentFileName && (
                              <p className="text-xs text-neutral-500 mt-2">{doc.documentFileName}</p>
                            )}
                            {ethnic && doc.status === 'PENDING' && (
                              <p className="text-xs text-brand-blue-700 mt-2">
                                Assine eletronicamente pelo portal — o PDF é gerado automaticamente após a confirmação.
                              </p>
                            )}
                          </div>

                          {showSignButton && (
                            <Link to={ETHNIC_DECLARATION_ROUTE} className="shrink-0">
                              <Button
                                size="sm"
                                variant={doc.status === 'REJECTED' ? 'primary' : needsEthnicSignature(doc) ? 'primary' : 'outline'}
                                className="min-h-[40px]"
                              >
                                <FileSignature size={14} />
                                {needsEthnicSignature(doc)
                                  ? 'Assinar no portal'
                                  : doc.status === 'UPLOADED'
                                    ? 'Ver autodeclaração'
                                    : 'Acessar autodeclaração'}
                                <ArrowRight size={14} />
                              </Button>
                            </Link>
                          )}

                          {showUpload && (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={uploadingItem === doc.id}
                              onClick={() => {
                                setActiveUpload({ documentationId: item.id, itemId: doc.id })
                                fileInputRef.current?.click()
                              }}
                            >
                              <Upload size={14} />
                              {uploadingItem === doc.id ? 'Enviando...' : doc.status === 'REJECTED' ? 'Reenviar arquivo' : 'Enviar arquivo'}
                            </Button>
                          )}
                        </div>
                      </li>
                    )
                  })}
                </ul>
              </section>
            )
          })}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0]
          if (file && activeUpload) {
            handleUpload(activeUpload.documentationId, activeUpload.itemId, file)
          }
          event.target.value = ''
        }}
      />
    </>
  )
}
