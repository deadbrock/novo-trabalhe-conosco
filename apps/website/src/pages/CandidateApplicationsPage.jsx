import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { SeoHead } from '@/components/seo/SeoHead'
import { Heading } from '@/components/ui/Heading/Heading'
import { Text } from '@/components/ui/Text/Text'
import { Badge } from '@/components/ui/Badge/Badge'
import { Button } from '@/components/ui/Button/Button'
import { useAuth } from '@/context/AuthContext'
import { candidateService } from '@/services/candidateService'
import { APPLICATION_STATUS, formatApplicationDate } from '@/features/candidate/constants/applicationStatus'
import { ROUTES, jobDetailPath } from '@/constants/routes'

export function CandidateApplicationsPage() {
  const { token } = useAuth()
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    candidateService.getApplications(token).then((data) => {
      setApplications(data.applications)
    }).finally(() => setLoading(false))
  }, [token])

  return (
    <>
      <SeoHead title="Minhas Candidaturas" noindex />

      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <Heading as="h1" level={3}>Minhas candidaturas</Heading>
          <Text className="mt-2">Histórico completo de inscrições em vagas.</Text>
        </div>
        <Link to={ROUTES.JOBS}>
          <Button size="sm">Nova candidatura</Button>
        </Link>
      </div>

      {loading ? (
        <div className="mt-12 flex justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-neutral-200 border-t-brand-red-600 animate-spin" />
        </div>
      ) : !applications.length ? (
        <div className="mt-12 rounded-2xl border border-dashed border-brand-blue-200 bg-white p-10 text-center">
          <Text size="sm">Nenhuma candidatura registrada.</Text>
        </div>
      ) : (
        <div className="mt-10 space-y-4">
          {applications.map((app) => {
            const status = APPLICATION_STATUS[app.status] || APPLICATION_STATUS.pending
            return (
              <div key={app.id} className="rounded-2xl border border-brand-blue-100 bg-white p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <h2 className="font-display text-lg font-semibold text-neutral-900">{app.jobTitle}</h2>
                    <Text size="sm" className="mt-1">
                      {app.area} · {app.location}
                    </Text>
                    <Text size="sm" className="mt-1">
                      Inscrito em {formatApplicationDate(app.createdAt)}
                    </Text>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={status.variant}>{status.label}</Badge>
                    {app.jobSlug && (
                      <Link to={jobDetailPath(app.jobSlug)} className="text-sm font-medium text-brand-blue-600 hover:underline">
                        Ver vaga
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </>
  )
}
