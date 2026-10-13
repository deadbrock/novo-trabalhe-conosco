import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Clock, FileCheck, Search, Send } from 'lucide-react'
import { preAdmissionService } from '@/services/preAdmissionService'
import { PRE_ADMISSION_STATUS_MAP } from './preAdmissionUtils'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Card, CardContent } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'
import { ApiError } from '@/services/api'

const STAT_CARDS = [
  { key: 'pendingDocs', label: 'Aguardando docs', icon: Clock, accent: 'text-amber-600 bg-amber-50' },
  { key: 'underReview', label: 'Em análise RH', icon: FileCheck, accent: 'text-blue-600 bg-blue-50' },
  { key: 'awaitingDp', label: 'No DP', icon: Send, accent: 'text-violet-600 bg-violet-50' },
]

export function PreAdmissionListPage() {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')

  const { data: statsData } = useQuery({
    queryKey: ['pre-admission-stats'],
    queryFn: () => preAdmissionService.getStats(),
  })

  const { data, isLoading, error } = useQuery({
    queryKey: ['pre-admission', search, status],
    queryFn: () =>
      preAdmissionService.list({
        search: search || undefined,
        status: status || undefined,
      }),
  })

  const stats = statsData?.stats || {}
  const cases = data?.cases || []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Pré-admissão</h1>
        <p className="text-sm text-neutral-500 mt-1">
          Checklist documental e validação RH antes do encaminhamento ao DP
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
            placeholder="Buscar candidato ou vaga..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-9 pl-9 pr-3 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#003d7a]/20 focus:border-[#003d7a]"
          />
        </div>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="h-9 px-3 text-sm border border-neutral-200 rounded-lg bg-white min-w-[180px]"
        >
          <option value="">Em andamento (RH)</option>
          <option value="PENDING_DOCS">Aguardando documentos</option>
          <option value="UNDER_REVIEW">Em análise RH</option>
          <option value="FORWARDED_TO_DP">Encaminhados ao DP</option>
          <option value="APPROVED">Aprovados pelo DP</option>
          <option value="REJECTED">Reprovados</option>
          <option value="HIRED">Contratados</option>
        </select>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
          {error instanceof ApiError ? error.message : 'Erro ao carregar casos.'}
        </p>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full" />)}
        </div>
      ) : cases.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-neutral-400">
            Nenhum caso de pré-admissão encontrado.
          </CardContent>
        </Card>
      ) : (
        <ul className="space-y-3">
          {cases.map((item) => {
            const statusInfo = PRE_ADMISSION_STATUS_MAP[item.status] || PRE_ADMISSION_STATUS_MAP.PENDING_DOCS
            return (
              <li key={item.id}>
                <Card>
                  <CardContent className="py-4">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-neutral-900">{item.candidateName}</p>
                          <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                        </div>
                        <p className="text-sm text-neutral-600 mt-1">{item.jobTitle}</p>
                        <p className="text-xs text-neutral-500 mt-1">
                          {item.progress.approvedRequired}/{item.progress.totalRequired} documentos aprovados
                        </p>
                      </div>
                      <Link to={`/pre-admissao/${item.id}`}>
                        <Button variant="secondary" size="sm">Ver checklist</Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
