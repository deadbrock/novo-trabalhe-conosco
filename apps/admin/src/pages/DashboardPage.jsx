import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  Briefcase,
  UserCheck,
  Calendar,
  FileWarning,
  Users,
  ClipboardList,
  FileCheck,
  Building2,
  ArrowRight,
} from 'lucide-react'
import { dashboardService } from '@/services/authService'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { useAuth } from '@/context/AuthContext'
import { cn } from '@/utils/cn'
import { FunnelChart, StateBarChart } from '@/components/analytics/AnalyticsCharts'

const STAT_CONFIG = [
  { key: 'openJobs', label: 'Vagas abertas', icon: Briefcase, accent: 'text-blue-600 bg-blue-50' },
  { key: 'hires', label: 'Contratações', icon: UserCheck, accent: 'text-emerald-600 bg-emerald-50' },
  { key: 'interviewsToday', label: 'Entrevistas hoje', icon: Calendar, accent: 'text-violet-600 bg-violet-50' },
  { key: 'documentationUnderReview', label: 'Docs p/ validar', icon: FileCheck, accent: 'text-sky-600 bg-sky-50' },
  { key: 'pendingDocuments', label: 'Documentos pendentes', icon: FileWarning, accent: 'text-amber-600 bg-amber-50' },
  { key: 'admissions', label: 'Admissões em andamento', icon: FileCheck, accent: 'text-orange-600 bg-orange-50' },
  { key: 'awaitingDp', label: 'Aguardando DP', icon: Building2, accent: 'text-indigo-600 bg-indigo-50' },
  { key: 'talentPoolPending', label: 'Banco de talentos', icon: Users, accent: 'text-[#c8050f] bg-red-50' },
  { key: 'applicationsActive', label: 'Candidaturas ativas', icon: ClipboardList, accent: 'text-neutral-600 bg-neutral-100' },
]

function StatCard({ label, value, icon: Icon, accent, loading, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.25 }}
    >
      <Card className="hover:shadow-sm transition-shadow">
        <CardContent className="pt-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm text-neutral-500">{label}</p>
              {loading ? (
                <Skeleton className="h-8 w-16 mt-2" />
              ) : (
                <p className="text-3xl font-semibold tracking-tight mt-1">{value ?? 0}</p>
              )}
            </div>
            <div className={cn('p-2 rounded-lg', accent)}>
              <Icon size={18} strokeWidth={1.75} />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

function formatRelativeTime(iso) {
  const diff = Date.now() - new Date(iso).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'agora'
  if (minutes < 60) return `${minutes}min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h`
  return new Date(iso).toLocaleDateString('pt-BR')
}

export function DashboardPage() {
  const { user, hasPermission } = useAuth()

  const { data: overview, isLoading: loadingStats } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => dashboardService.getOverview(),
    refetchInterval: 60_000,
  })

  const { data: activitiesData, isLoading: loadingActivities } = useQuery({
    queryKey: ['dashboard-activities'],
    queryFn: () => dashboardService.getActivities({ limit: 12 }),
    refetchInterval: 30_000,
  })

  const { data: funnelData, isLoading: loadingFunnel } = useQuery({
    queryKey: ['dashboard-funnel'],
    queryFn: () => dashboardService.getFunnel(),
    refetchInterval: 60_000,
  })

  const { data: stateData, isLoading: loadingStates } = useQuery({
    queryKey: ['dashboard-states'],
    queryFn: () => dashboardService.getByState(),
    refetchInterval: 60_000,
  })

  const stats = overview?.stats

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-semibold tracking-tight">
              Olá, {user?.name?.split(' ')[0]}
            </h1>
            <Badge variant="blue">{user?.roleName}</Badge>
          </div>
          <p className="text-sm text-neutral-500 mt-1">
            Centro operacional de recrutamento — atualização automática a cada 30s
          </p>
        </div>
        {hasPermission('analytics:read') && (
          <Link
            to="/analytics"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-[#003d7a] hover:underline"
          >
            Ver analytics completo
            <ArrowRight size={14} />
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {STAT_CONFIG.map(({ key, ...statProps }, index) => (
          <StatCard
            key={key}
            {...statProps}
            value={stats?.[key]}
            loading={loadingStats}
            index={index}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <h2 className="text-sm font-semibold">Funil do pipeline</h2>
            <p className="text-xs text-neutral-500 mt-0.5">Candidaturas ativas por etapa</p>
          </CardHeader>
          <CardContent className="pt-0">
            {loadingFunnel ? (
              <Skeleton className="h-[280px] w-full" />
            ) : (
              <FunnelChart steps={funnelData?.funnel?.steps || []} />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-sm font-semibold">Mapa por estados</h2>
            <p className="text-xs text-neutral-500 mt-0.5">Candidaturas nos últimos 30 dias (UF)</p>
          </CardHeader>
          <CardContent className="pt-0">
            {loadingStates ? (
              <Skeleton className="h-[280px] w-full" />
            ) : (
              <StateBarChart states={stateData?.states || []} />
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <h2 className="text-sm font-semibold">Timeline de atividades</h2>
            <p className="text-xs text-neutral-500 mt-0.5">Últimas ações registradas — atualização em tempo real</p>
          </CardHeader>
          <CardContent className="pt-0">
            {loadingActivities ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : activitiesData?.activities?.length ? (
              <ul className="divide-y divide-neutral-100">
                {activitiesData.activities.map((activity) => (
                  <li key={activity.id} className="py-3 flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-neutral-800">{activity.label}</p>
                      <p className="text-xs text-neutral-400 mt-0.5">{activity.actorName}</p>
                    </div>
                    <time className="text-xs text-neutral-400 shrink-0">
                      {formatRelativeTime(activity.createdAt)}
                    </time>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-neutral-400 py-6 text-center">
                Nenhuma atividade registrada ainda.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-sm font-semibold">Resumo operacional</h2>
          </CardHeader>
          <CardContent className="pt-0 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-neutral-500">Candidatos cadastrados</span>
              <span className="font-medium">{loadingStats ? '—' : stats?.candidatesCount ?? 0}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-neutral-500">Pendências totais</span>
              <span className="font-medium">{loadingStats ? '—' : stats?.pendingTasks ?? 0}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-neutral-500">Candidaturas ativas</span>
              <span className="font-medium">{loadingStats ? '—' : stats?.applicationsActive ?? 0}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-neutral-500">Banco de talentos</span>
              <span className="font-medium">{loadingStats ? '—' : stats?.talentPoolPending ?? 0}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
