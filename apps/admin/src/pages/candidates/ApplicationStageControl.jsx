import { useMemo } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowRight, GitBranch } from 'lucide-react'
import { pipelineService } from '@/services/pipelineService'
import { candidatesService } from '@/services/candidatesService'
import { Button } from '@/components/ui/Button'
import { ApiError } from '@/services/api'

const STAGE_COLORS = {
  blue: 'bg-blue-100 text-blue-800 border-blue-200',
  violet: 'bg-violet-100 text-violet-800 border-violet-200',
  cyan: 'bg-cyan-100 text-cyan-800 border-cyan-200',
  amber: 'bg-amber-100 text-amber-800 border-amber-200',
  orange: 'bg-orange-100 text-orange-800 border-orange-200',
  indigo: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  emerald: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  green: 'bg-green-100 text-green-800 border-green-200',
  slate: 'bg-neutral-100 text-neutral-700 border-neutral-200',
}

export function ApplicationStageControl({
  candidateId,
  application,
  canMove = false,
  onMoved,
  onError,
}) {
  const queryClient = useQueryClient()

  const { data: stagesData, isLoading } = useQuery({
    queryKey: ['pipeline-stages'],
    queryFn: () => pipelineService.getStages(),
    staleTime: 60_000,
  })

  const stages = useMemo(
    () => (stagesData?.stages || []).slice().sort((a, b) => a.sortOrder - b.sortOrder),
    [stagesData],
  )

  const currentStage = stages.find((stage) => stage.slug === application.currentStage)
  const currentIndex = stages.findIndex((stage) => stage.slug === application.currentStage)
  const nextStage = currentIndex >= 0 ? stages[currentIndex + 1] : null

  const isClosed = ['REJECTED', 'WITHDRAWN'].includes(application.status)
  const canChangeStage = canMove && !isClosed && stages.length > 0

  const moveMutation = useMutation({
    mutationFn: (stageSlug) =>
      candidatesService.moveApplicationStage(candidateId, application.id, stageSlug),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['candidate-detail', candidateId] })
      queryClient.invalidateQueries({ queryKey: ['candidate-timeline', candidateId] })
      queryClient.invalidateQueries({ queryKey: ['pipeline-board'] })
      queryClient.invalidateQueries({ queryKey: ['candidates'] })
      queryClient.invalidateQueries({ queryKey: ['interview-candidates'] })
      queryClient.invalidateQueries({ queryKey: ['interviews-stats'] })
      onMoved?.()
    },
    onError: (err) => {
      onError?.(err instanceof ApiError ? err.message : 'Erro ao mover etapa.')
    },
  })

  if (isLoading) {
    return <p className="text-xs text-neutral-400 mt-3">Carregando etapas...</p>
  }

  return (
    <div className="mt-4 pt-3 border-t border-neutral-200 space-y-3">
      <div className="flex items-center gap-2">
        <GitBranch size={14} className="text-neutral-500 shrink-0" />
        <p className="text-xs font-medium text-neutral-700">Fluxo de recrutamento</p>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {stages.map((stage) => {
          const isActive = stage.slug === application.currentStage
          const colorClass = STAGE_COLORS[stage.color] || STAGE_COLORS.slate
          return (
            <span
              key={stage.slug}
              className={`text-[10px] px-2 py-1 rounded-full border font-medium ${
                isActive ? colorClass : 'bg-white text-neutral-400 border-neutral-200'
              }`}
            >
              {stage.label}
            </span>
          )
        })}
      </div>

      {isClosed ? (
        <p className="text-xs text-neutral-500">
          Candidatura encerrada — não é possível alterar a etapa.
        </p>
      ) : (
        canChangeStage && (
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <label className="sr-only" htmlFor={`stage-${application.id}`}>
              Mover para etapa
            </label>
            <select
              id={`stage-${application.id}`}
              value={application.currentStage}
              disabled={moveMutation.isPending}
              onChange={(event) => {
                const stageSlug = event.target.value
                if (stageSlug && stageSlug !== application.currentStage) {
                  moveMutation.mutate(stageSlug)
                }
              }}
              className="h-9 px-3 text-sm border border-neutral-200 rounded-lg bg-white min-w-[200px] flex-1"
            >
              {stages.map((stage) => (
                <option key={stage.slug} value={stage.slug}>
                  {stage.label}
                </option>
              ))}
            </select>

            {nextStage && !currentStage?.isTerminal && (
              <Button
                size="sm"
                variant="secondary"
                disabled={moveMutation.isPending}
                onClick={() => moveMutation.mutate(nextStage.slug)}
              >
                <ArrowRight size={14} />
                Avançar para {nextStage.label}
              </Button>
            )}
          </div>
        )
      )}

      {!canMove && !isClosed && (
        <p className="text-xs text-neutral-500">
          Etapa atual: <strong>{currentStage?.label || application.currentStageLabel || application.currentStage}</strong>
        </p>
      )}
    </div>
  )
}
