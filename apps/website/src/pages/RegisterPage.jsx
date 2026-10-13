import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { SeoHead } from '@/components/seo/SeoHead'
import { Heading } from '@/components/ui/Heading/Heading'
import { Text } from '@/components/ui/Text/Text'
import { Button } from '@/components/ui/Button/Button'
import { FormField, inputClassName } from '@/features/auth/components/FormField'
import { registerSchema } from '@/features/auth/schemas/authSchemas'
import { useAuth } from '@/context/AuthContext'
import { ApiError } from '@/services/api'
import { ROUTES } from '@/constants/routes'
import { useState } from 'react'

export function RegisterPage() {
  const navigate = useNavigate()
  const { register: registerAccount } = useAuth()
  const [apiError, setApiError] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: { acceptTerms: false },
  })

  async function onSubmit(data) {
    setApiError('')

    try {
      const { confirmPassword, ...payload } = data
      const result = await registerAccount(payload)
      navigate(`${ROUTES.REGISTER_SUCCESS}?email=${encodeURIComponent(data.email)}`, {
        state: {
          verifyUrl: result.verifyUrl,
          emailSent: result.emailSent,
          emailError: result.emailError,
          message: result.message,
        },
      })
    } catch (error) {
      setApiError(error instanceof ApiError ? error.message : 'Não foi possível criar a conta.')
    }
  }

  return (
    <>
      <SeoHead title="Cadastro" noindex />

      <Heading as="h1" level={4}>Criar conta</Heading>
      <Text size="sm" className="mt-2">
        Cadastre-se para se candidatar e acompanhar processos. Enviaremos um e-mail de confirmação via SendGrid.
      </Text>

      {apiError && (
        <div className="mt-6 rounded-xl border border-brand-red-100 bg-brand-red-50 px-4 py-3 text-sm text-brand-red-700" role="alert">
          {apiError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5" noValidate>
        <FormField id="name" label="Nome completo" error={errors.name?.message}>
          <input id="name" type="text" autoComplete="name" className={inputClassName} {...register('name')} />
        </FormField>

        <FormField id="email" label="E-mail" error={errors.email?.message}>
          <input id="email" type="email" autoComplete="email" className={inputClassName} {...register('email')} />
        </FormField>

        <FormField id="phone" label="Telefone (opcional)" error={errors.phone?.message}>
          <input id="phone" type="tel" autoComplete="tel" className={inputClassName} {...register('phone')} />
        </FormField>

        <FormField id="password" label="Senha" error={errors.password?.message}>
          <input id="password" type="password" autoComplete="new-password" className={inputClassName} {...register('password')} />
        </FormField>

        <FormField id="confirmPassword" label="Confirmar senha" error={errors.confirmPassword?.message}>
          <input id="confirmPassword" type="password" autoComplete="new-password" className={inputClassName} {...register('confirmPassword')} />
        </FormField>

        <label className="flex items-start gap-3 cursor-pointer">
          <input type="checkbox" className="mt-1 rounded border-neutral-300" {...register('acceptTerms')} />
          <span className="text-sm text-neutral-600">
            Li e aceito os{' '}
            <Link to={ROUTES.HOME} className="text-brand-blue-600 hover:underline">termos de uso</Link>
            {' '}e a{' '}
            <Link to={ROUTES.HOME} className="text-brand-blue-600 hover:underline">política de privacidade</Link>.
          </span>
        </label>
        {errors.acceptTerms && (
          <p className="text-xs text-brand-red-600" role="alert">{errors.acceptTerms.message}</p>
        )}

        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? 'Criando conta...' : 'Criar conta'}
        </Button>
      </form>

      <p className="mt-6 text-sm text-neutral-500 text-center">
        Já tem conta?{' '}
        <Link to={ROUTES.LOGIN} className="font-medium text-brand-red-600 hover:text-brand-red-700">
          Faça login
        </Link>
      </p>
    </>
  )
}
