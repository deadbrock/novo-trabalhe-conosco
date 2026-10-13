import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Search, Settings2, RefreshCw } from 'lucide-react'
import { pipelineService } from '@/services/pipelineService'
import { jobsService } from '@/services/jobsService'
import { KanbanBoard } from './KanbanBoard'
import { StageSettingsModal } from './StageSettingsModal'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { ApiError } from '@/services/api'
import { useAuth } from '@/context/AuthContext'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'

export function PipelinePage() {
  const { hasPermission } = useAuth()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search, 300)
  const [jobId, setJobId] = useState('')
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [movingId, setMovingId] = useState(null)
  const [feedback, setFeedback] = useState('')

  const canWrite = hasPermission('pipeline:write')

  const { data: jobsData } = useQuery({
    queryKey: ['admin-jobs-pipeline'],
    queryFn: () => jobsService.list({ status: 'PUBLISHED' }),
    staleTime: 120_000,
  })

  const { data, isLoading, isFetching, refetch, error } = useQuery({
    queryKey: ['pipeline-board', debouncedSearch, jobId],
    queryFn: () =>
      pipelineService.getBoard({
        search: debouncedSearch || undefined,
        jobId: jobId || undefined,
      }),
  })

  const { data: stagesConfigData } = useQuery({
    queryKey: ['pipeline-stages-config'],
    queryFn: () => pipelineService.getStagesConfig(),
    enabled: settingsOpen && canWrite,
  })

  const moveMutation = useMutation({
    mutationFn: ({ applicationId, stageSlug }) =>
      pipelineService.moveApplication(applicationId, stageSlug),
    onMutate: ({ applicationId }) => setMovingId(applicationId),
    onSuccess: () => {
      setFeedback('')
      queryClient.invalidateQueries({ queryKey: ['pipeline-board'] })
    },
    onError: (err) => {
      setFeedback(err instanceof ApiError ? err.message : 'Erro ao mover candidato.')
    },
    onSettled: () => setMovingId(null),
  })

  const saveStagesMutation = useMutation({
    mutationFn: (stages) => pipelineService.updateStages(stages),
    onSuccess: () => {
      setSettingsOpen(false)
      queryClient.invalidateQueries({ queryKey: ['pipeline-board'] })
      queryClient.invalidateQueries({ queryKey: ['pipeline-stages-config'] })
    },
  })

  async function handleMove(applicationId, stageSlug) {
    if (!canWrite) return
    setFeedback('')
    moveMutation.mutate({ applicationId, stageSlug })
  }

  const stages = data?.stages || []
  const jobs = jobsData?.jobs || []

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Pipeline</h1>
          <p className="text-sm text-neutral-500 mt-1">
            Gerencie candidatos por etapa — arraste os cards entre colunas
            {data?.totalApplications != null && (
              <span className="text-neutral-400"> · {data.totalApplications} ativos</span>
            )}
            {data?.limitPerStage != null && (
              <span className="text-neutral-400"> · até {data.limitPerStage} por coluna</span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} />
            Atualizar
          </Button>
          {canWrite && (
            <Button variant="secondary" size="sm" onClick={() => setSettingsOpen(true)}>
              <Settings2 size={14} />
              Etapas
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="search"
            placeholder="Buscar candidato ou vaga..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-9 pl-9 pr-3 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#003d7a]/20 focus:border-[#003d7a]"
          />
        </div>
        <select
          value={jobId}
          onChange={(e) => setJobId(e.target.value)}
          className="h-9 px-3 text-sm border border-neutral-200 rounded-lg bg-white min-w-[220px]"
        >
          <option value="">Todas as vagas</option>
          {jobs.map((job) => (
            <option key={job.id} value={job.id}>
              {job.title}
            </option>
          ))}
        </select>
      </div>

      {feedback && (
        <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{feedback}</p>
      )}

      {error && (
        <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
          {error instanceof ApiError ? error.message : 'Erro ao carregar pipeline.'}
        </p>
      )}

      {isLoading ? (
        <div className="flex gap-4 overflow-hidden">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="w-72 h-80 shrink-0 rounded-xl" />
          ))}
        </div>
      ) : stages.length === 0 ? (
        <div className="rounded-xl border border-dashed border-neutral-200 p-12 text-center">
          <p className="text-sm text-neutral-500">Nenhuma etapa configurada.</p>
          {canWrite && (
            <Button className="mt-4" size="sm" onClick={() => setSettingsOpen(true)}>
              Configurar etapas
            </Button>
          )}
        </div>
      ) : (
        <KanbanBoard stages={stages} onMove={handleMove} movingId={movingId} />
      )}

      <StageSettingsModal
        open={settingsOpen}
        stages={stagesConfigData?.stages || stages}
        onClose={() => setSettingsOpen(false)}
        onSave={(nextStages) => saveStagesMutation.mutate(nextStages)}
        saving={saveStagesMutation.isPending}
      />
    </div>
  )
}
