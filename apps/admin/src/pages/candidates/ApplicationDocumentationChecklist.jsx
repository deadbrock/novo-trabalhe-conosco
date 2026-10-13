import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { CheckCircle2, Download, Eye, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { candidatesService } from '@/services/candidatesService'
import { ApiError } from '@/services/api'
import { SignatureRequestPanel } from './SignatureRequestPanel'
import { DocumentationItemPreviewModal } from './DocumentationItemPreviewModal'

const ITEM_STATUS = {
  PENDING: { label: 'Pendente', variant: 'default' },
  UPLOADED: { label: 'Enviado', variant: 'blue' },
  APPROVED: { label: 'Aprovado', variant: 'green' },
  REJECTED: { label: 'Reprovado', variant: 'red' },
}

export function ApplicationDocumentationChecklist({
  candidateId,
  applicationId,
  documentation,
  canWrite = false,
}) {
  const queryClient = useQueryClient()
  const [rejectingItem, setRejectingItem] = useState(null)
  const [previewItem, setPreviewItem] = useState(null)
  const [rejectReason, setRejectReason] = useState('')
  const [feedback, setFeedback] = useState('')

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['candidate-detail', candidateId] })
    queryClient.invalidateQueries({ queryKey: ['admin-notifications'] })
  }

  const reviewMutation = useMutation({
    mutationFn: ({ itemId, decision, reason }) =>
      candidatesService.reviewDocumentationItem(candidateId, applicationId, itemId, decision, reason),
    onSuccess: () => {
      setFeedback('')
      setRejectingItem(null)
      setRejectReason('')
      invalidate()
    },
    onError: (err) => setFeedback(err instanceof ApiError ? err.message : 'Erro ao avaliar documento.'),
  })

  if (!documentation?.items?.length) {
    return (
      <p className="text-xs text-neutral-500 mt-3">
        Aguardando abertura do checklist de documentação.
      </p>
    )
  }

  return (
    <div className="mt-4 pt-3 border-t border-neutral-200 space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-xs font-medium text-neutral-700">Checklist documental</p>
        <Badge variant="default">
          {documentation.progress.approvedRequired}/{documentation.progress.totalRequired} aprovados
        </Badge>
      </div>

      <p className="text-xs text-neutral-500 bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2">
        O candidato envia os documentos pelo portal. Para a autodeclaração, use assinatura DocuSign ou aguarde upload manual.
      </p>

      <SignatureRequestPanel
        candidateId={candidateId}
        applicationId={applicationId}
        documentation={documentation}
        canWrite={canWrite}
        onRequested={invalidate}
      />

      {feedback && (
        <p className="text-xs text-red-600 bg-red-50 rounded px-2 py-1.5">{feedback}</p>
      )}

      <ul className="space-y-2">
        {documentation.items.map((item) => {
          const status = ITEM_STATUS[item.status] || ITEM_STATUS.PENDING
          return (
            <li key={item.id} className="rounded-lg border border-neutral-200 bg-white p-3">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium text-neutral-900">{item.label}</p>
                    <Badge variant={status.variant}>{status.label}</Badge>
                    {!item.required && (
                      <Badge variant="default">Se aplicável</Badge>
                    )}
                  </div>
                  {item.description && (
                    <p className="text-xs text-neutral-500 mt-1">{item.description}</p>
                  )}
                  {item.helpUrl && (
                    <a
                      href={item.helpUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-blue-600 hover:underline mt-1 inline-block"
                    >
                      Acessar site para emissão →
                    </a>
                  )}
                  {item.documentFileName && (
                    <p className="text-xs text-neutral-600 mt-1">{item.documentFileName}</p>
                  )}
                  {item.rejectionReason && (
                    <p className="text-xs text-red-600 mt-1">Motivo enviado ao candidato: {item.rejectionReason}</p>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 shrink-0">
                  {item.documentId && (
                    <>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setPreviewItem(item)}
                      >
                        <Eye size={14} />
                        Visualizar
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() =>
                          candidatesService.downloadDocumentationItem(
                            candidateId,
                            applicationId,
                            item.id,
                            item.documentFileName || 'documento.pdf',
                          )
                        }
                      >
                        <Download size={14} />
                        Baixar
                      </Button>
                    </>
                  )}

                  {canWrite && item.status === 'UPLOADED' && (
                    <>
                      <Button
                        size="sm"
                        disabled={reviewMutation.isPending}
                        onClick={() =>
                          reviewMutation.mutate({ itemId: item.id, decision: 'approved' })
                        }
                      >
                        <CheckCircle2 size={14} />
                        Aprovar
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        className="text-red-600"
                        onClick={() => {
                          setRejectingItem(item)
                          setRejectReason('')
                        }}
                      >
                        <XCircle size={14} />
                        Reprovar
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </li>
          )
        })}
      </ul>

      {previewItem && (
        <DocumentationItemPreviewModal
          candidateId={candidateId}
          applicationId={applicationId}
          item={previewItem}
          onClose={() => setPreviewItem(null)}
        />
      )}

      {rejectingItem && (
        <div className="rounded-lg border border-red-200 bg-red-50/50 p-3 space-y-2">
          <p className="text-xs text-neutral-700">
            Motivo da reprovação — <strong>{rejectingItem.label}</strong>
          </p>
          <p className="text-[11px] text-neutral-500">
            Este motivo será exibido ao candidato no portal para que ele reenvie o documento corrigido.
          </p>
          <textarea
            rows={2}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            className="w-full text-sm border border-neutral-200 rounded-lg px-3 py-2"
            placeholder="Ex.: documento ilegível, foto escura, arquivo incorreto..."
          />
          <div className="flex gap-2">
            <Button
              size="sm"
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={!rejectReason.trim() || reviewMutation.isPending}
              onClick={() =>
                reviewMutation.mutate({
                  itemId: rejectingItem.id,
                  decision: 'rejected',
                  reason: rejectReason.trim(),
                })
              }
            >
              Confirmar reprovação
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setRejectingItem(null)}>
              Cancelar
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
