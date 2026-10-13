import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Download, TrendingUp, Users, UserCheck, Calendar, MessageSquare } from 'lucide-react'
import { analyticsService } from '@/services/analyticsService'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { PeriodFilter } from '@/components/analytics/PeriodFilter'
import {
  FunnelChart,
  StateBarChart,
  StageDurationChart,
  TrendLineChart,
} from '@/components/analytics/AnalyticsCharts'

const KPI_CONFIG = [
  { key: 'applicationsInPeriod', label: 'Candidaturas', icon: Users, accent: 'text-blue-600 bg-blue-50' },
  { key: 'hiresInPeriod', label: 'Contratações', icon: UserCheck, accent: 'text-emerald-600 bg-emerald-50' },
  { key: 'conversionRate', label: 'Taxa de conversão', icon: TrendingUp, accent: 'text-violet-600 bg-violet-50', suffix: '%' },
  { key: 'interviewsInPeriod', label: 'Entrevistas', icon: Calendar, accent: 'text-amber-600 bg-amber-50' },
  { key: 'communicationsSent', label: 'Comunicações', icon: MessageSquare, accent: 'text-neutral-600 bg-neutral-100' },
]

function KpiCard({ label, value, icon: Icon, accent, suffix = '', loading }) {
  return (
    <Card>
      <CardContent className="pt-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm text-neutral-500">{label}</p>
            {loading ? (
              <Skeleton className="h-8 w-16 mt-2" />
            ) : (
              <p className="text-3xl font-semibold tracking-tight mt-1">
                {value ?? 0}{suffix}
              </p>
            )}
          </div>
          <div className={`p-2 rounded-lg ${accent}`}>
            <Icon size={18} strokeWidth={1.75} />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function AnalyticsPage() {
  const [period, setPeriod] = useState('30d')
  const [exporting, setExporting] = useState('')

  const { data: overviewData, isLoading: loadingOverview } = useQuery({
    queryKey: ['analytics-overview', period],
    queryFn: () => analyticsService.getOverview(period),
  })

  const { data: funnelData, isLoading: loadingFunnel } = useQuery({
    queryKey: ['analytics-funnel', period],
    queryFn: () => analyticsService.getFunnel(period),
  })

  const { data: stateData, isLoading: loadingStates } = useQuery({
    queryKey: ['analytics-states', period],
    queryFn: () => analyticsService.getByState(period),
  })

  const { data: durationData, isLoading: loadingDuration } = useQuery({
    queryKey: ['analytics-duration', period],
    queryFn: () => analyticsService.getStageDuration(period),
  })

  const { data: trendData, isLoading: loadingTrend } = useQuery({
    queryKey: ['analytics-trend', period],
    queryFn: () => analyticsService.getTrend(period),
  })

  const overview = overviewData?.overview

  async function handleExport(report) {
    setExporting(report)
    try {
      await analyticsService.exportReport(report, period)
    } finally {
      setExporting('')
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Analytics</h1>
          <p className="text-sm text-neutral-500 mt-1">
            Indicadores executivos — funil, estados, tempo por etapa e tendências
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <PeriodFilter value={period} onChange={setPeriod} />
          <Button
            variant="secondary"
            size="sm"
            disabled={Boolean(exporting)}
            onClick={() => handleExport('overview')}
          >
            <Download size={14} />
            {exporting === 'overview' ? 'Exportando...' : 'Exportar CSV'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
        {KPI_CONFIG.map(({ key, ...kpiProps }) => (
          <KpiCard
            key={key}
            {...kpiProps}
            value={overview?.[key]}
            loading={loadingOverview}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold">Funil de conversão</h2>
              <p className="text-xs text-neutral-500 mt-0.5">Candidaturas ativas por etapa do pipeline</p>
            </div>
            <Button
              variant="secondary"
              size="sm"
              disabled={exporting === 'funnel'}
              onClick={() => handleExport('funnel')}
            >
              CSV
            </Button>
          </CardHeader>
          <CardContent className="pt-0">
            {loadingFunnel ? <Skeleton className="h-[320px] w-full" /> : (
              <FunnelChart steps={funnelData?.funnel?.steps || []} />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold">Candidaturas por estado</h2>
              <p className="text-xs text-neutral-500 mt-0.5">Distribuição geográfica dos candidatos (UF)</p>
            </div>
            <Button
              variant="secondary"
              size="sm"
              disabled={exporting === 'by-state'}
              onClick={() => handleExport('by-state')}
            >
              CSV
            </Button>
          </CardHeader>
          <CardContent className="pt-0">
            {loadingStates ? <Skeleton className="h-[320px] w-full" /> : (
              <StateBarChart states={stateData?.states || []} />
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold">Tendência de candidaturas</h2>
              <p className="text-xs text-neutral-500 mt-0.5">Volume diário no período selecionado</p>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {loadingTrend ? <Skeleton className="h-[280px] w-full" /> : (
              <TrendLineChart points={trendData?.trend?.points || []} />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold">Tempo médio por etapa</h2>
              <p className="text-xs text-neutral-500 mt-0.5">
                Tempo por etapa e ciclos oficiais: RH (entrevista → dossiê no DP) e DP (fila → admissão concluída)
              </p>
            </div>
            <Button
              variant="secondary"
              size="sm"
              disabled={exporting === 'stage-duration'}
              onClick={() => handleExport('stage-duration')}
            >
              CSV
            </Button>
          </CardHeader>
          <CardContent className="pt-0">
            {loadingDuration ? <Skeleton className="h-[280px] w-full" /> : (
              <StageDurationChart items={durationData?.items || []} />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
