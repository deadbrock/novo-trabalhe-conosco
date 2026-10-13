import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Calendar,
  Clock,
  CheckCircle2,
  Plus,
  Search,
  Video,
  Pencil,
  Trash2,
  FileCheck,
  RefreshCw,
  UserPlus,
} from 'lucide-react'
import { interviewsService } from '@/services/interviewsService'
import { InterviewFormModal } from './InterviewFormModal'
import {
  INTERVIEW_STATUS_MAP,
  INTERVIEW_TYPE_MAP,
  formatDateTime,
  groupInterviewsByDay,
} from './interviewUtils'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Card, CardContent } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'
import { ApiError } from '@/services/api'
import { useAuth } from '@/context/AuthContext'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'

const STAT_CARDS = [
  { key: 'waitingForSchedule', label: 'Aguardando', icon: UserPlus, accent: 'text-amber-600 bg-amber-50' },
  { key: 'today', label: 'Hoje', icon: Calendar, accent: 'text-[#003d7a] bg-blue-50' },
  { key: 'thisWeek', label: 'Esta semana', icon: Clock, accent: 'text-violet-600 bg-violet-50' },
  { key: 'scheduled', label: 'Agendadas', icon: Video, accent: 'text-sky-600 bg-sky-50' },
  { key: 'completed', label: 'Concluídas', icon: CheckCircle2, accent: 'text-emerald-600 bg-emerald-50' },
]

export function InterviewsPage() {
  const queryClient = useQueryClient()
  const { hasPermission } = useAuth()
  const canWrite = hasPermission('interviews:write')

  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [period, setPeriod] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [preselectedApplicationId, setPreselectedApplicationId] = useState('')
  const [feedback, setFeedback] = useState('')

  const debouncedSearch = useDebouncedValue(search, 300)

  const { data: statsData } = useQuery({
    queryKey: ['interviews-stats'],
    queryFn: () => interviewsService.getStats(),
    staleTime: 60_000,
  })

  const {
    data: candidatesData,
    isLoading: loadingCandidates,
    isFetching: fetchingCandidates,
    refetch: refetchCandidates,
  } = useQuery({
    queryKey: ['interview-candidates'],
    queryFn: () => interviewsService.getCandidates(),
    staleTime: 30_000,
  })

  const {
    data,
    isLoading,
    isFetching,
    error,
    refetch: refetchInterviews,
  } = useQuery({
    queryKey: ['interviews', debouncedSearch, status, period],
    queryFn: () =>
      interviewsService.list({
        search: debouncedSearch || undefined,
        status: status || undefined,
        period: period || undefined,
      }),
  })

  const saveMutation = useMutation({
    mutationFn: (payload) =>
      editing?.id
        ? interviewsService.update(editing.id, payload)
        : interviewsService.create(payload),
    onSuccess: () => {
      setFeedback('')
      setModalOpen(false)
      setEditing(null)
      setPreselectedApplicationId('')
      queryClient.invalidateQueries({ queryKey: ['interviews'] })
      queryClient.invalidateQueries({ queryKey: ['interviews-stats'] })
      queryClient.invalidateQueries({ queryKey: ['interview-candidates'] })
    },
    onError: (err) => {
      setFeedback(err instanceof ApiError ? err.message : 'Erro ao salvar entrevista.')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => interviewsService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['interviews'] })
      queryClient.invalidateQueries({ queryKey: ['interviews-stats'] })
      queryClient.invalidateQueries({ queryKey: ['interview-candidates'] })
    },
    onError: (err) => {
      setFeedback(err instanceof ApiError ? err.message : 'Erro ao remover entrevista.')
    },
  })

  const sendToDocumentationMutation = useMutation({
    mutationFn: (id) => interviewsService.sendToDocumentation(id),
    onSuccess: () => {
      setFeedback('')
      queryClient.invalidateQueries({ queryKey: ['interviews'] })
      queryClient.invalidateQueries({ queryKey: ['interviews-stats'] })
      queryClient.invalidateQueries({ queryKey: ['interview-candidates'] })
      queryClient.invalidateQueries({ queryKey: ['admin-notifications'] })
    },
    onError: (err) => {
      setFeedback(err instanceof ApiError ? err.message : 'Erro ao enviar para documentação.')
    },
  })

  const interviews = data?.interviews || []
  const stats = statsData?.stats || {}
  const candidates = candidatesData?.candidates || []
  const waitingCandidates = candidates.filter((candidate) => !candidate.hasScheduledInterview)
  const grouped = groupInterviewsByDay(interviews)
  const isRefreshing = isFetching || fetchingCandidates

  function handleRefresh() {
    refetchInterviews()
    refetchCandidates()
    queryClient.invalidateQueries({ queryKey: ['interviews-stats'] })
  }

  function openScheduleModal(applicationId = '') {
    setEditing(null)
    setPreselectedApplicationId(applicationId)
    setModalOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Entrevistas</h1>
          <p className="text-sm text-neutral-500 mt-1">
            Candidatos na etapa Entrevista do pipeline e agenda de entrevistas agendadas
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
            Atualizar
          </Button>
          {canWrite && (
            <Button onClick={() => openScheduleModal()}>
              <Plus size={16} />
              Agendar entrevista
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {STAT_CARDS.map(({ key, label, icon: Icon, accent }) => (
          <Card key={key}>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-xs text-neutral-500">{label}</p>
                  <p className="text-2xl font-semibold mt-1">{stats[key] ?? 0}</p>
                </div>
                <div className={`p-2 rounded-lg ${accent}`}>
                  <Icon size={16} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-neutral-800">Candidatos aguardando agendamento</h2>
            <p className="text-xs text-neutral-500 mt-0.5">
              Candidatos marcados na etapa Entrevista — use Atualizar após mover candidatos no módulo Candidatos
            </p>
          </div>
          {waitingCandidates.length > 0 && (
            <Badge variant="amber">{waitingCandidates.length} pendente{waitingCandidates.length !== 1 ? 's' : ''}</Badge>
          )}
        </div>

        {loadingCandidates ? (
          <div className="space-y-2">
            {[1, 2].map((i) => <Skeleton key={i} className="h-16 w-full" />)}
          </div>
        ) : waitingCandidates.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-sm text-neutral-400">
              Nenhum candidato na etapa Entrevista aguardando agendamento.
              {candidates.length > 0 && (
                <span className="block mt-1 text-neutral-500">
                  Todos os {candidates.length} candidato(s) nesta etapa já possuem entrevista agendada.
                </span>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {waitingCandidates.map((candidate) => (
              <Card key={candidate.applicationId}>
                <CardContent className="py-3">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
                    <div className="min-w-0">
                      <p className="font-medium text-neutral-900">{candidate.candidateName}</p>
                      <p className="text-sm text-neutral-600">{candidate.jobTitle}</p>
                      <p className="text-xs text-neutral-500">{candidate.candidateEmail}</p>
                      {candidate.candidateUserId && (
                        <Link
                          to={`/candidatos/${candidate.candidateUserId}`}
                          className="text-xs text-[#003d7a] hover:underline mt-1 inline-block"
                        >
                          Ver perfil do candidato
                        </Link>
                      )}
                    </div>
                    {canWrite && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => openScheduleModal(candidate.applicationId)}
                      >
                        <Calendar size={14} />
                        Agendar
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      <div className="flex flex-col lg:flex-row gap-3">
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
        <select value={period} onChange={(e) => setPeriod(e.target.value)} className={selectClass}>
          <option value="">Todas as datas</option>
          <option value="today">Hoje</option>
          <option value="week">Próximos 7 dias</option>
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className={selectClass}>
          <option value="">Todos os status</option>
          <option value="SCHEDULED">Agendadas</option>
          <option value="COMPLETED">Concluídas</option>
          <option value="CANCELLED">Canceladas</option>
          <option value="NO_SHOW">Não compareceu</option>
        </select>
      </div>

      {feedback && (
        <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{feedback}</p>
      )}

      {error && (
        <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
          {error instanceof ApiError ? error.message : 'Erro ao carregar entrevistas.'}
        </p>
      )}

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-neutral-800">Entrevistas agendadas</h2>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full" />)}
          </div>
        ) : interviews.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-sm text-neutral-400">
              Nenhuma entrevista encontrada para os filtros selecionados.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {grouped.map(([dayLabel, dayInterviews]) => (
              <section key={dayLabel} className="space-y-3">
                <h3 className="text-sm font-semibold text-neutral-700 capitalize">{dayLabel}</h3>
                {dayInterviews.map((interview) => {
                  const statusInfo = INTERVIEW_STATUS_MAP[interview.status] || INTERVIEW_STATUS_MAP.SCHEDULED
                  return (
                    <Card key={interview.id}>
                      <CardContent className="py-4">
                        <div className="flex flex-col lg:flex-row lg:items-start gap-4 justify-between">
                          <div className="min-w-0 space-y-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-semibold text-neutral-900">{interview.candidateName}</p>
                              <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                              <Badge variant="default">{INTERVIEW_TYPE_MAP[interview.type]}</Badge>
                              {interview.sentToDocumentation && (
                                <Badge variant="green">Enviado p/ documentação</Badge>
                              )}
                            </div>
                            <p className="text-sm text-neutral-600">{interview.jobTitle}</p>
                            <p className="text-xs text-neutral-500">{formatDateTime(interview.scheduledAt)} · {interview.durationMinutes} min</p>
                            {interview.meetingLink && (
                              <a href={interview.meetingLink} target="_blank" rel="noopener noreferrer" className="text-xs text-[#003d7a] hover:underline break-all">
                                {interview.meetingLink}
                              </a>
                            )}
                            {interview.score != null && (
                              <p className="text-xs text-neutral-600">Score: <strong>{interview.score}/10</strong></p>
                            )}
                            {interview.feedback && (
                              <p className="text-xs text-neutral-600 whitespace-pre-wrap">{interview.feedback}</p>
                            )}
                            {interview.candidateUserId && (
                              <Link to={`/candidatos/${interview.candidateUserId}`} className="text-xs text-[#003d7a] hover:underline">
                                Ver perfil do candidato
                              </Link>
                            )}
                          </div>
                          {canWrite && (
                            <div className="flex flex-wrap gap-2 shrink-0">
                              {!interview.sentToDocumentation && interview.applicationCurrentStage === 'interview' && (
                                <Button
                                  size="sm"
                                  onClick={() => sendToDocumentationMutation.mutate(interview.id)}
                                  disabled={sendToDocumentationMutation.isPending}
                                >
                                  <FileCheck size={14} />
                                  Enviar p/ documentação
                                </Button>
                              )}
                              <Button variant="secondary" size="sm" onClick={() => { setEditing(interview); setModalOpen(true) }}>
                                <Pencil size={14} />
                                Editar
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={() => deleteMutation.mutate(interview.id)}
                              >
                                <Trash2 size={14} />
                              </Button>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </section>
            ))}
          </div>
        )}
      </section>

      <InterviewFormModal
        open={modalOpen}
        interview={editing}
        candidates={candidates}
        preselectedApplicationId={preselectedApplicationId}
        onClose={() => { setModalOpen(false); setEditing(null); setPreselectedApplicationId('') }}
        onSubmit={(payload) => saveMutation.mutate(payload)}
        saving={saveMutation.isPending}
      />
    </div>
  )
}

const selectClass = 'h-9 px-3 text-sm border border-neutral-200 rounded-lg bg-white min-w-[160px]'
