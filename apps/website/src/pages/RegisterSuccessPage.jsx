import { useState } from 'react'
import { Link, useLocation, useSearchParams } from 'react-router-dom'
import { Mail } from 'lucide-react'
import { SeoHead } from '@/components/seo/SeoHead'
import { Heading } from '@/components/ui/Heading/Heading'
import { Text } from '@/components/ui/Text/Text'
import { Button } from '@/components/ui/Button/Button'
import { authService } from '@/services/authService'
import { ApiError } from '@/services/api'
import { ROUTES } from '@/constants/routes'

export function RegisterSuccessPage() {
  const [searchParams] = useSearchParams()
  const location = useLocation()
  const email = searchParams.get('email') || ''
  const [message, setMessage] = useState(location.state?.message || '')
  const [error, setError] = useState(location.state?.emailError || '')
  const [verifyUrl, setVerifyUrl] = useState(location.state?.verifyUrl || '')
  const [emailSent, setEmailSent] = useState(location.state?.emailSent ?? true)
  const [sending, setSending] = useState(false)

  async function handleResend() {
    if (!email) return
    setSending(true)
    setMessage('')
    setError('')
    setVerifyUrl('')

    try {
      const result = await authService.resendVerification(email)
      setMessage(result.message)
      setEmailSent(result.emailSent ?? true)
      if (result.verifyUrl) setVerifyUrl(result.verifyUrl)
      if (result.emailError) setError(result.emailError)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível reenviar.')
    } finally {
      setSending(false)
    }
  }

  return (
    <>
      <SeoHead title="Confirme seu e-mail" noindex />

      <div className="text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-brand-blue-50 text-brand-blue-600 mb-6">
          <Mail size={24} aria-hidden="true" />
        </div>

        <Heading as="h1" level={4}>Verifique seu e-mail</Heading>
        <Text size="sm" className="mt-3">
          {emailSent
            ? <>Enviamos um link de confirmação para <strong className="text-neutral-800">{email || 'seu e-mail'}</strong>.</>
            : <>Não foi possível enviar o e-mail agora. Use o link abaixo para ativar sua conta.</>}
        </Text>

        {verifyUrl && !emailSent && (
          <div className="mt-4 text-left rounded-xl border border-brand-blue-200 bg-brand-blue-50 px-4 py-3">
            <p className="text-xs font-medium text-brand-blue-700 mb-2">Link de verificação (modo desenvolvimento)</p>
            <a href={verifyUrl} className="text-sm text-brand-blue-600 break-all hover:underline">
              {verifyUrl}
            </a>
          </div>
        )}

        {message && (
          <p className="mt-4 text-sm text-brand-blue-700 bg-brand-blue-50 rounded-xl px-4 py-3">{message}</p>
        )}
        {error && (
          <p className="mt-4 text-sm text-brand-red-700 bg-brand-red-50 rounded-xl px-4 py-3" role="alert">{error}</p>
        )}

        <div className="mt-8 flex flex-col gap-3">
          <Button onClick={handleResend} disabled={sending || !email} variant="outline" className="w-full">
            {sending ? 'Reenviando...' : 'Reenviar e-mail de confirmação'}
          </Button>
          <Link to={ROUTES.LOGIN}>
            <Button className="w-full">Ir para login</Button>
          </Link>
        </div>
      </div>
    </>
  )
}
