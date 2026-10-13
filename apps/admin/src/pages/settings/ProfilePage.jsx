import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { User, Lock, ArrowLeft } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { profileService } from '@/services/settingsService'
import { AvatarUploader } from './AvatarUploader'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { ApiError } from '@/services/api'

const profileSchema = z.object({
  name: z.string().min(2, 'Informe seu nome'),
  phone: z.string().optional(),
  jobTitle: z.string().optional(),
  department: z.string().optional(),
})

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Informe a senha atual'),
    newPassword: z.string().min(8, 'Mínimo de 8 caracteres'),
    confirmPassword: z.string().min(1, 'Confirme a nova senha'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'As senhas não coincidem',
    path: ['confirmPassword'],
  })

const inputClass =
  'w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#003d7a]/20 focus:border-[#003d7a] bg-white'

function Field({ label, hint, error, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-neutral-700 mb-1">{label}</label>
      {children}
      {hint && !error && <p className="text-xs text-neutral-400 mt-1">{hint}</p>}
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  )
}

export function ProfilePage() {
  const { user, refreshUser } = useAuth()
  const [profileFeedback, setProfileFeedback] = useState('')
  const [passwordFeedback, setPasswordFeedback] = useState('')
  const [passwordError, setPasswordError] = useState('')

  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    reset: resetProfile,
    formState: { errors: profileErrors, isDirty: profileDirty },
  } = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: '',
      phone: '',
      jobTitle: '',
      department: '',
    },
  })

  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    reset: resetPassword,
    formState: { errors: passwordErrors },
  } = useForm({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  })

  useEffect(() => {
    if (user) {
      resetProfile({
        name: user.name || '',
        phone: user.phone || '',
        jobTitle: user.jobTitle || '',
        department: user.department || '',
      })
    }
  }, [user, resetProfile])

  const profileMutation = useMutation({
    mutationFn: (data) => profileService.updateProfile(data),
    onSuccess: async () => {
      setProfileFeedback('Perfil salvo com sucesso.')
      await refreshUser()
    },
    onError: (err) => {
      setProfileFeedback(err instanceof ApiError ? err.message : 'Erro ao salvar perfil.')
    },
  })

  const passwordMutation = useMutation({
    mutationFn: (data) =>
      profileService.changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      }),
    onSuccess: () => {
      setPasswordError('')
      setPasswordFeedback('Senha alterada com sucesso.')
      resetPassword()
    },
    onError: (err) => {
      setPasswordFeedback('')
      setPasswordError(err instanceof ApiError ? err.message : 'Erro ao alterar senha.')
    },
  })

  async function handleAvatarUpdated() {
    await refreshUser()
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-800 mb-2"
        >
          <ArrowLeft size={16} />
          Voltar
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">Meu perfil</h1>
        <p className="text-sm text-neutral-500 mt-1">
          Atualize sua foto, dados pessoais e senha de acesso ao sistema.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <User size={18} className="text-blue-600" />
            <h2 className="font-semibold text-neutral-900">Informações pessoais</h2>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <AvatarUploader user={user} onUpdated={handleAvatarUpdated} />

          <form
            onSubmit={handleProfileSubmit((data) => {
              setProfileFeedback('')
              profileMutation.mutate(data)
            })}
            className="space-y-4"
          >
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Nome completo *" error={profileErrors.name?.message}>
                <input type="text" className={inputClass} {...registerProfile('name')} />
              </Field>
              <Field label="E-mail">
                <input type="email" className={`${inputClass} bg-neutral-50 text-neutral-500`} value={user?.email || ''} readOnly disabled />
              </Field>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Cargo" hint="Ex.: Analista de RH, Coordenador de Gente & Gestão" error={profileErrors.jobTitle?.message}>
                <input type="text" className={inputClass} placeholder="Seu cargo na empresa" {...registerProfile('jobTitle')} />
              </Field>
              <Field label="Departamento" error={profileErrors.department?.message}>
                <input type="text" className={inputClass} placeholder="Ex.: Gente & Gestão" {...registerProfile('department')} />
              </Field>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Telefone" error={profileErrors.phone?.message}>
                <input type="tel" className={inputClass} placeholder="(81) 99999-9999" {...registerProfile('phone')} />
              </Field>
              <Field label="Papel no sistema" hint="Definido pelo administrador">
                <input type="text" className={`${inputClass} bg-neutral-50 text-neutral-500`} value={user?.roleName || ''} readOnly disabled />
              </Field>
            </div>

            {profileFeedback && (
              <p className={`text-sm rounded-lg px-3 py-2 ${profileMutation.isError ? 'text-red-700 bg-red-50' : 'text-emerald-700 bg-emerald-50'}`}>
                {profileFeedback}
              </p>
            )}

            <Button type="submit" disabled={profileMutation.isPending || !profileDirty} loading={profileMutation.isPending}>
              Salvar alterações
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Lock size={18} className="text-blue-600" />
            <h2 className="font-semibold text-neutral-900">Alterar senha</h2>
          </div>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handlePasswordSubmit((data) => {
              setPasswordFeedback('')
              setPasswordError('')
              passwordMutation.mutate(data)
            })}
            className="space-y-4 max-w-md"
          >
            <Field label="Senha atual *" error={passwordErrors.currentPassword?.message}>
              <input type="password" className={inputClass} autoComplete="current-password" {...registerPassword('currentPassword')} />
            </Field>
            <Field label="Nova senha *" hint="Mínimo de 8 caracteres" error={passwordErrors.newPassword?.message}>
              <input type="password" className={inputClass} autoComplete="new-password" {...registerPassword('newPassword')} />
            </Field>
            <Field label="Confirmar nova senha *" error={passwordErrors.confirmPassword?.message}>
              <input type="password" className={inputClass} autoComplete="new-password" {...registerPassword('confirmPassword')} />
            </Field>

            {passwordFeedback && <p className="text-sm text-emerald-700 bg-emerald-50 rounded-lg px-3 py-2">{passwordFeedback}</p>}
            {passwordError && <p className="text-sm text-red-700 bg-red-50 rounded-lg px-3 py-2">{passwordError}</p>}

            <Button type="submit" variant="secondary" disabled={passwordMutation.isPending} loading={passwordMutation.isPending}>
              Alterar senha
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
