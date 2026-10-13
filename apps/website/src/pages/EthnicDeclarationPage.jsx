import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle2, Eye, FileText, ArrowLeft } from 'lucide-react'
import { SeoHead } from '@/components/seo/SeoHead'
import { Heading } from '@/components/ui/Heading/Heading'
import { Text } from '@/components/ui/Text/Text'
import { Badge } from '@/components/ui/Badge/Badge'
import { Button } from '@/components/ui/Button/Button'
import { Card } from '@/components/ui/Card/Card'
import { FadeIn } from '@/components/motion/FadeIn'
import { useAuth } from '@/context/AuthContext'
import {
  candidateDocumentsService,
  RACE_OPTIONS,
} from '@/services/candidateDocumentsService'
import { DocumentPreviewModal } from '@/features/candidate-documents/DocumentPreviewModal'
import { ConfirmSignModal } from '@/features/candidate-documents/ConfirmSignModal'
import { RaceRadioGroup } from '@/features/candidate-documents/RaceRadioGroup'
import { SignatureModal } from '@/features/signatures/SignatureModal'
import { documentsService } from '@/services/documentsService'
import { ROUTES } from '@/constants/routes'
import { cn } from '@/utils/cn'
import { buildSigningReturnUrl } from '@/utils/signingReturnUrl'

function ReadOnlyField({ label, value }) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">{label}</p>
      <p className="font-display text-base font-semibold text-neutral-900">{value || '—'}</p>
    </div>
  )
}

export function EthnicDeclarationPage() {
  const { token } = useAuth()
  const [state, setState] = useState(null)
  const [loading, setLoading] = useState(true)
  const [feedback, setFeedback] = useState('')
  const [raceCategory, setRaceCategory] = useState('')
  const [raceDescription, setRaceDescription] = useState('')
  const [declarationAccepted, setDeclarationAccepted] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [signing, setSigning] = useState(false)
  const [signingUrl, setSigningUrl] = useState('')
  const [signatureDocumentId, setSignatureDocumentId] = useState('')
  const [signatureOpen, setSignatureOpen] = useState(false)
  const [previewUrl, setPreviewUrl] = useState('')
  const [thumbnailUrl, setThumbnailUrl] = useState('')
  const [pendingFinalize, setPendingFinalize] = useState(false)
  const [finalizing, setFinalizing] = useState(false)

  const isSigned = state?.document?.status === 'SIGNED'
  const canEdit = state?.canSign !== false

  const canSubmit = useMemo(
    () => canEdit && raceCategory && declarationAccepted && !signing && !signatureOpen,
    [canEdit, raceCategory, declarationAccepted, signing, signatureOpen],
  )

  const loadState = useCallback(async () => {
    setLoading(true)
    setFeedback('')
    try {
      const data = await candidateDocumentsService.getEthnicDeclarationState(token)
      setState(data)
      setRaceCategory(data.raceCategory || '')
      setRaceDescription(data.raceDescription || '')
      setDeclarationAccepted(false)
    } catch (err) {
      setFeedback(err.message || 'Erro ao carregar autodeclaração.')
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    loadState()
  }, [loadState])

  useEffect(() => {
    let active = true
    let objectUrl = ''

    async function loadPreview() {
      try {
        const url = await candidateDocumentsService.getEthnicDeclarationPreviewUrl(token, {
          signed: isSigned,
        })
        if (active) {
          objectUrl = url
          setThumbnailUrl(url)
        } else {
          URL.revokeObjectURL(url)
        }
      } catch {
        if (active) setThumbnailUrl('')
      }
    }

    if (token && state) loadPreview()

    return () => {
      active = false
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [token, state, isSigned])

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  async function openPreview() {
    setPreviewOpen(true)
    setPreviewUrl('')
    try {
      const url = await candidateDocumentsService.getEthnicDeclarationPreviewUrl(token, {
        signed: isSigned,
      })
      setPreviewUrl(url)
    } catch (err) {
      setFeedback(err.message || 'Erro ao abrir documento.')
      setPreviewOpen(false)
    }
  }

  function closePreview() {
    setPreviewOpen(false)
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl('')
    }
  }

  async function handleConfirmSign() {
    setSigning(true)
    setFeedback('')
    try {
      const result = await candidateDocumentsService.signEthnicDeclaration(token, {
        raceCategory,
        raceDescription,
        declarationAccepted: true,
        applicationId: state?.applicationId || undefined,
        returnUrl: buildSigningReturnUrl(),
      })
      setState(result.state)
      setConfirmOpen(false)
      setDeclarationAccepted(false)

      if (result.signingUrl && result.documentId) {
        setSigningUrl(result.signingUrl)
        setSignatureDocumentId(result.documentId)
        setSignatureOpen(true)
      }
    } catch (err) {
      setFeedback(err.message || 'Erro ao assinar documento.')
    } finally {
      setSigning(false)
    }
  }

  async function pollDocumentStatus() {
    if (!signatureDocumentId) return null
    const status = await documentsService.getStatus(token, signatureDocumentId)
    if (status?.isCompleted || status?.status === 'SIGNED') {
      await loadState()
      setPendingFinalize(false)
    } else if (status?.needsManualFinalize || status?.providerSigned) {
      setPendingFinalize(true)
    }
    return status
  }

  async function handleFinalizeDocument() {
    const documentId = state?.document?.id || signatureDocumentId
    if (!documentId) return

    setFinalizing(true)
    setFeedback('')
    try {
      const status = await documentsService.getStatus(token, documentId)
      if (status?.isCompleted || status?.status === 'SIGNED') {
        await loadState()
        setPendingFinalize(false)
        setSignatureOpen(false)
        setSigningUrl('')
      } else if (status?.needsManualFinalize) {
        setFeedback(
          status?.finalizeError
            || 'A assinatura foi detectada, mas não foi possível concluir agora. Tente novamente em instantes.',
        )
      } else {
        setFeedback('A assinatura ainda não foi concluída na DocuSign.')
      }
    } catch (err) {
      setFeedback(err.message || 'Erro ao finalizar documento.')
    } finally {
      setFinalizing(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-neutral-200 border-t-brand-red-600 animate-spin" />
      </div>
    )
  }

  return (
    <>
      <SeoHead title="Autodeclaração Étnico-Racial" noindex />

      <div className="mb-8">
        <Link
          to={ROUTES.CANDIDATE_PRE_ADMISSION}
          className="inline-flex items-center gap-2 text-sm font-medium text-brand-blue-600 hover:text-brand-blue-700 mb-4"
        >
          <ArrowLeft size={16} aria-hidden="true" />
          Voltar para documentação
        </Link>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Heading as="h1" level={3}>Autodeclaração Étnico-Racial</Heading>
            <Text size="sm" className="mt-2 max-w-2xl">
              Revise o documento, confirme seus dados e assine eletronicamente. O PDF será gerado automaticamente com suas informações — você só precisa assinar.
            </Text>
          </div>
          {state?.document && (
            <Badge variant={isSigned ? 'green' : 'amber'}>{state.document.statusLabel}</Badge>
          )}
        </div>
      </div>

      {isSigned && (
        <FadeIn>
          <div className="mb-8 rounded-2xl border border-emerald-200 bg-emerald-50/80 px-5 py-4 flex gap-3">
            <CheckCircle2 className="text-emerald-600 shrink-0 mt-0.5" size={20} />
            <div>
              <p className="font-medium text-emerald-900">Documento concluído</p>
              <p className="text-sm text-emerald-800 mt-1">
                Sua autodeclaração foi registrada e enviada ao checklist de documentação.
                {state.document.signedAt && (
                  <> Assinado em {new Date(state.document.signedAt).toLocaleString('pt-BR')}.</>
                )}
              </p>
            </div>
          </div>
        </FadeIn>
      )}

      {feedback && (
        <p className="mb-6 text-sm text-brand-red-600 bg-brand-red-50 rounded-xl px-4 py-3">{feedback}</p>
      )}

      {pendingFinalize && !isSigned && (
        <FadeIn>
          <div className="mb-8 rounded-2xl border border-amber-200 bg-amber-50/80 px-5 py-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-medium text-amber-900">Assinatura pendente de registro</p>
              <p className="text-sm text-amber-800 mt-1">
                Detectamos que este documento já foi assinado na DocuSign, mas o portal ainda não concluiu o processo.
                Clique em finalizar para registrar o PDF assinado.
              </p>
            </div>
            <Button
              size="sm"
              className="w-full sm:w-auto shrink-0"
              disabled={finalizing}
              onClick={handleFinalizeDocument}
            >
              {finalizing ? 'Finalizando...' : 'Finalizar documento'}
            </Button>
          </div>
        </FadeIn>
      )}

      <div className="space-y-6 md:space-y-8">
        <FadeIn>
          <Card className="shadow-sm">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-col sm:flex-row gap-5 sm:items-center">
                <div className="relative mx-auto sm:mx-0 w-[140px] shrink-0 overflow-hidden rounded-xl border border-neutral-200 bg-neutral-50 shadow-inner aspect-[3/4]">
                  {thumbnailUrl ? (
                    <iframe
                      title="Miniatura do documento"
                      src={thumbnailUrl}
                      className="pointer-events-none absolute left-0 top-0 h-[400%] w-[400%] origin-top-left scale-[0.25] bg-white"
                      tabIndex={-1}
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-brand-blue-300">
                      <FileText size={36} />
                    </div>
                  )}
                </div>
                <div className="text-center sm:text-left">
                  <p className="text-xs font-medium uppercase tracking-wide text-brand-blue-600">Documento</p>
                  <h2 className="font-display text-xl font-semibold text-neutral-900 mt-1">Visualização do documento</h2>
                  <Text size="sm" className="mt-2 max-w-md">
                    Consulte o modelo institucional antes de confirmar sua autodeclaração. O documento é exibido em modo leitura.
                  </Text>
                </div>
              </div>
              <Button variant="outline" onClick={openPreview} className="w-full sm:w-auto shrink-0">
                <Eye size={16} />
                Visualizar documento
              </Button>
            </div>
          </Card>
        </FadeIn>

        <FadeIn delay={0.05}>
          <Card className="shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-brand-blue-600">Etapa 1</p>
            <h2 className="font-display text-xl font-semibold text-neutral-900 mt-1">Confirmação dos dados</h2>
            <Text size="sm" className="mt-2 mb-6">
              Informações obtidas automaticamente do seu cadastro.
            </Text>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-8">
              <ReadOnlyField label="Nome" value={state?.candidate?.name} />
              <ReadOnlyField label="CPF" value={state?.candidate?.cpf} />
              <ReadOnlyField label="Cidade" value={state?.candidate?.city} />
              <ReadOnlyField label="Data" value={state?.candidate?.currentDate} />
            </div>
          </Card>
        </FadeIn>

        <FadeIn delay={0.1}>
          <Card className="shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-brand-blue-600">Etapa 2</p>
            <h2 className="font-display text-xl font-semibold text-neutral-900 mt-1">Como você se autodeclara?</h2>
            <Text size="sm" className="mt-2 mb-6">
              Selecione a opção que melhor representa sua autodeclaração.
            </Text>

            <RaceRadioGroup
              options={RACE_OPTIONS}
              value={raceCategory}
              onChange={setRaceCategory}
              disabled={!canEdit}
            />

            <div className="mt-8 pt-8 border-t border-neutral-100">
              <h3 className="font-display text-base font-semibold text-neutral-900">
                Complemento da Autodeclaração (Opcional)
              </h3>
              <Text size="sm" className="mt-2 mb-4">
                Caso deseje, utilize este espaço para complementar sua autodeclaração. Este campo não substitui a opção selecionada acima.
              </Text>
              <textarea
                value={raceDescription}
                onChange={(event) => setRaceDescription(event.target.value)}
                disabled={!canEdit}
                rows={4}
                maxLength={2000}
                placeholder={'Exemplos:\nPessoa quilombola\nPovo Xukuru\nPrefiro me identificar como...'}
                className={cn(
                  'w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3.5 text-sm text-neutral-900',
                  'placeholder:text-neutral-400 transition-colors',
                  'focus:border-brand-blue-400 focus:outline-none focus:ring-2 focus:ring-brand-blue-100',
                  'disabled:bg-neutral-50 disabled:text-neutral-500',
                )}
              />
            </div>
          </Card>
        </FadeIn>

        {canEdit && (
          <FadeIn delay={0.15}>
            <Card className="shadow-sm">
              <label className="flex items-start gap-4 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={declarationAccepted}
                  onChange={(event) => setDeclarationAccepted(event.target.checked)}
                  className="mt-1 h-5 w-5 shrink-0 rounded border-neutral-300 text-brand-blue-600 focus:ring-brand-blue-500"
                />
                <span className="text-sm leading-relaxed text-neutral-700 group-hover:text-neutral-900 transition-colors">
                  Declaro que as informações prestadas são verdadeiras e refletem minha autodeclaração.
                </span>
              </label>

              <div className="mt-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <Text size="sm" className="text-neutral-500">
                  Ao assinar, um PDF será gerado automaticamente com seus dados.
                </Text>
                <Button
                  size="lg"
                  disabled={!canSubmit}
                  onClick={() => setConfirmOpen(true)}
                  className="w-full sm:w-auto min-h-[48px]"
                >
                  Assinar documento
                </Button>
              </div>
            </Card>
          </FadeIn>
        )}

        {isSigned && (
          <FadeIn delay={0.15}>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button variant="outline" onClick={openPreview} className="w-full sm:w-auto">
                <Eye size={16} />
                Ver documento assinado
              </Button>
              <Link to={ROUTES.CANDIDATE_PRE_ADMISSION} className="w-full sm:w-auto">
                <Button variant="secondary" className="w-full">
                  Ir para documentação
                </Button>
              </Link>
            </div>
          </FadeIn>
        )}
      </div>

      <DocumentPreviewModal
        open={previewOpen}
        title={isSigned ? 'Autodeclaração assinada' : 'Modelo — Autodeclaração Étnico-Racial'}
        previewUrl={previewUrl}
        onClose={closePreview}
      />

      <ConfirmSignModal
        open={confirmOpen}
        loading={signing}
        onCancel={() => !signing && setConfirmOpen(false)}
        onConfirm={handleConfirmSign}
      />

      <SignatureModal
        open={signatureOpen}
        signingUrl={signingUrl}
        documentId={signatureDocumentId}
        title="Assinar Autodeclaração Étnico-Racial"
        onClose={() => {
          setSignatureOpen(false)
          setSigningUrl('')
        }}
        onCompleted={loadState}
        onStatusPoll={pollDocumentStatus}
      />
    </>
  )
}
