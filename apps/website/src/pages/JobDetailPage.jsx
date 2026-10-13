import { useState } from 'react'
import { useParams, Navigate, Link as RouterLink } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { MapPin, Briefcase, ArrowLeft } from 'lucide-react'
import { SeoHead } from '@/components/seo/SeoHead'
import { JsonLd } from '@/components/seo/JsonLd'
import { Section } from '@/components/ui/Section/Section'
import { Badge } from '@/components/ui/Badge/Badge'
import { Button } from '@/components/ui/Button/Button'
import { Text } from '@/components/ui/Text/Text'
import { Link } from '@/components/ui/Link/Link'
import { publicJobsService } from '@/services/jobsService'
import { candidateService } from '@/services/candidateService'
import { useAuth } from '@/context/AuthContext'
import { ROUTES } from '@/constants/routes'
import { company } from '@/constants/company'
import { ApiError } from '@/services/api'

function RequirementsList({ text }) {
  if (!text?.trim()) return null
  const items = text.split(/[;\n]/).map((s) => s.trim()).filter(Boolean)
  if (!items.length) return <Text>{text}</Text>
  return (
    <ul className="space-y-2 text-sm text-neutral-600 list-disc pl-5">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  )
}

export function JobDetailPage() {
  const { slug } = useParams()
  const { isAuthenticated, token } = useAuth()
  const [applyMessage, setApplyMessage] = useState('')
  const [applyError, setApplyError] = useState('')
  const [applying, setApplying] = useState(false)

  const { data, isLoading, isError } = useQuery({
    queryKey: ['public-job', slug],
    queryFn: () => publicJobsService.getBySlug(slug),
  })

  const job = data?.job

  if (isLoading) {
    return (
      <Section className="pt-32 md:pt-40">
        <div className="h-8 w-64 bg-neutral-100 rounded animate-pulse mb-8" />
        <div className="h-12 w-full max-w-2xl bg-neutral-100 rounded animate-pulse" />
      </Section>
    )
  }

  if (isError || !job) {
    return <Navigate to={ROUTES.JOBS} replace />
  }

  async function handleApply() {
    if (!isAuthenticated || !token) return
    setApplyError('')
    setApplyMessage('')
    setApplying(true)
    try {
      const result = await candidateService.applyToJob(token, job.id)
      setApplyMessage(result.message)
    } catch (err) {
      setApplyError(err instanceof ApiError ? err.message : 'Erro ao candidatar-se.')
    } finally {
      setApplying(false)
    }
  }

  const jobSchema = {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title: job.title,
    description: job.description,
    datePosted: job.postedAt,
    employmentType: job.contract,
    hiringOrganization: {
      '@type': 'Organization',
      name: company.name,
    },
    jobLocation: {
      '@type': 'Place',
      address: {
        '@type': 'PostalAddress',
        addressLocality: job.location,
        addressCountry: 'BR',
      },
    },
  }

  return (
    <>
      <SeoHead title={job.title} description={job.description} ogType="article" />
      <JsonLd data={jobSchema} />

      <Section className="pt-32 md:pt-40">
        <Link
          to={ROUTES.JOBS}
          className="inline-flex items-center gap-2 text-sm font-medium text-neutral-500 hover:text-neutral-900 transition-colors mb-8"
        >
          <ArrowLeft size={16} aria-hidden="true" />
          Voltar para vagas
        </Link>

        <div className="flex flex-wrap items-center gap-2 mb-4">
          <Badge variant="brand">{job.area}</Badge>
          {job.level && <Badge variant="outline">{job.level}</Badge>}
          <Badge variant="outline">{job.contract}</Badge>
        </div>

        <h1 className="font-display text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tight text-neutral-900 max-w-3xl">
          {job.title}
        </h1>

        <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-neutral-500">
          {job.location && (
            <span className="inline-flex items-center gap-1.5">
              <MapPin size={14} aria-hidden="true" />
              {job.location}
            </span>
          )}
          <span className="inline-flex items-center gap-1.5">
            <Briefcase size={14} aria-hidden="true" />
            {job.type}
          </span>
        </div>

        <div className="mt-12 grid lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-8">
            <div>
              <h2 className="font-display text-xl font-semibold text-neutral-900 mb-4">Sobre a vaga</h2>
              <Text>{job.description}</Text>
            </div>

            {job.requirements && (
              <div>
                <h2 className="font-display text-xl font-semibold text-neutral-900 mb-4">Requisitos</h2>
                <RequirementsList text={job.requirements} />
              </div>
            )}

            {job.benefits && (
              <div>
                <h2 className="font-display text-xl font-semibold text-neutral-900 mb-4">Benefícios</h2>
                <RequirementsList text={job.benefits} />
              </div>
            )}
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-28 rounded-2xl border border-neutral-200 p-6 md:p-8">
              <h2 className="font-display text-lg font-semibold text-neutral-900">Interessado?</h2>
              <Text size="sm" className="mt-2">
                Candidate-se agora ou faça login no portal do candidato para acompanhar sua inscrição.
              </Text>

              {applyMessage && (
                <p className="mt-4 text-sm text-brand-blue-700 bg-brand-blue-50 rounded-xl px-3 py-2">{applyMessage}</p>
              )}
              {applyError && (
                <p className="mt-4 text-sm text-brand-red-700 bg-brand-red-50 rounded-xl px-3 py-2">{applyError}</p>
              )}

              <div className="mt-6 flex flex-col gap-3">
                {isAuthenticated ? (
                  <Button className="w-full" disabled={applying} onClick={handleApply}>
                    {applying ? 'Enviando...' : 'Candidatar-se agora'}
                  </Button>
                ) : (
                  <>
                    <Link to={ROUTES.REGISTER}>
                      <Button className="w-full">Criar conta e candidatar-se</Button>
                    </Link>
                    <Link to={ROUTES.LOGIN}>
                      <Button variant="outline" className="w-full">Já tenho conta</Button>
                    </Link>
                  </>
                )}
                {isAuthenticated && (
                  <RouterLink to={ROUTES.CANDIDATE_APPLICATIONS} className="text-center text-sm text-brand-blue-600 hover:underline">
                    Ver minhas candidaturas
                  </RouterLink>
                )}
              </div>
            </div>
          </div>
        </div>
      </Section>
    </>
  )
}
