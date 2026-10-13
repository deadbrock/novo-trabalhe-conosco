import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { SeoHead } from '@/components/seo/SeoHead'
import { Heading } from '@/components/ui/Heading/Heading'
import { Text } from '@/components/ui/Text/Text'
import { Button } from '@/components/ui/Button/Button'
import { FormField, inputClassName } from '@/features/auth/components/FormField'
import { loginSchema } from '@/features/auth/schemas/authSchemas'
import { useAuth } from '@/context/AuthContext'
import { ApiError } from '@/services/api'
import { ROUTES } from '@/constants/routes'
import { useState } from 'react'

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuth()
  const [apiError, setApiError] = useState('')
  const [needsVerification, setNeedsVerification] = useState(false)
  const [pendingEmail, setPendingEmail] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(loginSchema) })

  async function onSubmit(data) {
    setApiError('')
    setNeedsVerification(false)

    try {
      await login(data)
      const redirectTo = location.state?.from || ROUTES.CANDIDATE_PORTAL
      navigate(redirectTo, { replace: true })
    } catch (error) {
      if (error instanceof ApiError && error.code === 'EMAIL_NOT_VERIFIED') {
        setNeedsVerification(true)
        setPendingEmail(data.email)
      }
      setApiError(error.message || 'Não foi possível entrar.')
    }
  }

  return (
    <>
      <SeoHead title="Login" noindex />

      <Heading as="h1" level={4}>Portal do Candidato</Heading>
      <Text size="sm" className="mt-2">Acesse sua conta para acompanhar candidaturas.</Text>

      {apiError && (
        <div className="mt-6 rounded-xl border border-brand-red-100 bg-brand-red-50 px-4 py-3 text-sm text-brand-red-700" role="alert">
          {apiError}
          {needsVerification && (
            <p className="mt-2">
              <Link to={`${ROUTES.REGISTER_SUCCESS}?email=${encodeURIComponent(pendingEmail)}`} className="font-medium underline">
                Reenviar e-mail de confirmação
              </Link>
            </p>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5" noValidate>
        <FormField id="email" label="E-mail" error={errors.email?.message}>
          <input
            id="email"
            type="email"
            autoComplete="email"
            className={inputClassName}
            aria-invalid={!!errors.email}
            {...register('email')}
          />
        </FormField>

        <FormField id="password" label="Senha" error={errors.password?.message}>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            className={inputClassName}
            aria-invalid={!!errors.password}
            {...register('password')}
          />
        </FormField>

        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? 'Entrando...' : 'Entrar'}
        </Button>
      </form>

      <p className="mt-6 text-sm text-neutral-500 text-center">
        Não tem conta?{' '}
        <Link to={ROUTES.REGISTER} className="font-medium text-brand-red-600 hover:text-brand-red-700">
          Cadastre-se
        </Link>
      </p>
    </>
  )
}
