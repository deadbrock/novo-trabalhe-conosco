import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { CheckCircle2 } from 'lucide-react'
import { SeoHead } from '@/components/seo/SeoHead'
import { DOCUSIGN_CANCEL_EVENTS, DOCUSIGN_COMPLETE_EVENTS } from '@/utils/signingReturnUrl'

export function SigningReturnPage() {
  const [params] = useSearchParams()
  const documentId = params.get('documentId')
  const event = params.get('event')

  useEffect(() => {
    if (!window.parent || window.parent === window) return undefined

    const payload = {
      type: 'FG_SIGNATURE_COMPLETE',
      documentId,
      event,
    }
    const targetOrigin = window.location.origin

    function notifyParent() {
      window.parent.postMessage(payload, targetOrigin)
    }

    if (event && DOCUSIGN_CANCEL_EVENTS.has(event)) {
      notifyParent()
      return undefined
    }

    if (event && !DOCUSIGN_COMPLETE_EVENTS.has(event)) {
      return undefined
    }

    notifyParent()
    const interval = window.setInterval(notifyParent, 400)
    const timeout = window.setTimeout(() => window.clearInterval(interval), 6000)

    return () => {
      window.clearInterval(interval)
      window.clearTimeout(timeout)
    }
  }, [documentId, event])

  return (
    <>
      <SeoHead title="Assinatura concluída" noindex />
      <div className="min-h-screen flex flex-col items-center justify-center text-center px-6 bg-white">
        <CheckCircle2 className="text-emerald-600 mb-4" size={40} />
        <h1 className="font-display text-xl font-semibold text-neutral-900">Assinatura registrada</h1>
        <p className="mt-2 text-sm text-neutral-600 max-w-md">
          Você pode fechar esta janela. O portal será atualizado automaticamente.
        </p>
      </div>
    </>
  )
}
