import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { useAuth } from '@/context/AuthContext'
import { ApiError } from '@/services/api'
import { Button } from '@/components/ui/Button'

const schema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(1, 'Informe a senha'),
})

export function LoginPage() {
  const { login } = useAuth()
  const [error, setError] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema) })

  async function onSubmit(data) {
    setError('')
    try {
      await login(data)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível entrar.')
    }
  }

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 bg-[#003d7a] text-white p-12 flex-col justify-between">
        <div>
          <p className="text-lg font-semibold tracking-tight">FG Recruit</p>
          <p className="text-white/60 text-sm mt-1">Centro de Operações do RH</p>
        </div>
        <blockquote className="max-w-md">
          <p className="text-2xl font-light leading-relaxed">
            Recrutamento corporativo com precisão, controle e excelência operacional.
          </p>
        </blockquote>
        <p className="text-xs text-white/40">FG Services © {new Date().getFullYear()}</p>
      </div>

      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-[#fafafa]">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-sm"
        >
          <div className="mb-8 lg:hidden text-center">
            <h1 className="text-2xl font-semibold tracking-tight">FG Recruit</h1>
            <p className="text-sm text-neutral-500 mt-1">Centro de Operações do RH</p>
          </div>

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="bg-white border border-neutral-200 rounded-2xl p-6 space-y-4 shadow-sm"
          >
            <div className="mb-2">
              <h2 className="text-lg font-semibold">Entrar</h2>
              <p className="text-sm text-neutral-500">Acesso restrito à equipe FG Services</p>
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2" role="alert">
                {error}
              </p>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-neutral-700 mb-1">
                E-mail corporativo
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#003d7a]/20 focus:border-[#003d7a]"
                {...register('email')}
              />
              {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-neutral-700 mb-1">
                Senha
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#003d7a]/20 focus:border-[#003d7a]"
                {...register('password')}
              />
              {errors.password && <p className="text-xs text-red-600 mt-1">{errors.password.message}</p>}
            </div>

            <Button type="submit" loading={isSubmitting} className="w-full">
              Entrar
            </Button>
          </form>
        </motion.div>
      </div>
    </div>
  )
}
