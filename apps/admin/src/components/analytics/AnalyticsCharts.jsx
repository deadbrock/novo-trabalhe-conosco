import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

const STAGE_COLORS = [
  '#003d7a',
  '#2563eb',
  '#0891b2',
  '#d97706',
  '#ea580c',
  '#6366f1',
  '#059669',
  '#16a34a',
]

export function FunnelChart({ steps = [] }) {
  if (!steps.length) {
    return <p className="text-sm text-neutral-400 py-8 text-center">Sem dados para o funil.</p>
  }

  const data = steps.map((step) => ({
    name: step.label,
    count: step.count,
    percentage: step.percentage,
  }))

  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16, top: 8, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
        <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
        <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 12 }} />
        <Tooltip
          formatter={(value, _name, item) => [`${value} (${item.payload.percentage}%)`, 'Candidaturas']}
        />
        <Bar dataKey="count" radius={[0, 4, 4, 0]}>
          {data.map((entry, index) => (
            <Cell key={entry.name} fill={STAGE_COLORS[index % STAGE_COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

export function StateBarChart({ states = [] }) {
  if (!states.length) {
    return <p className="text-sm text-neutral-400 py-8 text-center">Sem dados por estado.</p>
  }

  const data = states.slice(0, 12).map((row) => ({
    state: row.state,
    Candidaturas: row.applications,
    Contratações: row.hires,
  }))

  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart data={data} margin={{ left: 0, right: 8, top: 8, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
        <XAxis dataKey="state" tick={{ fontSize: 12 }} />
        <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
        <Tooltip />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="Candidaturas" fill="#003d7a" radius={[4, 4, 0, 0]} />
        <Bar dataKey="Contratações" fill="#059669" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

export function TrendLineChart({ points = [] }) {
  if (!points.length) {
    return <p className="text-sm text-neutral-400 py-8 text-center">Sem tendência no período.</p>
  }

  const data = points.map((point) => ({
    ...point,
    label: new Date(`${point.date}T12:00:00`).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
    }),
  }))

  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data} margin={{ left: 0, right: 8, top: 8, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
        <XAxis dataKey="label" tick={{ fontSize: 11 }} />
        <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
        <Tooltip />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Line type="monotone" dataKey="applications" name="Candidaturas" stroke="#003d7a" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="hires" name="Contratações" stroke="#059669" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  )
}

export function StageDurationChart({ items = [] }) {
  if (!items.length) {
    return (
      <p className="text-sm text-neutral-400 py-8 text-center">
        Tempo médio por etapa será calculado conforme movimentações no pipeline.
      </p>
    )
  }

  const data = items.map((item) => ({
    name: item.label,
    days: item.averageDays,
  }))

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ left: 0, right: 8, top: 8, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
        <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-20} textAnchor="end" height={60} />
        <YAxis allowDecimals tick={{ fontSize: 12 }} unit=" d" />
        <Tooltip formatter={(value) => [`${value} dias`, 'Tempo médio']} />
        <Bar dataKey="days" fill="#6366f1" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
