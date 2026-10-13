import { useEffect } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { SeoHead } from '@/components/seo/SeoHead'
import { Heading } from '@/components/ui/Heading/Heading'
import { Text } from '@/components/ui/Text/Text'
import { Button } from '@/components/ui/Button/Button'
import { ROUTES } from '@/constants/routes'

export function CandidateSigningPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const signingUrl = location.state?.signingUrl

  useEffect(() => {
    if (!signingUrl) {
      navigate(ROUTES.CANDIDATE_SIGNATURES, { replace: true })
    }
  }, [signingUrl, navigate])

  if (!signingUrl) return null

  return (
    <>
      <SeoHead title="Assinar documento" noindex />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div>
          <Heading as="h1" level={3}>Assinar documento</Heading>
          <Text className="mt-1">Revise o documento e conclua a assinatura eletrônica abaixo.</Text>
        </div>
        <Link to={ROUTES.CANDIDATE_SIGNATURES}>
          <Button variant="outline" size="sm">Voltar</Button>
        </Link>
      </div>

      <div className="rounded-2xl border border-brand-blue-100 bg-white overflow-hidden">
        <iframe
          title="DocuSign"
          src={signingUrl}
          className="w-full min-h-[70vh] border-0"
          allow="geolocation *; microphone *; camera *"
        />
      </div>

      <p className="mt-3 text-xs text-neutral-500">
        Após concluir, você será redirecionado automaticamente. ID: {id}
      </p>
    </>
  )
}
