import { useCallback, useEffect, useRef, useState } from 'react'
import { Loader2, X } from 'lucide-react'
import { Button } from '@/components/ui/Button/Button'
import { ROUTES } from '@/constants/routes'
import { cn } from '@/utils/cn'
import { DOCUSIGN_CANCEL_EVENTS, DOCUSIGN_COMPLETE_EVENTS } from '@/utils/signingReturnUrl'

const POLL_INTERVAL_MS = 10000
const STUCK_FALLBACK_MS = 12000

function isSigningReturnUrl(href) {
  if (!href) return false
  try {
    const url = new URL(href)
    return url.pathname.endsWith(ROUTES.CANDIDATE_SIGNING_RETURN)
  } catch {
    return href.includes('/assinatura/retorno')
  }
}

function shouldCompleteFromEvent(event) {
  if (!event) return true
  if (DOCUSIGN_CANCEL_EVENTS.has(event)) return false
  return DOCUSIGN_COMPLETE_EVENTS.has(event)
}

function isSignedStatus(result) {
  return Boolean(result?.isCompleted || result?.status === 'SIGNED')
}

function shouldOfferManualFinalize(result) {
  return Boolean(result?.needsManualFinalize || result?.providerSigned)
}

export function SignatureModal({
  open,
  signingUrl,
  documentId,
  title = 'Assinatura eletrônica',
  onClose,
  onCompleted,
  onStatusPoll,
}) {
  const iframeRef = useRef(null)
  const completingRef = useRef(false)
  const pollPausedRef = useRef(false)
  const [loading, setLoading] = useState(true)
  const [phase, setPhase] = useState('signing')
  const [showFinalizeButton, setShowFinalizeButton] = useState(false)
  const [finalizeError, setFinalizeError] = useState('')

  const handleComplete = useCallback(async () => {
    if (completingRef.current) return
    completingRef.current = true
    setPhase('finalizing')
    try {
      if (onStatusPoll) await onStatusPoll()
      onCompleted?.()
    } finally {
      completingRef.current = false
      onClose?.()
    }
  }, [onCompleted, onClose, onStatusPoll])

  const handleCancel = useCallback(() => {
    completingRef.current = false
    onClose?.()
  }, [onClose])

  const processPollResult = useCallback(
    async (result) => {
      if (!result) return

      if (result.providerSyncPaused) {
        pollPausedRef.current = true
        setShowFinalizeButton(true)
      }

      if (shouldOfferManualFinalize(result)) {
        setShowFinalizeButton(true)
      }

      if (isSignedStatus(result)) {
        await handleComplete()
      }
    },
    [handleComplete],
  )

  const runStatusPoll = useCallback(async () => {
    if (!onStatusPoll || completingRef.current) return null
    try {
      const result = await onStatusPoll()
      await processPollResult(result)
      return result
    } catch {
      return null
    }
  }, [onStatusPoll, processPollResult])

  const handleManualFinalize = useCallback(async () => {
    if (!onStatusPoll || completingRef.current) return

    completingRef.current = true
    setFinalizeError('')
    setPhase('finalizing')

    try {
      const result = await onStatusPoll()
      if (isSignedStatus(result)) {
        onCompleted?.()
        onClose?.()
      } else if (shouldOfferManualFinalize(result)) {
        setPhase('signing')
        setShowFinalizeButton(true)
        setFinalizeError(
          result?.finalizeError
            || 'A assinatura foi detectada, mas o registro ainda não concluiu. Tente novamente em instantes.',
        )
      } else {
        setPhase('signing')
        setFinalizeError('A assinatura ainda não foi detectada. Conclua na DocuSign e tente novamente.')
      }
    } catch (error) {
      setPhase('signing')
      setFinalizeError(error?.message || 'Erro ao finalizar documento.')
    } finally {
      completingRef.current = false
    }
  }, [onClose, onCompleted, onStatusPoll])

  const inspectIframeLocation = useCallback(() => {
    try {
      const href = iframeRef.current?.contentWindow?.location?.href
      if (!isSigningReturnUrl(href)) return

      const url = new URL(href)
      const event = url.searchParams.get('event')
      const iframeDocumentId = url.searchParams.get('documentId')

      if (documentId && iframeDocumentId && iframeDocumentId !== documentId) return

      if (event && DOCUSIGN_CANCEL_EVENTS.has(event)) {
        handleCancel()
        return
      }

      if (shouldCompleteFromEvent(event)) {
        handleComplete()
      }
    } catch {
      // iframe ainda em domínio DocuSign — origem cruzada
    }
  }, [documentId, handleCancel, handleComplete])

  useEffect(() => {
    if (!open) return undefined

    function onMessage(event) {
      if (event.origin !== window.location.origin) return
      if (event.data?.type !== 'FG_SIGNATURE_COMPLETE') return
      if (documentId && event.data.documentId && event.data.documentId !== documentId) return

      if (event.data.event && DOCUSIGN_CANCEL_EVENTS.has(event.data.event)) {
        handleCancel()
        return
      }

      if (shouldCompleteFromEvent(event.data.event)) {
        handleComplete()
      }
    }

    window.addEventListener('message', onMessage)
    document.body.style.overflow = 'hidden'

    return () => {
      window.removeEventListener('message', onMessage)
      document.body.style.overflow = ''
    }
  }, [open, documentId, handleCancel, handleComplete])

  useEffect(() => {
    if (!open) {
      completingRef.current = false
      pollPausedRef.current = false
      return undefined
    }

    setLoading(true)
    setPhase('signing')
    setShowFinalizeButton(false)
    setFinalizeError('')

    if (!onStatusPoll) return undefined

    runStatusPoll()

    const interval = window.setInterval(() => {
      if (pollPausedRef.current) return
      runStatusPoll()
    }, POLL_INTERVAL_MS)

    const stuckTimer = window.setTimeout(() => {
      setShowFinalizeButton(true)
    }, STUCK_FALLBACK_MS)

    return () => {
      window.clearInterval(interval)
      window.clearTimeout(stuckTimer)
    }
  }, [open, signingUrl, onStatusPoll, runStatusPoll])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-neutral-900/60 backdrop-blur-sm" role="dialog" aria-modal="true">
      <header className="relative z-10 flex shrink-0 items-center justify-between gap-4 bg-white px-4 py-3 sm:px-6 border-b border-neutral-100 shadow-sm">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-brand-blue-600">DocuSign</p>
          <h2 className="font-display text-base sm:text-lg font-semibold text-neutral-900">{title}</h2>
        </div>
        <button
          type="button"
          onClick={handleCancel}
          disabled={phase === 'finalizing'}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full text-neutral-500 hover:bg-neutral-100"
          aria-label="Fechar"
        >
          <X size={20} />
        </button>
      </header>

      <div className="relative min-h-0 flex-1 bg-neutral-100 p-2 sm:p-4">
        {loading && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-white/80">
            <Loader2 className="h-8 w-8 animate-spin text-brand-red-600" />
            <p className="text-sm text-neutral-600">Carregando assinatura...</p>
          </div>
        )}

        {phase === 'finalizing' && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-white/90">
            <Loader2 className="h-8 w-8 animate-spin text-brand-blue-600" />
            <p className="text-sm text-neutral-700">Finalizando documento...</p>
          </div>
        )}

        {signingUrl ? (
          <iframe
            ref={iframeRef}
            title={title}
            src={signingUrl}
            className={cn('h-full w-full rounded-xl border border-neutral-200 bg-white shadow-lg')}
            allow="geolocation *; microphone *; camera *"
            onLoad={() => {
              setLoading(false)
              inspectIframeLocation()
            }}
          />
        ) : null}
      </div>

      <footer className="relative z-10 shrink-0 bg-white border-t border-neutral-100 px-4 py-3 sm:px-6 shadow-[0_-4px_12px_rgba(0,0,0,0.06)]">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {showFinalizeButton && phase === 'signing' ? (
            <div className="text-sm text-neutral-600">
              <p>Se você já concluiu a assinatura na DocuSign, clique em finalizar para registrar o documento.</p>
              {finalizeError ? <p className="mt-1 text-brand-red-600">{finalizeError}</p> : null}
            </div>
          ) : (
            <span className="hidden sm:block" />
          )}
          <div className="flex justify-end gap-2 shrink-0">
            {showFinalizeButton && phase === 'signing' ? (
              <Button size="sm" onClick={handleManualFinalize}>
                Finalizar documento
              </Button>
            ) : null}
            <Button variant="outline" size="sm" onClick={handleCancel} disabled={phase === 'finalizing'}>
              Cancelar
            </Button>
          </div>
        </div>
      </footer>
    </div>
  )
}
