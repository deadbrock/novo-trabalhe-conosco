import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Plus, Search, MapPin, Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'
import { jobsService } from '@/services/jobsService'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Card, CardContent } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'
import { useAuth } from '@/context/AuthContext'
import { ApiError } from '@/services/api'

const STATUS_MAP = {
  DRAFT: { label: 'Rascunho', variant: 'default' },
  PUBLISHED: { label: 'Publicada', variant: 'green' },
  PAUSED: { label: 'Pausada', variant: 'amber' },
  CLOSED: { label: 'Encerrada', variant: 'red' },
}

export function JobsListPage() {
  const { hasPermission } = useAuth()
  const queryClient = useQueryClient()
  const canPublish = hasPermission('recruitment:publish')
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [actionError, setActionError] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['admin-jobs', search, status],
    queryFn: () => jobsService.list({ search: search || undefined, status: status || undefined }),
  })

  async function handlePublish(id, publish) {
    if (!id || id === 'nova') {
      setActionError('Salve a vaga antes de publicar. Use "Criar e publicar" no formulário da nova vaga.')
      return
    }

    setActionError('')
    try {
      if (publish) await jobsService.publish(id)
      else await jobsService.unpublish(id)
      await queryClient.invalidateQueries({ queryKey: ['admin-jobs'] })
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Erro na operação.')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Vagas</h1>
          <p className="text-sm text-neutral-500 mt-1">Gerencie vagas e publique no portal institucional</p>
        </div>
        <Link to="/recrutamento/vagas/nova">
          <Button>
            <Plus size={16} />
            Nova vaga
          </Button>
        </Link>
      </div>

      {actionError && (
        <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{actionError}</p>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="search"
            placeholder="Buscar vagas..."
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
          <option value="DRAFT">Rascunho</option>
          <option value="PUBLISHED">Publicada</option>
          <option value="PAUSED">Pausada</option>
          <option value="CLOSED">Encerrada</option>
        </select>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full" />)}
        </div>
      ) : (
        <div className="space-y-3">
          {data?.jobs?.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center text-sm text-neutral-400">
                Nenhuma vaga encontrada. Crie a primeira vaga.
              </CardContent>
            </Card>
          )}
          {data?.jobs?.map((job) => {
            const statusInfo = STATUS_MAP[job.status] || STATUS_MAP.DRAFT
            return (
              <Card key={job.id} className="hover:shadow-sm transition-shadow">
                <CardContent className="py-4">
                  <div className="flex flex-col lg:flex-row lg:items-center gap-4 justify-between">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Link
                          to={`/recrutamento/vagas/${job.id}`}
                          className="text-sm font-semibold text-neutral-900 hover:text-[#003d7a]"
                        >
                          {job.title}
                        </Link>
                        <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                        {job.featured && <Badge variant="blue">Destaque</Badge>}
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-neutral-500 flex-wrap">
                        <span>{job.area}</span>
                        {job.location && (
                          <span className="inline-flex items-center gap-1">
                            <MapPin size={12} />
                            {job.location}
                          </span>
                        )}
                        <span>{job.contract}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {canPublish && (
                        job.status === 'PUBLISHED' ? (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handlePublish(job.id, false)}
                          >
                            <EyeOff size={14} />
                            Despublicar
                          </Button>
                        ) : (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handlePublish(job.id, true)}
                          >
                            <Eye size={14} />
                            Publicar
                          </Button>
                        )
                      )}
                      <Link to={`/recrutamento/vagas/${job.id}`}>
                        <Button variant="ghost" size="sm">Editar</Button>
                      </Link>
                    </div>
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
