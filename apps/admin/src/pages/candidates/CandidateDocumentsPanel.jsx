import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { FileText, Download, History, ShieldCheck } from 'lucide-react'
import { adminDocumentsService } from '@/services/adminDocumentsService'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'

const STATUS_VARIANT = {
  SIGNED: 'green',
  PENDING: 'default',
  SENT: 'blue',
  DELIVERED: 'blue',
  VIEWED: 'blue',
  DECLINED: 'red',
  VOIDED: 'default',
  ERROR: 'red',
}

function formatDateTime(value) {
  if (!value) return '—'
  return new Date(value).toLocaleString('pt-BR')
}

function DocumentTimeline({ documentId, open, onToggle }) {
  const { data, isLoading } = useQuery({
    queryKey: ['document-timeline', documentId],
    queryFn: () => adminDocumentsService.getTimeline(documentId),
    enabled: open && Boolean(documentId),
  })

  if (!open) return null

  if (isLoading) {
    return <p className="text-xs text-neutral-500 py-2">Carregando histórico...</p>
  }

  const timeline = data?.timeline || []

  return (
    <ol className="mt-3 space-y-3 border-l border-indigo-200 pl-4">
      {timeline.map((entry) => (
        <li key={entry.id} className="relative">
          <span className="absolute -left-[1.35rem] top-1.5 h-2 w-2 rounded-full bg-indigo-500" />
          <p className="text-sm font-medium text-neutral-900">{entry.label}</p>
          <p className="text-xs text-neutral-500">{formatDateTime(entry.createdAt)}</p>
        </li>
      ))}
      {!timeline.length && (
        <li className="text-xs text-neutral-500">Nenhum evento registrado.</li>
      )}
    </ol>
  )
}

export function CandidateDocumentsPanel({ candidateId }) {
  const [expandedId, setExpandedId] = useState(null)
  const [downloading, setDownloading] = useState(null)

  const { data, isLoading } = useQuery({
    queryKey: ['candidate-documents', candidateId],
    queryFn: () => adminDocumentsService.list(candidateId),
    enabled: Boolean(candidateId),
  })

  const documents = data?.documents || []

  async function handleDownload(documentId, type, fileName) {
    setDownloading(`${documentId}-${type}`)
    try {
      if (type === 'certificate') {
        await adminDocumentsService.downloadCertificate(documentId, fileName)
      } else {
        await adminDocumentsService.downloadPdf(documentId, fileName)
      }
    } finally {
      setDownloading(null)
    }
  }

  return (
    <section className="rounded-xl border border-neutral-200 bg-white p-5 space-y-4">
      <div className="flex items-center gap-2">
        <FileText size={18} className="text-indigo-700" />
        <h3 className="font-semibold text-neutral-900">Documentos</h3>
      </div>

      {isLoading ? (
        <p className="text-sm text-neutral-500">Carregando documentos...</p>
      ) : !documents.length ? (
        <p className="text-sm text-neutral-500">Nenhum documento eletrônico registrado.</p>
      ) : (
        <ul className="space-y-4">
          {documents.map((doc) => {
            const isOpen = expandedId === doc.id
            const baseName = doc.documentLabel?.toLowerCase().replace(/\s+/g, '_') || 'documento'

            return (
              <li key={doc.id} className="rounded-lg border border-neutral-100 p-4 space-y-3">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-neutral-900">{doc.documentLabel}</p>
                      <Badge variant={STATUS_VARIANT[doc.status] || 'default'}>{doc.statusLabel}</Badge>
                    </div>
                    <p className="text-xs text-neutral-500 mt-1">
                      Tipo: {doc.documentType} · Provider: {doc.provider || '—'}
                    </p>
                    <p className="text-xs text-neutral-500">
                      Criado: {formatDateTime(doc.createdAt)}
                      {doc.signedAt ? ` · Assinado: ${formatDateTime(doc.signedAt)}` : ''}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {doc.isCompleted && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={downloading === `${doc.id}-pdf`}
                          onClick={() => handleDownload(doc.id, 'pdf', `${baseName}.pdf`)}
                        >
                          <Download size={14} />
                          PDF
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={downloading === `${doc.id}-certificate`}
                          onClick={() => handleDownload(doc.id, 'certificate', `${baseName}_certificado.pdf`)}
                        >
                          <ShieldCheck size={14} />
                          Certificado
                        </Button>
                      </>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setExpandedId(isOpen ? null : doc.id)}
                    >
                      <History size={14} />
                      Histórico
                    </Button>
                  </div>
                </div>

                <DocumentTimeline documentId={doc.id} open={isOpen} onToggle={() => setExpandedId(doc.id)} />
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
