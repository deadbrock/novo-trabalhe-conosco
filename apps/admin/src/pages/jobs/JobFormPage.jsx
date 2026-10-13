import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Eye } from 'lucide-react'
import { jobsService, catalogsService } from '@/services/jobsService'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'
import { Badge } from '@/components/ui/Badge'
import { ApiError } from '@/services/api'
import { useAuth } from '@/context/AuthContext'

const NEW_JOB_ROUTE = 'nova'

const schema = z.object({
  title: z.string().min(3, 'Informe o título'),
  area: z.string().min(1, 'Informe a área'),
  description: z.string().min(10, 'Descrição muito curta'),
  requirements: z.string().optional(),
  benefits: z.string().optional(),
  locationLabel: z.string().optional(),
  stateCode: z.string().optional(),
  workModality: z.string().optional(),
  employmentType: z.string().optional(),
  level: z.string().optional(),
  workSchedule: z.string().optional(),
  salaryRange: z.string().optional(),
  quantity: z.coerce.number().min(1).optional(),
  urgency: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  clientId: z.string().optional(),
  contractId: z.string().optional(),
  departmentId: z.string().optional(),
  unitId: z.string().optional(),
  featured: z.boolean().optional(),
})

const inputClass =
  'w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#003d7a]/20 focus:border-[#003d7a]'

const textareaClass = `${inputClass} min-h-[100px] resize-y`

function Field({ label, error, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-neutral-700 mb-1">{label}</label>
      {children}
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  )
}

function buildPayload(data) {
  return {
    ...data,
    clientId: data.clientId || null,
    contractId: data.contractId || null,
    departmentId: data.departmentId || null,
  }
}

export function JobFormPage() {
  const { id: routeId } = useParams()
  const isNewRoute = routeId === NEW_JOB_ROUTE
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { hasPermission } = useAuth()
  const canPublish = hasPermission('recruitment:publish')

  const [savedJobId, setSavedJobId] = useState(null)
  const [feedback, setFeedback] = useState('')
  const [feedbackTone, setFeedbackTone] = useState('error')

  const jobId = isNewRoute ? savedJobId : routeId
  const isCreateMode = !jobId

  const { data: jobData, isLoading: loadingJob } = useQuery({
    queryKey: ['admin-job', jobId],
    queryFn: () => jobsService.get(jobId),
    enabled: Boolean(jobId),
  })

  const job = jobData?.job
  const jobStatus = job?.status || 'DRAFT'

  const { data: clients } = useQuery({ queryKey: ['catalog-clients'], queryFn: catalogsService.clients })
  const { data: departments } = useQuery({ queryKey: ['catalog-depts'], queryFn: catalogsService.departments })
  const { data: states } = useQuery({ queryKey: ['catalog-states'], queryFn: catalogsService.states })
  const { data: units } = useQuery({ queryKey: ['catalog-units'], queryFn: catalogsService.units })

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      urgency: 'MEDIUM',
      workModality: 'Presencial',
      employmentType: 'CLT',
      quantity: 1,
      featured: false,
    },
  })

  const clientId = watch('clientId')

  const { data: contracts } = useQuery({
    queryKey: ['catalog-contracts', clientId],
    queryFn: () => catalogsService.contracts(clientId),
    enabled: Boolean(clientId),
  })

  useEffect(() => {
    if (job) {
      reset({
        ...job,
        clientId: job.clientId || '',
        contractId: job.contractId || '',
        departmentId: job.departmentId || '',
        unitId: job.unitId || '',
      })
    }
  }, [job, reset])

  useEffect(() => {
    if (savedJobId && isNewRoute) {
      navigate(`/recrutamento/vagas/${savedJobId}`, { replace: true })
    }
  }, [savedJobId, isNewRoute, navigate])

  async function persistJob(payload) {
    if (isCreateMode) {
      const result = await jobsService.create(payload)
      const createdId = result?.job?.id
      if (!createdId) {
        throw new ApiError('Não foi possível identificar a vaga criada.', 'INVALID_RESPONSE', 500)
      }
      setSavedJobId(createdId)
      await queryClient.invalidateQueries({ queryKey: ['admin-jobs'] })
      await queryClient.invalidateQueries({ queryKey: ['admin-job', createdId] })
      return createdId
    }

    await jobsService.update(jobId, payload)
    await queryClient.invalidateQueries({ queryKey: ['admin-jobs'] })
    await queryClient.invalidateQueries({ queryKey: ['admin-job', jobId] })
    return jobId
  }

  const saveMutation = useMutation({
    mutationFn: async (payload) => persistJob(payload),
    onSuccess: () => {
      setFeedback('')
      if (isCreateMode) return
      navigate('/recrutamento/vagas')
    },
    onError: (err) => {
      setFeedbackTone('error')
      setFeedback(err instanceof ApiError ? err.message : 'Erro ao salvar.')
    },
  })

  const publishMutation = useMutation({
    mutationFn: async ({ payload }) => {
      const targetId = await persistJob(payload)
      await jobsService.publish(targetId)
      return targetId
    },
    onSuccess: () => {
      setFeedbackTone('success')
      setFeedback('Vaga publicada no portal com sucesso.')
      queryClient.invalidateQueries({ queryKey: ['admin-jobs'] })
      navigate('/recrutamento/vagas')
    },
    onError: (err) => {
      setFeedbackTone('error')
      setFeedback(err instanceof ApiError ? err.message : 'Erro ao publicar vaga.')
    },
  })

  async function onSubmit(data) {
    setFeedback('')
    await saveMutation.mutateAsync(buildPayload(data))
  }

  async function onSubmitAndPublish(data) {
    setFeedback('')
    await publishMutation.mutateAsync({ payload: buildPayload(data) })
  }

  const isBusy = isSubmitting || saveMutation.isPending || publishMutation.isPending

  if (!isCreateMode && loadingJob) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (!isCreateMode && !loadingJob && !job) {
    return (
      <div className="space-y-4">
        <Link
          to="/recrutamento/vagas"
          className="inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-900"
        >
          <ArrowLeft size={16} />
          Voltar para vagas
        </Link>
        <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">Vaga não encontrada.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <Link
          to="/recrutamento/vagas"
          className="inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-900 mb-4"
        >
          <ArrowLeft size={16} />
          Voltar para vagas
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">
            {isCreateMode ? 'Nova vaga' : 'Editar vaga'}
          </h1>
          {!isCreateMode && jobStatus === 'PUBLISHED' && <Badge variant="green">Publicada</Badge>}
          {!isCreateMode && jobStatus === 'DRAFT' && <Badge variant="default">Rascunho</Badge>}
          {!isCreateMode && jobStatus === 'PAUSED' && <Badge variant="amber">Pausada</Badge>}
        </div>
        {isCreateMode && (
          <p className="text-sm text-neutral-500 mt-1">
            Preencha os dados e use <strong>Criar e publicar</strong> para enviar a vaga ao portal.
          </p>
        )}
      </div>

      {feedback && (
        <p
          className={`text-sm rounded-lg px-3 py-2 ${
            feedbackTone === 'success'
              ? 'text-emerald-700 bg-emerald-50'
              : 'text-red-600 bg-red-50'
          }`}
        >
          {feedback}
        </p>
      )}

      {saveMutation.error && !feedback && (
        <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
          {saveMutation.error instanceof ApiError ? saveMutation.error.message : 'Erro ao salvar.'}
        </p>
      )}

      <form onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <CardContent className="pt-6 space-y-5">
            <Field label="Título *" error={errors.title?.message}>
              <input className={inputClass} {...register('title')} />
            </Field>

            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Área *" error={errors.area?.message}>
                <input className={inputClass} {...register('area')} />
              </Field>
              <Field label="Nível">
                <input className={inputClass} placeholder="Pleno, Sênior..." {...register('level')} />
              </Field>
            </div>

            <Field label="Descrição *" error={errors.description?.message}>
              <textarea className={textareaClass} {...register('description')} />
            </Field>

            <Field label="Requisitos">
              <textarea className={textareaClass} {...register('requirements')} />
            </Field>

            <Field label="Benefícios">
              <textarea className={textareaClass} {...register('benefits')} />
            </Field>

            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Localização">
                <input className={inputClass} placeholder="Recife, PE" {...register('locationLabel')} />
              </Field>
              <Field label="Estado (UF)">
                <select className={inputClass} {...register('stateCode')}>
                  <option value="">Selecione</option>
                  {states?.items?.map((s) => (
                    <option key={s.id} value={s.code}>{s.name}</option>
                  ))}
                </select>
              </Field>
            </div>

            <Field label="Unidade operacional">
              <select className={inputClass} {...register('unitId')}>
                <option value="">Definir automaticamente pelo estado</option>
                {units?.items?.map((unit) => (
                  <option key={unit.id} value={unit.id}>{unit.name}</option>
                ))}
              </select>
            </Field>

            <div className="grid sm:grid-cols-3 gap-4">
              <Field label="Modalidade">
                <select className={inputClass} {...register('workModality')}>
                  <option value="Presencial">Presencial</option>
                  <option value="Híbrido">Híbrido</option>
                  <option value="Remoto">Remoto</option>
                </select>
              </Field>
              <Field label="Contrato">
                <select className={inputClass} {...register('employmentType')}>
                  <option value="CLT">CLT</option>
                  <option value="PJ">PJ</option>
                  <option value="Temporário">Temporário</option>
                </select>
              </Field>
              <Field label="Urgência">
                <select className={inputClass} {...register('urgency')}>
                  <option value="LOW">Baixa</option>
                  <option value="MEDIUM">Média</option>
                  <option value="HIGH">Alta</option>
                  <option value="CRITICAL">Crítica</option>
                </select>
              </Field>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Cliente">
                <select
                  className={inputClass}
                  {...register('clientId')}
                  onChange={(e) => {
                    setValue('clientId', e.target.value)
                    setValue('contractId', '')
                  }}
                >
                  <option value="">Selecione</option>
                  {clients?.items?.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </Field>
              <Field label="Contrato">
                <select className={inputClass} {...register('contractId')} disabled={!clientId}>
                  <option value="">Selecione</option>
                  {contracts?.items?.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </Field>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Departamento">
                <select className={inputClass} {...register('departmentId')}>
                  <option value="">Selecione</option>
                  {departments?.items?.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </Field>
              <Field label="Quantidade">
                <input type="number" min={1} className={inputClass} {...register('quantity')} />
              </Field>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Escala / Horário">
                <input className={inputClass} placeholder="6x1, 12x36..." {...register('workSchedule')} />
              </Field>
              <Field label="Faixa salarial">
                <input className={inputClass} placeholder="A combinar" {...register('salaryRange')} />
              </Field>
            </div>

            <label className="flex items-center gap-2 text-sm text-neutral-700">
              <input type="checkbox" className="rounded border-neutral-300" {...register('featured')} />
              Destaque na home do portal
            </label>
          </CardContent>
        </Card>

        <div className="flex flex-wrap gap-3 mt-6">
          <Button type="submit" loading={isBusy}>
            {isCreateMode ? 'Salvar rascunho' : 'Salvar alterações'}
          </Button>

          {canPublish && jobStatus !== 'PUBLISHED' && (
            <Button
              type="button"
              variant="secondary"
              loading={isBusy}
              onClick={handleSubmit(onSubmitAndPublish)}
            >
              <Eye size={16} />
              {isCreateMode ? 'Criar e publicar' : 'Salvar e publicar'}
            </Button>
          )}

          <Link to="/recrutamento/vagas">
            <Button variant="secondary" type="button">Cancelar</Button>
          </Link>
        </div>
      </form>
    </div>
  )
}
