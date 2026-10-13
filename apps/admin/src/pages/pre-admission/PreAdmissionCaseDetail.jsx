import { useRef, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft,
  CheckCircle2,
  Download,
  Eye,
  Send,
  Upload,
  XCircle,
  X,
} from 'lucide-react'
import { preAdmissionService, hrDepartmentService } from '@/services/preAdmissionService'
import {
  CHECKLIST_STATUS_MAP,
  PRE_ADMISSION_STATUS_MAP,
  formatDateTime,
} from './preAdmissionUtils'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { ApiError } from '@/services/api'
import { useAuth } from '@/context/AuthContext'
import { DocumentPreviewModal } from '@/components/DocumentPreviewModal'

export function PreAdmissionCaseDetail({
  preAdmissionCase,
  mode = 'pre-admission',
  backPath,
  backLabel,
}) {
  const queryClient = useQueryClient()
  const { hasPermission } = useAuth()
  const fileInputRef = useRef(null)
  const [uploadItemId, setUploadItemId] = useState(null)
  const [previewItem, setPreviewItem] = useState(null)
  const [rejectingItem, setRejectingItem] = useState(null)
  const [rejectReason, setRejectReason] = useState('')
  const [dpRejectOpen, setDpRejectOpen] = useState(false)
  const [dpRejectReason, setDpRejectReason] = useState('')
  const [dpNotes, setDpNotes] = useState(preAdmissionCase.dpNotes || '')
  const [feedback, setFeedback] = useState('')

  const canWritePreAdmission = hasPermission('pre_admission:write')
  const canWriteDp = hasPermission('hr_department:write')
  const statusInfo = PRE_ADMISSION_STATUS_MAP[preAdmissionCase.status] || PRE_ADMISSION_STATUS_MAP.PENDING_DOCS

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['pre-admission'] })
    queryClient.invalidateQueries({ queryKey: ['pre-admission-detail', preAdmissionCase.id] })
    queryClient.invalidateQueries({ queryKey: ['hr-department'] })
    queryClient.invalidateQueries({ queryKey: ['hr-department-detail', preAdmissionCase.id] })
    queryClient.invalidateQueries({ queryKey: ['dashboard'] })
  }

  const forwardMutation = useMutation({
    mutationFn: () => preAdmissionService.forwardToDp(preAdmissionCase.id),
    onSuccess: () => { setFeedback(''); invalidate() },
    onError: (err) => setFeedback(err instanceof ApiError ? err.message : 'Erro ao encaminhar.'),
  })

  const reviewItemMutation = useMutation({
    mutationFn: ({ itemId, decision, reason }) =>
      preAdmissionService.reviewItem(preAdmissionCase.id, itemId, decision, reason),
    onSuccess: () => {
      setFeedback('')
      setRejectingItem(null)
      setRejectReason('')
      invalidate()
    },
    onError: (err) => setFeedback(err instanceof ApiError ? err.message : 'Erro ao avaliar item.'),
  })

  const uploadMutation = useMutation({
    mutationFn: ({ itemId, file }) => preAdmissionService.uploadDocument(preAdmissionCase.id, itemId, file),
    onSuccess: () => { setFeedback(''); setUploadItemId(null); invalidate() },
    onError: (err) => setFeedback(err instanceof ApiError ? err.message : 'Erro ao enviar documento.'),
  })

  const dpReviewMutation = useMutation({
    mutationFn: ({ decision, reason }) =>
      hrDepartmentService.review(preAdmissionCase.id, decision, dpNotes, reason),
    onSuccess: () => {
      setFeedback('')
      setDpRejectOpen(false)
      setDpRejectReason('')
      invalidate()
    },
    onError: (err) => setFeedback(err instanceof ApiError ? err.message : 'Erro na avaliação do DP.'),
  })

  const hireMutation = useMutation({
    mutationFn: () => hrDepartmentService.hire(preAdmissionCase.id),
    onSuccess: () => { setFeedback(''); invalidate() },
    onError: (err) => setFeedback(err instanceof ApiError ? err.message : 'Erro ao contratar.'),
  })

  async function handleDownload(item) {
    setFeedback('')
    try {
      const service = mode === 'hr-department' ? hrDepartmentService : preAdmissionService
      await service.downloadDocument(preAdmissionCase.id, item.id, item.documentFileName || 'documento.pdf')
    } catch (err) {
      setFeedback(err instanceof ApiError ? err.message : 'Erro ao baixar documento.')
    }
  }

  const loadPreviewUrl = useCallback(
    () => hrDepartmentService.getDocumentPreviewUrl(preAdmissionCase.id, previewItem.id),
    [preAdmissionCase.id, previewItem?.id],
  )

  const handlePreviewDownload = useCallback(async () => {
    if (!previewItem) return
    setFeedback('')
    try {
      await hrDepartmentService.downloadDocument(
        preAdmissionCase.id,
        previewItem.id,
        previewItem.documentFileName || 'documento.pdf',
      )
    } catch (err) {
      setFeedback(err instanceof ApiError ? err.message : 'Erro ao baixar documento.')
    }
  }, [preAdmissionCase.id, previewItem])

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div className="space-y-3">
          <Link to={backPath} className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-800">
            <ArrowLeft size={16} />
            {backLabel}
          </Link>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{preAdmissionCase.candidateName}</h1>
            <p className="text-sm text-neutral-500 mt-1">{preAdmissionCase.jobTitle}</p>
            <div className="flex flex-wrap gap-2 mt-3">
              <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
              <Badge variant="default">
                {preAdmissionCase.progress.approvedRequired}/{preAdmissionCase.progress.totalRequired} docs aprovados
              </Badge>
            </div>
          </div>
        </div>

        {mode === 'pre-admission' && canWritePreAdmission && preAdmissionCase.canForwardToDp && (
          <Button onClick={() => forwardMutation.mutate()} disabled={forwardMutation.isPending}>
            <Send size={16} />
            Encaminhar ao DP
          </Button>
        )}

        {mode === 'hr-department' && canWriteDp && preAdmissionCase.status === 'FORWARDED_TO_DP' && (
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => dpReviewMutation.mutate({ decision: 'approved' })} disabled={dpReviewMutation.isPending}>
              <CheckCircle2 size={16} />
              Aprovar admissão
            </Button>
            <Button variant="secondary" className="text-amber-700" onClick={() => setDpRejectOpen(true)}>
              <XCircle size={16} />
              Devolver ao RH
            </Button>
          </div>
        )}

        {mode === 'hr-department' && canWriteDp && ['APPROVED', 'FORWARDED_TO_DP'].includes(preAdmissionCase.status) && (
          <Button onClick={() => hireMutation.mutate()} disabled={hireMutation.isPending}>
            <CheckCircle2 size={16} />
            Admissão concluída
          </Button>
        )}
      </div>

      {feedback && (
        <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{feedback}</p>
      )}

      {preAdmissionCase.rejectionReason && (
        <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
          Motivo da reprovação: {preAdmissionCase.rejectionReason}
        </p>
      )}

      {(preAdmissionCase.origin?.unitName || preAdmissionCase.sla?.rhClock || preAdmissionCase.sla?.dpClock) && (
        <div className="rounded-lg border border-neutral-200 p-4 bg-neutral-50/60 text-sm space-y-1">
          {preAdmissionCase.origin?.unitName && (
            <p>
              <span className="font-medium text-neutral-800">Origem: </span>
              {preAdmissionCase.origin.unitName}
              {preAdmissionCase.origin.stateCode ? ` · ${preAdmissionCase.origin.stateCode}` : ''}
            </p>
          )}
          {preAdmissionCase.sla?.rhClock && (
            <p className="text-neutral-600">
              Relógio RH: {preAdmissionCase.sla.rhClock.elapsedDays}d ({preAdmissionCase.sla.rhClock.status})
            </p>
          )}
          {preAdmissionCase.sla?.dpClock && (
            <p className="text-neutral-600">
              Relógio DP: {preAdmissionCase.sla.dpClock.elapsedDays}d ({preAdmissionCase.sla.dpClock.status})
            </p>
          )}
          {preAdmissionCase.origin?.returnedReason && (
            <p className="text-red-700">Devolvido: {preAdmissionCase.origin.returnedReason}</p>
          )}
        </div>
      )}

      {mode === 'hr-department' && (
        <div className="rounded-lg border border-neutral-200 p-4 bg-neutral-50/60 space-y-2">
          <label htmlFor="dp-notes" className="text-sm font-medium text-neutral-800">Observações do DP</label>
          <textarea
            id="dp-notes"
            rows={3}
            value={dpNotes}
            onChange={(e) => setDpNotes(e.target.value)}
            disabled={!canWriteDp || !['FORWARDED_TO_DP', 'APPROVED'].includes(preAdmissionCase.status)}
            className="w-full text-sm border border-neutral-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#003d7a]/20"
            placeholder="Registre observações internas do Departamento Pessoal..."
          />
        </div>
      )}

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-neutral-800">Checklist documental</h2>
        {preAdmissionCase.usesLinkedDocumentation && (
          <p className="text-xs text-neutral-500 bg-neutral-50 rounded-lg px-3 py-2">
            Documentos recebidos e aprovados na etapa Documentação — prontos para encaminhamento ao DP.
          </p>
        )}
        <ul className="space-y-3">
          {preAdmissionCase.items.map((item) => {
            const itemStatus = CHECKLIST_STATUS_MAP[item.status] || CHECKLIST_STATUS_MAP.PENDING
            return (
              <li key={item.id} className="rounded-lg border border-neutral-200 p-4 bg-white">
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-neutral-900">{item.label}</p>
                      {item.required ? (
                        <Badge variant="amber">Obrigatório</Badge>
                      ) : (
                        <Badge variant="default">Se aplicável</Badge>
                      )}
                      <Badge variant={itemStatus.variant}>{itemStatus.label}</Badge>
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
                      <p className="text-xs text-neutral-600 mt-2">{item.documentFileName}</p>
                    )}
                    {item.rejectionReason && (
                      <p className="text-xs text-red-600 mt-1">Motivo: {item.rejectionReason}</p>
                    )}
                    {item.reviewedAt && (
                      <p className="text-xs text-neutral-400 mt-1">
                        Revisado em {formatDateTime(item.reviewedAt)}
                        {item.reviewedByName ? ` · ${item.reviewedByName}` : ''}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2 shrink-0">
                    {item.documentId && mode === 'hr-department' && (
                      <>
                        <Button variant="secondary" size="sm" onClick={() => setPreviewItem(item)}>
                          <Eye size={14} />
                          Visualizar
                        </Button>
                        <Button variant="secondary" size="sm" onClick={() => handleDownload(item)}>
                          <Download size={14} />
                          Baixar
                        </Button>
                      </>
                    )}

                    {item.documentId && mode !== 'hr-department' && (
                      <Button variant="secondary" size="sm" onClick={() => handleDownload(item)}>
                        <Download size={14} />
                        Baixar
                      </Button>
                    )}

                    {mode === 'pre-admission' && canWritePreAdmission &&
                      ['PENDING_DOCS', 'UNDER_REVIEW'].includes(preAdmissionCase.status) && (
                      <>
                        {(item.status === 'PENDING' || item.status === 'REJECTED') && (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => {
                              setUploadItemId(item.id)
                              fileInputRef.current?.click()
                            }}
                            disabled={uploadMutation.isPending}
                          >
                            <Upload size={14} />
                            Enviar (RH)
                          </Button>
                        )}
                        {item.status === 'UPLOADED' && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => reviewItemMutation.mutate({ itemId: item.id, decision: 'approved' })}
                              disabled={reviewItemMutation.isPending}
                            >
                              <CheckCircle2 size={14} />
                              Aprovar
                            </Button>
                            <Button
                              variant="secondary"
                              size="sm"
                              className="text-red-600"
                              onClick={() => { setRejectingItem(item); setRejectReason('') }}
                            >
                              <XCircle size={14} />
                              Reprovar
                            </Button>
                          </>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      </section>

      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.doc,.docx"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0]
          if (file && uploadItemId) {
            uploadMutation.mutate({ itemId: uploadItemId, file })
          }
          event.target.value = ''
        }}
      />

      {previewItem && mode === 'hr-department' && (
        <DocumentPreviewModal
          item={previewItem}
          onClose={() => setPreviewItem(null)}
          loadPreviewUrl={loadPreviewUrl}
          onDownload={handlePreviewDownload}
        />
      )}

      {rejectingItem && (
        <Modal
          title="Reprovar documento"
          onClose={() => { setRejectingItem(null); setRejectReason('') }}
          confirmLabel="Confirmar reprovação"
          confirmDisabled={!rejectReason.trim() || reviewItemMutation.isPending}
          onConfirm={() => reviewItemMutation.mutate({
            itemId: rejectingItem.id,
            decision: 'rejected',
            reason: rejectReason.trim(),
          })}
        >
          <p className="text-sm text-neutral-600 mb-3">
            Informe o motivo da reprovação de <strong>{rejectingItem.label}</strong>.
          </p>
          <textarea
            rows={4}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            className="w-full text-sm border border-neutral-200 rounded-lg px-3 py-2"
            autoFocus
          />
        </Modal>
      )}

      {dpRejectOpen && (
        <Modal
          title="Devolver ao RH"
          onClose={() => { setDpRejectOpen(false); setDpRejectReason('') }}
          confirmLabel="Devolver com motivo"
          confirmClass="bg-amber-600 hover:bg-amber-700 text-white"
          confirmDisabled={!dpRejectReason.trim() || dpReviewMutation.isPending}
          onConfirm={() => dpReviewMutation.mutate({ decision: 'returned', reason: dpRejectReason.trim() })}
        >
          <p className="text-sm text-neutral-600 mb-3">
            Informe o motivo. O caso volta ao RH, o relógio do DP pausa e o do RH continua.
          </p>
          <textarea
            rows={4}
            value={dpRejectReason}
            onChange={(e) => setDpRejectReason(e.target.value)}
            className="w-full text-sm border border-neutral-200 rounded-lg px-3 py-2"
            autoFocus
          />
        </Modal>
      )}
    </div>
  )
}

function Modal({
  title,
  children,
  onClose,
  onConfirm,
  confirmLabel,
  confirmDisabled,
  confirmClass,
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-200">
          <h2 className="text-base font-semibold">{title}</h2>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg text-neutral-400 hover:bg-neutral-100">
            <X size={18} />
          </button>
        </div>
        <div className="px-5 py-4">{children}</div>
        <div className="flex justify-end gap-2 px-5 py-4 border-t border-neutral-200">
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button className={confirmClass} onClick={onConfirm} disabled={confirmDisabled}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}
