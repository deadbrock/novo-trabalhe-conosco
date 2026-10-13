import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery } from '@tanstack/react-query'
import { SeoHead } from '@/components/seo/SeoHead'
import { PageHeader } from '@/components/layout/PageHeader/PageHeader'
import { Section } from '@/components/ui/Section/Section'
import { Button } from '@/components/ui/Button/Button'
import { FormField, inputClassName, textareaClassName } from '@/features/auth/components/FormField'
import { ResumeFilePicker } from '@/features/talent-pool/components/ResumeFilePicker'
import { talentPoolService } from '@/services/talentPoolService'
import { publicJobsService } from '@/services/jobsService'
import { ApiError } from '@/services/api'
import { areas as defaultAreas } from '@/mocks/areas.mock'
import { company } from '@/constants/company'
import { useCmsSection } from '@/context/CmsContext'

const CUSTOM_JOB_VALUE = 'custom'

const schema = z.object({
  name: z.string().min(3, 'Informe seu nome completo'),
  email: z.string().email('E-mail inválido'),
  phone: z.string().min(10, 'Telefone inválido'),
  area: z.string().min(1, 'Selecione uma área'),
  desiredJobOption: z.string().min(1, 'Selecione ou informe a vaga pretendida'),
  desiredJobCustom: z.string().optional(),
  linkedin: z.string().url('URL inválida').optional().or(z.literal('')),
  message: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.desiredJobOption === CUSTOM_JOB_VALUE) {
    if (!data.desiredJobCustom?.trim()) {
      ctx.addIssue({
        code: 'custom',
        message: 'Informe a vaga pretendida',
        path: ['desiredJobCustom'],
      })
    }
  }
})

export function TalentPoolPage() {
  const cmsAreas = useCmsSection('areas', { items: defaultAreas })
  const areas = cmsAreas.items || defaultAreas

  const [resumeFile, setResumeFile] = useState(null)
  const [resumeError, setResumeError] = useState('')
  const [submitError, setSubmitError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { desiredJobOption: '' },
  })

  const desiredJobOption = watch('desiredJobOption')

  const { data: jobsData, isError: jobsError, error: jobsQueryError } = useQuery({
    queryKey: ['public-jobs-talent-pool'],
    queryFn: () => publicJobsService.list(),
    retry: 1,
  })

  const uniqueJobs = (jobsData?.jobs || []).map((job) => ({
    slug: job.slug,
    title: job.title,
    area: job.area,
  }))

  async function onSubmit(data) {
    setResumeError('')
    setSubmitError('')

    if (!resumeFile) {
      setResumeError('Envie seu currículo para concluir o cadastro.')
      return
    }

    const selectedJob = uniqueJobs.find((job) => job.slug === data.desiredJobOption)
    const desiredJob =
      data.desiredJobOption === CUSTOM_JOB_VALUE
        ? data.desiredJobCustom.trim()
        : selectedJob?.title || data.desiredJobOption

    const selectedArea = areas.find((area) => area.id === data.area)

    const formData = new FormData()
    formData.append('name', data.name)
    formData.append('email', data.email)
    formData.append('phone', data.phone)
    formData.append('area', data.area)
    formData.append('areaLabel', selectedArea?.title || data.area)
    formData.append('desiredJob', desiredJob)
    formData.append('desiredJobSlug', data.desiredJobOption === CUSTOM_JOB_VALUE ? '' : data.desiredJobOption)
    if (data.linkedin) formData.append('linkedin', data.linkedin)
    if (data.message) formData.append('message', data.message)
    formData.append('resume', resumeFile)

    try {
      const result = await talentPoolService.submit(formData)
      setSuccessMessage(result.message)
      reset()
      setResumeFile(null)
    } catch (err) {
      setSubmitError(err instanceof ApiError ? err.message : 'Não foi possível concluir o cadastro.')
    }
  }

  return (
    <>
      <SeoHead
        title="Banco de Talentos"
        description={`Cadastre-se no banco de talentos da ${company.name} e seja considerado para futuras oportunidades.`}
      />

      <PageHeader
        badge="Banco de Talentos"
        title="Seu perfil, nossas próximas oportunidades"
        description="Nem sempre a vaga ideal está aberta hoje. Deixe seu perfil conosco e entraremos em contato quando surgir a oportunidade certa."
      />

      <Section>
        <div className="max-w-xl">
          {successMessage ? (
            <div className="rounded-2xl border border-brand-blue-100 bg-brand-blue-50 p-8">
              <h2 className="font-display text-xl font-semibold text-brand-blue-700">
                Cadastro realizado com sucesso
              </h2>
              <p className="mt-2 text-sm text-brand-blue-600">{successMessage}</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
              {submitError && (
                <p className="text-sm text-brand-red-700 bg-brand-red-50 rounded-xl px-4 py-3" role="alert">
                  {submitError}
                </p>
              )}

              {jobsError && (
                <p className="text-sm text-amber-800 bg-amber-50 rounded-xl px-4 py-3" role="status">
                  {jobsQueryError instanceof ApiError
                    ? jobsQueryError.message
                    : 'Não foi possível carregar a lista de vagas. Você ainda pode informar uma vaga personalizada.'}
                </p>
              )}

              <FormField id="name" label="Nome completo *" error={errors.name?.message}>
                <input id="name" type="text" className={inputClassName} {...register('name')} />
              </FormField>

              <div className="grid sm:grid-cols-2 gap-6">
                <FormField id="email" label="E-mail *" error={errors.email?.message}>
                  <input id="email" type="email" className={inputClassName} {...register('email')} />
                </FormField>
                <FormField id="phone" label="Telefone *" error={errors.phone?.message}>
                  <input id="phone" type="tel" className={inputClassName} {...register('phone')} />
                </FormField>
              </div>

              <FormField id="area" label="Área de interesse *" error={errors.area?.message}>
                <select id="area" className={`${inputClassName} bg-white`} {...register('area')}>
                  <option value="">Selecione</option>
                  {areas.map((area) => (
                    <option key={area.id} value={area.id}>{area.title}</option>
                  ))}
                </select>
              </FormField>

              <FormField id="desiredJobOption" label="Vaga pretendida *" error={errors.desiredJobOption?.message}>
                <select id="desiredJobOption" className={`${inputClassName} bg-white`} {...register('desiredJobOption')}>
                  <option value="">Selecione uma vaga</option>
                  {uniqueJobs.map((job) => (
                    <option key={job.slug} value={job.slug}>
                      {job.title} — {job.area}
                    </option>
                  ))}
                  <option value={CUSTOM_JOB_VALUE}>Outra vaga (informar abaixo)</option>
                </select>
              </FormField>

              {desiredJobOption === CUSTOM_JOB_VALUE && (
                <FormField id="desiredJobCustom" label="Informe a vaga pretendida *" error={errors.desiredJobCustom?.message}>
                  <input
                    id="desiredJobCustom"
                    type="text"
                    placeholder="Ex: Coordenador de Facilities"
                    className={inputClassName}
                    {...register('desiredJobCustom')}
                  />
                </FormField>
              )}

              <div>
                <p className="block text-sm font-medium text-neutral-700 mb-1.5">Currículo *</p>
                <ResumeFilePicker
                  file={resumeFile}
                  onChange={setResumeFile}
                  error={resumeError}
                  disabled={isSubmitting}
                />
              </div>

              <FormField id="linkedin" label="LinkedIn (opcional)">
                <input
                  id="linkedin"
                  type="url"
                  placeholder="https://linkedin.com/in/seu-perfil"
                  className={inputClassName}
                  {...register('linkedin')}
                />
              </FormField>

              <FormField id="message" label="Mensagem (opcional)">
                <textarea id="message" rows={4} className={textareaClassName} {...register('message')} />
              </FormField>

              <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
                {isSubmitting ? 'Enviando...' : 'Cadastrar no banco de talentos'}
              </Button>
            </form>
          )}
        </div>
      </Section>
    </>
  )
}
