import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { FileSignature, CheckCircle2, AlertCircle, Eye } from 'lucide-react'
import { SeoHead } from '@/components/seo/SeoHead'
import { Heading } from '@/components/ui/Heading/Heading'
import { Text } from '@/components/ui/Text/Text'
import { Badge } from '@/components/ui/Badge/Badge'
import { Button } from '@/components/ui/Button/Button'
import { useAuth } from '@/context/AuthContext'
import { signaturesService } from '@/services/signaturesService'
import { candidateDocumentsService } from '@/services/candidateDocumentsService'
import { ROUTES } from '@/constants/routes'

const STATUS_VARIANT = {
  COMPLETED: 'green',
  SIGNED: 'green',
  DECLINED: 'red',
  VOIDED: 'default',
  ERROR: 'red',
}

function isEthnicDeclarationItem(item) {
  return (
    item.source === 'candidate_document' ||
    item.source === 'candidate_document_pending' ||
    item.documentType === 'autodeclaracao'
  )
}

export function CandidateSignaturesPage() {
  const { token } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [signatures, setSignatures] = useState([])
  const [configured, setConfigured] = useState(true)
  const [loading, setLoading] = useState(true)
  const [feedback, setFeedback] = useState('')
  const [startingId, setStartingId] = useState(null)
  const [openingPdf, setOpeningPdf] = useState(false)

  const completedId = searchParams.get('completed')
  const event = searchParams.get('event')

  async function loadSignatures() {
    setLoading(true)
    try {
      const [configData, listData] = await Promise.all([
        signaturesService.getConfig(),
        signaturesService.list(token),
      ])
      setConfigured(configData.configured !== false)
      setSignatures(listData.signatures || [])

      if (completedId && !completedId.startsWith('pending-ethnic-')) {
        await signaturesService.refresh(token, completedId)
        const refreshed = await signaturesService.list(token)
        setSignatures(refreshed.signatures || [])
      }
    } catch {
      setFeedback('Erro ao carregar assinaturas.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSignatures()
  }, [token, completedId])

  async function handleSign(item) {
    setFeedback('')
    setStartingId(item.id)

    try {
      if (isEthnicDeclarationItem(item)) {
        navigate(item.portalRoute || ROUTES.CANDIDATE_ETHNIC_DECLARATION)
        return
      }

      const returnUrl = `${window.location.origin}/portal-do-candidato/assinaturas?completed=${item.id}`
      const data = await signaturesService.getSigningUrl(token, item.id, returnUrl)
      navigate(`/portal-do-candidato/assinaturas/${item.id}/assinar`, {
        state: { signingUrl: data.signingUrl },
      })
    } catch (err) {
      setFeedback(err.message || 'Erro ao iniciar assinatura.')
    } finally {
      setStartingId(null)
    }
  }

  async function handleViewSignedPdf() {
    setOpeningPdf(true)
    setFeedback('')
    try {
      const url = await candidateDocumentsService.getEthnicDeclarationPreviewUrl(token, { signed: true })
      window.open(url, '_blank', 'noopener,noreferrer')
      setTimeout(() => URL.revokeObjectURL(url), 60_000)
    } catch (err) {
      setFeedback(err.message || 'Erro ao abrir documento assinado.')
    } finally {
      setOpeningPdf(false)
    }
  }

  const pendingSignatures = signatures.filter((item) => item.canSign)
  const completedSignatures = signatures.filter((item) => item.isCompleted)

  if (loading) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-neutral-200 border-t-brand-red-600 animate-spin" />
      </div>
    )
  }

  return (
    <>
      <SeoHead title="Assinaturas" noindex />

      <Heading as="h1" level={3}>Assinaturas eletrônicas</Heading>
      <Text className="mt-2">
        Assine documentos solicitados pelo RH de forma segura via DocuSign, diretamente pelo portal.
      </Text>

      {event === 'signing_complete' || completedId ? (
        <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 flex gap-2">
          <CheckCircle2 size={18} className="shrink-0 mt-0.5" />
          Assinatura processada. Se o status não atualizar, aguarde alguns segundos e recarregue a página.
        </div>
      ) : null}

      {feedback && (
        <p className="mt-4 text-sm text-brand-red-600 bg-brand-red-50 rounded-xl px-4 py-3">{feedback}</p>
      )}

      {!configured && pendingSignatures.some((item) => !isEthnicDeclarationItem(item)) && (
        <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 flex gap-2">
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          Assinatura eletrônica temporariamente indisponível. Entre em contato com o RH se precisar assinar documentos.
        </div>
      )}

      {!signatures.length ? (
        <div className="mt-10 rounded-2xl border border-dashed border-brand-blue-200 bg-white p-10 text-center">
          <FileSignature className="mx-auto text-brand-blue-300 mb-3" size={32} />
          <Text size="sm">Nenhum documento pendente de assinatura.</Text>
          <Text size="sm" className="mt-2 text-neutral-500">
            Quando o RH solicitar a assinatura de um documento, ele aparecerá aqui.
          </Text>
          <Link to={ROUTES.CANDIDATE_PORTAL} className="inline-block mt-4">
            <Button variant="outline" size="sm">Voltar ao portal</Button>
          </Link>
        </div>
      ) : (
        <div className="mt-10 space-y-8">
          {pendingSignatures.length > 0 && (
            <section className="space-y-4">
              <h2 className="font-display text-lg font-semibold text-neutral-900">Pendentes</h2>
              {pendingSignatures.map((item) => (
                <SignatureCard
                  key={item.id}
                  item={item}
                  configured={configured}
                  startingId={startingId}
                  onSign={handleSign}
                />
              ))}
            </section>
          )}

          {completedSignatures.length > 0 && (
            <section className="space-y-4">
              <h2 className="font-display text-lg font-semibold text-neutral-900">Concluídos</h2>
              {completedSignatures.map((item) => (
                <SignatureCard
                  key={item.id}
                  item={item}
                  configured={configured}
                  startingId={startingId}
                  openingPdf={openingPdf}
                  onSign={handleSign}
                  onViewSignedPdf={isEthnicDeclarationItem(item) ? handleViewSignedPdf : null}
                />
              ))}
            </section>
          )}
        </div>
      )}
    </>
  )
}

function SignatureCard({
  item,
  configured,
  startingId,
  openingPdf = false,
  onSign,
  onViewSignedPdf = null,
}) {
  const canUseDocuSign = configured || isEthnicDeclarationItem(item)

  return (
    <section className="rounded-2xl border border-brand-blue-100 bg-white p-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-display text-lg font-semibold text-neutral-900">{item.documentLabel}</h3>
            <Badge variant={STATUS_VARIANT[item.status] || 'amber'}>{item.statusLabel}</Badge>
          </div>
          <Text size="sm" className="mt-1">Vaga: {item.jobTitle}</Text>
          {item.completedAt && (
            <Text size="sm" className="mt-1 text-neutral-500">
              Concluído em {new Date(item.completedAt).toLocaleString('pt-BR')}
            </Text>
          )}
          {item.errorMessage && (
            <p className="text-xs text-brand-red-600 mt-2">{item.errorMessage}</p>
          )}
        </div>

        <div className="flex flex-wrap gap-2 shrink-0">
          {item.canSign && canUseDocuSign && (
            <Button
              size="sm"
              disabled={startingId === item.id}
              onClick={() => onSign(item)}
            >
              <FileSignature size={14} />
              {startingId === item.id ? 'Abrindo...' : 'Assinar documento'}
            </Button>
          )}

          {item.isCompleted && onViewSignedPdf && (
            <Button size="sm" variant="outline" disabled={openingPdf} onClick={onViewSignedPdf}>
              <Eye size={14} />
              {openingPdf ? 'Abrindo...' : 'Ver PDF assinado'}
            </Button>
          )}

          {item.isCompleted && !onViewSignedPdf && (
            <Link to={ROUTES.CANDIDATE_PRE_ADMISSION}>
              <Button variant="outline" size="sm">Ver documentação</Button>
            </Link>
          )}
        </div>
      </div>
    </section>
  )
}
