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
import { ROUTES } from '@/constants/routes'
import { AlertCircle, FileCheck } from 'lucide-react'

export function CandidatePortalPage() {
  const { user, token } = useAuth()
  const [dashboard, setDashboard] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    candidateService.getDashboard(token).then(setDashboard).finally(() => setLoading(false))
  }, [token])

  if (loading) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-neutral-200 border-t-brand-red-600 animate-spin" />
      </div>
    )
  }

  const firstName = user?.name?.split(' ')[0] || 'Candidato'
  const documentationAlerts = dashboard?.documentationAlerts || []

  return (
    <>
      <SeoHead title="Portal do Candidato" noindex />

      <Heading as="h1" level={3}>Olá, {firstName}</Heading>
      <Text className="mt-2">Acompanhe suas candidaturas e mantenha seu perfil atualizado.</Text>

      {documentationAlerts.length > 0 && (
        <div className="mt-8 space-y-3">
          {documentationAlerts.map((alert) => (
            <div
              key={alert.documentationId}
              className="rounded-2xl border border-amber-200 bg-amber-50/70 p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
            >
              <div className="flex gap-3">
                {alert.rejectedItems > 0 ? (
                  <AlertCircle className="text-red-600 shrink-0 mt-0.5" size={22} />
                ) : (
                  <FileCheck className="text-amber-700 shrink-0 mt-0.5" size={22} />
                )}
                <div>
                  <p className="font-semibold text-neutral-900">
                    {alert.rejectedItems > 0 ? 'Documentação com correção pendente' : 'Envio de documentação liberado'}
                  </p>
                  <p className="text-sm text-neutral-700 mt-1">
                    Vaga: {alert.jobTitle}
                    {alert.rejectedItems > 0
                      ? ` — ${alert.rejectedItems} documento(s) reprovado(s). Veja o motivo e reenvie com arquivo legível e boa iluminação.`
                      : ' — envie os documentos solicitados pelo RH com arquivos nítidos e bem iluminados.'}
                  </p>
                </div>
              </div>
              <Link to={ROUTES.CANDIDATE_PRE_ADMISSION}>
                <Button size="sm">
                  {alert.rejectedItems > 0 ? 'Corrigir documentos' : 'Enviar documentação'}
                </Button>
              </Link>
            </div>
          ))}
        </div>
      )}

      <div className="mt-10 grid md:grid-cols-3 gap-6">
        <div className="rounded-2xl border border-brand-blue-100 p-6 bg-white">
          <p className="text-sm text-neutral-500">Candidaturas ativas</p>
          <p className="font-display text-3xl font-semibold text-brand-red-600 mt-1">
            {dashboard?.stats.activeApplications ?? 0}
          </p>
        </div>
        <div className="rounded-2xl border border-brand-blue-100 p-6 bg-white">
          <p className="text-sm text-neutral-500">Entrevistas</p>
          <p className="font-display text-3xl font-semibold text-brand-blue-600 mt-1">
            {dashboard?.stats.interviews ?? 0}
          </p>
        </div>
        <div className="rounded-2xl border border-brand-blue-100 p-6 bg-white">
          <p className="text-sm text-neutral-500">Perfil completo</p>
          <p className="font-display text-3xl font-semibold text-brand-blue-600 mt-1">
            {dashboard?.stats.profileComplete ?? 0}%
          </p>
        </div>
      </div>

      <div className="mt-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-xl font-semibold text-neutral-900">Candidaturas recentes</h2>
          <div className="flex gap-3">
            <Link to={ROUTES.CANDIDATE_PROFILE}>
              <Button variant="outline" size="sm">Completar perfil</Button>
            </Link>
            <Link to={ROUTES.JOBS}>
              <Button size="sm">Ver vagas</Button>
            </Link>
          </div>
        </div>

        {!dashboard?.applications?.length ? (
          <div className="rounded-2xl border border-dashed border-brand-blue-200 bg-white p-10 text-center">
            <Text size="sm">Você ainda não se candidatou a nenhuma vaga.</Text>
            <Link to={ROUTES.JOBS} className="inline-block mt-4">
              <Button size="sm">Explorar vagas abertas</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {dashboard.applications.map((app) => {
              const status = APPLICATION_STATUS[app.status] || APPLICATION_STATUS.pending
              return (
                <div
                  key={app.id}
                  className="rounded-2xl border border-brand-blue-100 p-6 bg-white flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
                >
                  <div>
                    <h3 className="font-display font-semibold text-neutral-900">{app.jobTitle}</h3>
                    <Text size="sm" className="mt-1">
                      Inscrito em {formatApplicationDate(app.createdAt)}
                    </Text>
                  </div>
                  <Badge variant={status.variant}>{status.label}</Badge>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}
