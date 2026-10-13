import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { FileSignature } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { signaturesService } from '@/services/signaturesService'
import { ApiError } from '@/services/api'

export function SignatureRequestPanel({
  candidateId,
  applicationId,
  documentation,
  canWrite = false,
  onRequested,
}) {
  const [feedback, setFeedback] = useState('')

  const { data: configData } = useQuery({
    queryKey: ['signatures-config'],
    queryFn: () => signaturesService.getConfig(),
    staleTime: 120_000,
  })

  const { data: signaturesData, refetch } = useQuery({
    queryKey: ['signatures', applicationId],
    queryFn: () => signaturesService.list({ applicationId }),
    enabled: Boolean(applicationId),
  })

  const autodeclaracaoItem = documentation?.items?.find((item) => item.slug === 'autodeclaracao')
  const existingSignature = signaturesData?.signatures?.find(
    (entry) => entry.documentType === 'autodeclaracao',
  )

  const requestMutation = useMutation({
    mutationFn: () =>
      signaturesService.request(candidateId, applicationId, 'autodeclaracao'),
    onSuccess: () => {
      setFeedback('Solicitação de assinatura enviada. O candidato verá no menu Assinaturas do portal.')
      refetch()
      onRequested?.()
    },
    onError: (err) => {
      setFeedback(err instanceof ApiError ? err.message : 'Erro ao solicitar assinatura.')
    },
  })

  if (!autodeclaracaoItem || !canWrite) return null

  const configured = configData?.configured !== false

  return (
    <div className="rounded-lg border border-indigo-200 bg-indigo-50/40 p-3 space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <FileSignature size={14} className="text-indigo-700" />
        <p className="text-xs font-medium text-indigo-900">Assinatura eletrônica (DocuSign)</p>
        {existingSignature && (
          <Badge variant="blue">{existingSignature.statusLabel}</Badge>
        )}
      </div>

      <p className="text-xs text-indigo-800/80">
        Solicite a assinatura da autodeclaração. O candidato assina pelo portal — o PDF assinado entra automaticamente no checklist.
      </p>

      {!configured && (
        <p className="text-xs text-amber-700">DocuSign não configurado no servidor (variáveis DOCUSIGN_*).</p>
      )}

      {feedback && (
        <p className="text-xs text-neutral-700 bg-white/80 rounded px-2 py-1">{feedback}</p>
      )}

      {existingSignature?.isCompleted ? (
        <p className="text-xs text-emerald-700 font-medium">Autodeclaração assinada e anexada ao checklist.</p>
      ) : (
        <Button
          size="sm"
          variant="secondary"
          disabled={!configured || requestMutation.isPending || existingSignature?.isCompleted}
          onClick={() => requestMutation.mutate()}
        >
          <FileSignature size={14} />
          {requestMutation.isPending ? 'Enviando...' : existingSignature ? 'Reenviar solicitação' : 'Solicitar assinatura'}
        </Button>
      )}
    </div>
  )
}
