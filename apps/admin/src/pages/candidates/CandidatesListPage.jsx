import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Search, UserCircle, UserCheck, MailCheck, ClipboardList, UserX } from 'lucide-react'
import { candidatesService } from '@/services/candidatesService'
import { STATUS_MAP, formatDate, locationLabel } from './candidateUtils'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Card, CardContent } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'
import { ApiError } from '@/services/api'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'

const STAT_CARDS = [
  { key: 'total', label: 'Total', icon: UserCircle, accent: 'text-neutral-600 bg-neutral-100' },
  { key: 'active', label: 'Ativos', icon: UserCheck, accent: 'text-emerald-600 bg-emerald-50' },
  { key: 'verified', label: 'E-mail verificado', icon: MailCheck, accent: 'text-blue-600 bg-blue-50' },
  { key: 'withApplications', label: 'Com candidaturas', icon: ClipboardList, accent: 'text-[#003d7a] bg-blue-50' },
]

const REJECTED_STAT_CARDS = [
  { key: 'rejected', label: 'Reprovados', icon: UserX, accent: 'text-red-600 bg-red-50' },
]

export function CandidatesListPage({ rejectedOnly = false }) {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [state, setState] = useState('')
  const [hasApplications, setHasApplications] = useState('')
  const debouncedSearch = useDebouncedValue(search, 300)

  const { data: statsData } = useQuery({
    queryKey: ['candidates-stats'],
    queryFn: () => candidatesService.getStats(),
    staleTime: 60_000,
  })

  const { data: statesData } = useQuery({
    queryKey: ['candidates-states'],
    queryFn: () => candidatesService.getStates(),
    staleTime: 300_000,
  })

  const { data, isLoading, error } = useQuery({
    queryKey: ['candidates', rejectedOnly ? 'rejected' : 'active', debouncedSearch, status, state, hasApplications],
    queryFn: () =>
      candidatesService.list({
        search: debouncedSearch || undefined,
        status: status || undefined,
        state: state || undefined,
        hasApplications: hasApplications || undefined,
        rejectedOnly: rejectedOnly ? 'true' : undefined,
      }),
  })

  const candidates = data?.candidates || []
  const stats = statsData?.stats || {}
  const states = statesData?.states || []
  const statCards = rejectedOnly ? REJECTED_STAT_CARDS : STAT_CARDS

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {rejectedOnly ? 'Reprovados' : 'Candidatos'}
        </h1>
        <p className="text-sm text-neutral-500 mt-1">
          {rejectedOnly
            ? 'Candidatos reprovados com registro do motivo da decisão'
            : 'Perfis registrados no portal com candidaturas, currículos e histórico completo'}
        </p>
      </div>

      <div className={`grid grid-cols-2 ${rejectedOnly ? 'lg:grid-cols-1 max-w-xs' : 'lg:grid-cols-4'} gap-3`}>
        {statCards.map(({ key, label, icon: Icon, accent }) => (
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

      <div className="flex flex-col lg:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="search"
            placeholder="Buscar por nome, e-mail ou cidade..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-9 pl-9 pr-3 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#003d7a]/20 focus:border-[#003d7a]"
          />
        </div>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="h-9 px-3 text-sm border border-neutral-200 rounded-lg bg-white min-w-[140px]"
        >
          <option value="">Todos os status</option>
          <option value="ACTIVE">Ativo</option>
          <option value="PENDING">Pendente</option>
          <option value="INACTIVE">Inativo</option>
        </select>
        <select
          value={state}
          onChange={(e) => setState(e.target.value)}
          className="h-9 px-3 text-sm border border-neutral-200 rounded-lg bg-white min-w-[120px]"
        >
          <option value="">Todos os estados</option>
          {states.map((uf) => (
            <option key={uf} value={uf}>
              {uf}
            </option>
          ))}
        </select>
        {!rejectedOnly && (
          <select
            value={hasApplications}
            onChange={(e) => setHasApplications(e.target.value)}
            className="h-9 px-3 text-sm border border-neutral-200 rounded-lg bg-white min-w-[180px]"
          >
            <option value="">Todas candidaturas</option>
            <option value="true">Com candidaturas</option>
            <option value="false">Sem candidaturas</option>
          </select>
        )}
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
          {error instanceof ApiError ? error.message : 'Erro ao carregar candidatos.'}
        </p>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : candidates.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-neutral-400">
            {rejectedOnly ? 'Nenhum candidato reprovado encontrado.' : 'Nenhum candidato encontrado.'}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {candidates.map((candidate) => {
            const statusInfo = STATUS_MAP[candidate.status] || STATUS_MAP.PENDING
            const rejection = candidate.latestRejection

            return (
              <Card key={candidate.id} className="hover:shadow-sm transition-shadow">
                <CardContent className="py-4">
                  <div className="flex flex-col lg:flex-row lg:items-center gap-4 justify-between">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          type="button"
                          onClick={() => navigate(`/candidatos/${candidate.id}`)}
                          className="text-sm font-semibold text-neutral-900 hover:text-[#003d7a] text-left"
                        >
                          {candidate.name}
                        </button>
                        <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                        {rejectedOnly && (
                          <Badge variant="red">Reprovado</Badge>
                        )}
                        {candidate.emailVerified && (
                          <Badge variant="blue">Verificado</Badge>
                        )}
                        {!rejectedOnly && candidate.applicationsCount > 0 && (
                          <Badge variant="default">
                            {candidate.applicationsCount} candidatura(s)
                          </Badge>
                        )}
                        {rejectedOnly && candidate.rejectedApplicationsCount > 0 && (
                          <Badge variant="default">
                            {candidate.rejectedApplicationsCount} reprovação(ões)
                          </Badge>
                        )}
                      </div>
                      <div className="mt-1 text-xs text-neutral-500 space-y-0.5">
                        <p>{candidate.email}</p>
                        <p>
                          {locationLabel(candidate.city, candidate.state)} ·{' '}
                          {formatDate(candidate.createdAt)}
                        </p>
                        {rejectedOnly && rejection && (
                          <div className="mt-2 rounded-lg bg-red-50 border border-red-100 px-3 py-2 text-red-800 space-y-1">
                            {rejection.jobTitle && (
                              <p>
                                <span className="font-medium">Vaga:</span> {rejection.jobTitle}
                              </p>
                            )}
                            <p>
                              <span className="font-medium">Motivo:</span> {rejection.reason || '—'}
                            </p>
                            {rejection.rejectedAt && (
                              <p className="text-red-600/80">
                                Reprovado em {formatDate(rejection.rejectedAt)}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => navigate(`/candidatos/${candidate.id}`)}
                    >
                      Ver perfil completo
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
