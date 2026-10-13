import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { preAdmissionService } from '@/services/preAdmissionService'
import { PreAdmissionCaseDetail } from './PreAdmissionCaseDetail'
import { Skeleton } from '@/components/ui/Skeleton'
import { ApiError } from '@/services/api'

export function PreAdmissionDetailPage() {
  const { id } = useParams()

  const { data, isLoading, error } = useQuery({
    queryKey: ['pre-admission-detail', id],
    queryFn: () => preAdmissionService.get(id),
    enabled: Boolean(id),
  })

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  if (error || !data?.case) {
    return (
      <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
        {error instanceof ApiError ? error.message : 'Caso não encontrado.'}
      </p>
    )
  }

  return (
    <PreAdmissionCaseDetail
      preAdmissionCase={data.case}
      mode="pre-admission"
      backPath="/pre-admissao"
      backLabel="Pré-admissão"
    />
  )
}
