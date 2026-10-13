import { useQuery } from '@tanstack/react-query'
import { Clock } from 'lucide-react'
import { candidatesService } from '@/services/candidatesService'
import { formatDate } from './candidateUtils'
import { Skeleton } from '@/components/ui/Skeleton'
import { ApiError } from '@/services/api'

export function CandidateTimelineContent({ candidateId }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['candidate-timeline', candidateId],
    queryFn: () => candidatesService.getTimeline(candidateId),
  })

  if (isLoading) {
    return <Skeleton className="h-48 w-full" />
  }

  if (error) {
    return (
      <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
        {error instanceof ApiError ? error.message : 'Erro ao carregar histórico.'}
      </p>
    )
  }

  const timeline = data?.timeline || []

  if (timeline.length === 0) {
    return (
      <p className="text-sm text-neutral-500 flex items-center gap-1.5">
        <Clock size={14} />
        Nenhum evento registrado.
      </p>
    )
  }

  return (
    <ol className="relative border-l border-neutral-200 ml-2 space-y-6">
      {timeline.map((event) => (
        <li key={event.id} className="ml-5">
          <span className="absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full border-2 border-white bg-[#003d7a]" />
          <p className="text-sm font-medium text-neutral-900">{event.title}</p>
          {event.description && (
            <p className="text-sm text-neutral-600 mt-0.5">{event.description}</p>
          )}
          <p className="text-xs text-neutral-400 mt-1">
            {formatDate(event.createdAt)}
            {event.actor ? ` · ${event.actor}` : ''}
          </p>
        </li>
      ))}
    </ol>
  )
}
