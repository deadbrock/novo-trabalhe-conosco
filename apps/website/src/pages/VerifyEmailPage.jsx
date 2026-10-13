import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import { SeoHead } from '@/components/seo/SeoHead'
import { Heading } from '@/components/ui/Heading/Heading'
import { Text } from '@/components/ui/Text/Text'
import { Button } from '@/components/ui/Button/Button'
import { authService } from '@/services/authService'
import { ApiError } from '@/services/api'
import { ROUTES } from '@/constants/routes'

export function VerifyEmailPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const [status, setStatus] = useState('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setMessage('Link de verificação inválido.')
      return
    }

    authService
      .verifyEmail(token)
      .then((result) => {
        setStatus('success')
        setMessage(result.message)
      })
      .catch((error) => {
        setStatus('error')
        setMessage(error instanceof ApiError ? error.message : 'Não foi possível verificar o e-mail.')
      })
  }, [token])

  return (
    <>
      <SeoHead title="Verificação de e-mail" noindex />

      <div className="text-center">
        {status === 'loading' && (
          <>
            <Loader2 className="mx-auto mb-6 text-brand-blue-600 animate-spin" size={40} />
            <Heading as="h1" level={4}>Verificando e-mail...</Heading>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle2 className="mx-auto mb-6 text-brand-blue-600" size={48} aria-hidden="true" />
            <Heading as="h1" level={4}>E-mail confirmado!</Heading>
            <Text size="sm" className="mt-3">{message}</Text>
            <Link to={ROUTES.LOGIN} className="inline-block mt-8">
              <Button className="w-full min-w-[200px]">Fazer login</Button>
            </Link>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle className="mx-auto mb-6 text-brand-red-600" size={48} aria-hidden="true" />
            <Heading as="h1" level={4}>Não foi possível verificar</Heading>
            <Text size="sm" className="mt-3">{message}</Text>
            <Link to={ROUTES.LOGIN} className="inline-block mt-8">
              <Button variant="outline">Voltar ao login</Button>
            </Link>
          </>
        )}
      </div>
    </>
  )
}
