import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Search, Users, Clock, CheckCircle2, Archive } from 'lucide-react'
import { talentPoolService } from '@/services/talentPoolService'
import { TalentPoolDetailPanel } from './TalentPoolDetailPanel'
import { STATUS_MAP, formatDate } from './talentPoolUtils'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Card, CardContent } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'
import { ApiError } from '@/services/api'

const STAT_CARDS = [
  { key: 'pending', label: 'Pendentes', icon: Clock, accent: 'text-amber-600 bg-amber-50' },
  { key: 'reviewed', label: 'Analisados', icon: Users, accent: 'text-blue-600 bg-blue-50' },
  { key: 'converted', label: 'Convertidos', icon: CheckCircle2, accent: 'text-emerald-600 bg-emerald-50' },
  { key: 'archived', label: 'Arquivados', icon: Archive, accent: 'text-neutral-600 bg-neutral-100' },
]

export function TalentPoolListPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [area, setArea] = useState('')
  const [selectedId, setSelectedId] = useState(null)
  const [feedback, setFeedback] = useState('')
  const [downloadingId, setDownloadingId] = useState(null)

  const { data: statsData } = useQuery({
    queryKey: ['talent-pool-stats'],
    queryFn: () => talentPoolService.getStats(),
  })

  const { data: areasData } = useQuery({
    queryKey: ['talent-pool-areas'],
    queryFn: () => talentPoolService.getAreas(),
  })

  const { data, isLoading, error } = useQuery({
    queryKey: ['talent-pool', search, status, area],
    queryFn: () =>
      talentPoolService.list({
        search: search || undefined,
        status: status || undefined,
        area: area || undefined,
      }),
  })

  const { data: detailData } = useQuery({
    queryKey: ['talent-pool-detail', selectedId],
    queryFn: () => talentPoolService.get(selectedId),
    enabled: Boolean(selectedId),
  })

  const statusMutation = useMutation({
    mutationFn: ({ id, nextStatus }) => talentPoolService.updateStatus(id, nextStatus),
    onSuccess: (result) => {
      setFeedback('')
      queryClient.invalidateQueries({ queryKey: ['talent-pool'] })
      queryClient.invalidateQueries({ queryKey: ['talent-pool-stats'] })
      queryClient.invalidateQueries({ queryKey: ['talent-pool-detail', result.entry.id] })
    },
    onError: (err) => {
      setFeedback(err instanceof ApiError ? err.message : 'Erro ao atualizar status.')
    },
  })

  async function handleDownloadResume(entry) {
    setFeedback('')
    setDownloadingId(entry.id)
    try {
      await talentPoolService.downloadResume(entry.id, entry.resumeFileName || 'curriculo.pdf')
    } catch (err) {
      setFeedback(err instanceof ApiError ? err.message : 'Erro ao baixar currículo.')
    } finally {
      setDownloadingId(null)
    }
  }

  const entries = data?.entries || []
  const stats = statsData?.stats || {}
  const areas = areasData?.areas || []
  const selectedEntry = detailData?.entry

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Banco de Talentos</h1>
        <p className="text-sm text-neutral-500 mt-1">
          Candidatos espontâneos cadastrados pelo portal institucional
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
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

      <div className="flex flex-col lg:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="search"
            placeholder="Buscar por nome, e-mail ou vaga..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-9 pl-9 pr-3 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#003d7a]/20 focus:border-[#003d7a]"
          />
        </div>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="h-9 px-3 text-sm border border-neutral-200 rounded-lg bg-white min-w-[160px]"
        >
          <option value="">Todos os status</option>
          <option value="PENDING">Pendente</option>
          <option value="REVIEWED">Analisado</option>
          <option value="CONVERTED">Convertido</option>
          <option value="ARCHIVED">Arquivado</option>
        </select>
        <select
          value={area}
          onChange={(e) => setArea(e.target.value)}
          className="h-9 px-3 text-sm border border-neutral-200 rounded-lg bg-white min-w-[180px]"
        >
          <option value="">Todas as áreas</option>
          {areas.map((item) => (
            <option key={item.id} value={item.id}>
              {item.label}
            </option>
          ))}
        </select>
      </div>

      {feedback && (
        <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{feedback}</p>
      )}

      {error && (
        <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
          {error instanceof ApiError ? error.message : 'Erro ao carregar cadastros.'}
        </p>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : entries.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-neutral-400">
            Nenhum cadastro encontrado no banco de talentos.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {entries.map((entry) => {
            const statusInfo = STATUS_MAP[entry.status] || STATUS_MAP.PENDING
            return (
              <Card key={entry.id} className="hover:shadow-sm transition-shadow">
                <CardContent className="py-4">
                  <div className="flex flex-col lg:flex-row lg:items-center gap-4 justify-between">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          type="button"
                          onClick={() => setSelectedId(entry.id)}
                          className="text-sm font-semibold text-neutral-900 hover:text-[#003d7a] text-left"
                        >
                          {entry.name}
                        </button>
                        <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                      </div>
                      <div className="mt-1 text-xs text-neutral-500 space-y-0.5">
                        <p>{entry.email}</p>
                        <p>
                          {entry.areaLabel || entry.area} · {entry.desiredJob} · {formatDate(entry.createdAt)}
                        </p>
                      </div>
                    </div>
                    <Button variant="secondary" size="sm" onClick={() => setSelectedId(entry.id)}>
                      Ver detalhes
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {selectedEntry && (
        <TalentPoolDetailPanel
          entry={selectedEntry}
          onClose={() => setSelectedId(null)}
          onStatusChange={(id, nextStatus) => statusMutation.mutate({ id, nextStatus })}
          onDownloadResume={handleDownloadResume}
          updating={statusMutation.isPending}
          downloading={downloadingId === selectedEntry.id}
        />
      )}
    </div>
  )
}
