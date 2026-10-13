import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Briefcase, CheckCircle2, XCircle, X, FileCheck } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { candidatesService } from '@/services/candidatesService'
import { APPLICATION_STATUS_MAP, formatDate } from './candidateUtils'
import { ApplicationDocumentationChecklist } from './ApplicationDocumentationChecklist'
import { ApplicationStageControl } from './ApplicationStageControl'
import { ApiError } from '@/services/api'

export function CandidateApplicationsContent({ candidate, canWrite = false, canMoveStage = false }) {
  const queryClient = useQueryClient()
  const [rejectingApp, setRejectingApp] = useState(null)
  const [rejectReason, setRejectReason] = useState('')
  const [feedback, setFeedback] = useState('')
  const [successLink, setSuccessLink] = useState(null)
  const [rejectedSuccess, setRejectedSuccess] = useState(false)
  const [stageFeedback, setStageFeedback] = useState('')

  const reviewMutation = useMutation({
    mutationFn: ({ applicationId, decision, reason }) =>
      candidatesService.reviewApplication(candidate.id, applicationId, decision, reason),
    onSuccess: (result, variables) => {
      setFeedback('')
      setRejectingApp(null)
      setRejectReason('')

      if (variables.decision === 'approved') {
        setRejectedSuccess(false)
        const app = result?.candidate?.applications?.find((item) => item.id === variables.applicationId)
        if (app?.preAdmissionCaseId) {
          setSuccessLink(`/departamento-pessoal/${app.preAdmissionCaseId}`)
        }
      } else {
        setSuccessLink(null)
        setRejectedSuccess(true)
      }

      queryClient.invalidateQueries({ queryKey: ['candidate-detail', candidate.id] })
      queryClient.invalidateQueries({ queryKey: ['candidate-timeline', candidate.id] })
      queryClient.invalidateQueries({ queryKey: ['candidates'] })
      queryClient.invalidateQueries({ queryKey: ['candidates-stats'] })
      queryClient.invalidateQueries({ queryKey: ['pre-admission'] })
      queryClient.invalidateQueries({ queryKey: ['pre-admission-stats'] })
      queryClient.invalidateQueries({ queryKey: ['hr-department'] })
      queryClient.invalidateQueries({ queryKey: ['hr-department-stats'] })
      queryClient.invalidateQueries({ queryKey: ['pipeline-board'] })
    },
    onError: (err) => {
      setFeedback(err instanceof ApiError ? err.message : 'Erro ao avaliar documentação.')
    },
  })

  if (!candidate.applications?.length) {
    return (
      <p className="text-sm text-neutral-500 flex items-center gap-1.5">
        <Briefcase size={14} />
        Nenhuma candidatura registrada.
      </p>
    )
  }

  return (
    <div className="space-y-4">
      {stageFeedback && (
        <p className="text-sm text-emerald-700 bg-emerald-50 rounded-lg px-3 py-2">{stageFeedback}</p>
      )}

      {feedback && (
        <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{feedback}</p>
      )}

      {successLink && (
        <p className="text-sm text-emerald-700 bg-emerald-50 rounded-lg px-3 py-2 flex flex-wrap items-center gap-2">
          Documentação aprovada. Candidato encaminhado ao Departamento Pessoal.
          <Link to={successLink} className="inline-flex items-center gap-1 font-medium text-[#003d7a] hover:underline">
            <FileCheck size={14} />
            Abrir no DP
          </Link>
        </p>
      )}

      {rejectedSuccess && (
        <p className="text-sm text-amber-800 bg-amber-50 rounded-lg px-3 py-2">
          Documentação devolvida à origem com o motivo informado. O relógio do RH continua até o dossiê ficar válido.
        </p>
      )}

      <ul className="space-y-3">
        {candidate.applications.map((app) => {
          const appStatus = APPLICATION_STATUS_MAP[app.status] || APPLICATION_STATUS_MAP.PENDING
          return (
            <li key={app.id} className="rounded-lg border border-neutral-200 p-4 bg-neutral-50/50">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-medium text-neutral-900">{app.jobTitle}</p>
                  <p className="text-xs text-neutral-500 mt-1">
                    Etapa: {app.currentStageLabel || app.currentStage} · {formatDate(app.createdAt)}
                  </p>
                  {app.rejectionReason && (
                    <p className="text-xs text-red-600 mt-2 bg-red-50 rounded px-2 py-1.5">
                      Motivo da reprovação: {app.rejectionReason}
                    </p>
                  )}
                </div>
                <Badge variant={appStatus.variant}>{appStatus.label}</Badge>
              </div>

              <ApplicationStageControl
                candidateId={candidate.id}
                application={app}
                canMove={canMoveStage}
                onMoved={() => {
                  setStageFeedback('Etapa atualizada com sucesso.')
                  setFeedback('')
                }}
                onError={(message) => {
                  setStageFeedback('')
                  setFeedback(message)
                }}
              />

              {canWrite && app.canReviewDocumentation && (
                <>
                  <ApplicationDocumentationChecklist
                    candidateId={candidate.id}
                    applicationId={app.id}
                    documentation={app.documentation}
                    canWrite={canWrite}
                  />
                  <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-neutral-200">
                    <p className="w-full text-xs text-neutral-600 mb-1">
                      Quando todos os documentos obrigatórios estiverem enviados, você pode aprovar tudo de uma vez ou revisar item a item antes:
                    </p>
                    <Button
                      size="sm"
                      onClick={() => reviewMutation.mutate({ applicationId: app.id, decision: 'approved' })}
                      disabled={reviewMutation.isPending || !app.canApproveDocumentation}
                      title={
                        !app.canApproveDocumentation
                          ? 'Aguarde o envio de todos os documentos obrigatórios'
                          : 'Aprova todos os documentos enviados e encaminha ao Departamento Pessoal'
                      }
                    >
                      <CheckCircle2 size={14} />
                      Aprovar toda documentação
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="text-red-600 border-red-200 hover:bg-red-50"
                      onClick={() => {
                        setRejectingApp(app)
                        setRejectReason('')
                        setFeedback('')
                      }}
                      disabled={reviewMutation.isPending}
                    >
                      <XCircle size={14} />
                      Devolver à origem
                    </Button>
                  </div>
                </>
              )}

              {app.inPreAdmission && app.preAdmissionCaseId && (
                <Link
                  to={
                    app.inHrDepartment
                      ? `/departamento-pessoal/${app.preAdmissionCaseId}`
                      : `/pre-admissao/${app.preAdmissionCaseId}`
                  }
                  className="inline-flex items-center gap-1 text-xs text-emerald-700 bg-emerald-50 rounded px-2 py-1.5 mt-3 hover:underline"
                >
                  <FileCheck size={12} />
                  {app.inHrDepartment ? 'Ver no Departamento Pessoal' : 'Ver pré-admissão'}
                </Link>
              )}

              {canMoveStage && (
                <p className="text-[11px] text-neutral-400 mt-3">
                  Gerencie o fluxo completo aqui — o Pipeline kanban é opcional para visão geral.
                </p>
              )}
            </li>
          )
        })}
      </ul>

      {rejectingApp && (
        <RejectDocumentationModal
          jobTitle={rejectingApp.jobTitle}
          reason={rejectReason}
          onReasonChange={setRejectReason}
          saving={reviewMutation.isPending}
          onClose={() => {
            setRejectingApp(null)
            setRejectReason('')
          }}
          onConfirm={() => {
            if (!rejectReason.trim()) return
            reviewMutation.mutate({
              applicationId: rejectingApp.id,
              decision: 'rejected',
              reason: rejectReason.trim(),
            })
          }}
        />
      )}
    </div>
  )
}

function RejectDocumentationModal({ jobTitle, reason, onReasonChange, saving, onClose, onConfirm }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-200">
          <h2 className="text-base font-semibold text-neutral-900">Devolver documentação à origem</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100"
            aria-label="Fechar"
          >
            <X size={18} />
          </button>
        </div>
        <div className="px-5 py-4 space-y-3">
          <p className="text-sm text-neutral-600">
            Informe o motivo da devolução para <strong>{jobTitle}</strong>. O caso volta para a unidade
            de origem e o relógio do RH não zera.
          </p>
          <textarea
            rows={4}
            value={reason}
            onChange={(e) => onReasonChange(e.target.value)}
            placeholder="Ex.: documentos ilegíveis, informações inconsistentes..."
            className="w-full text-sm border border-neutral-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#003d7a]/20 focus:border-[#003d7a]"
            autoFocus
          />
        </div>
        <div className="flex justify-end gap-2 px-5 py-4 border-t border-neutral-200">
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button
            className="bg-red-600 hover:bg-red-700 text-white"
            onClick={onConfirm}
            disabled={saving || !reason.trim()}
          >
            {saving ? 'Salvando...' : 'Devolver com motivo'}
          </Button>
        </div>
      </div>
    </div>
  )
}
