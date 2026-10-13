import { useEffect, useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { SeoHead } from '@/components/seo/SeoHead'
import { Heading } from '@/components/ui/Heading/Heading'
import { Text } from '@/components/ui/Text/Text'
import { Button } from '@/components/ui/Button/Button'
import { FormField, inputClassName, textareaClassName } from '@/features/auth/components/FormField'
import { ResumeUploadSection } from '@/features/candidate/components/ResumeUploadSection'
import { ProfileSection } from '@/features/candidate/components/ProfileSection'
import { ExperienceFields } from '@/features/candidate/components/ExperienceFields'
import { CourseFields } from '@/features/candidate/components/CourseFields'
import {
  EDUCATION_LEVELS,
  EMPTY_COURSE,
  EMPTY_EXPERIENCE,
} from '@/features/candidate/constants/profileDefaults'
import { useAuth } from '@/context/AuthContext'
import { candidateService } from '@/services/candidateService'
import { ApiError } from '@/services/api'
import { formatCepInput, formatCpfInput } from '@/utils/cpf'

function buildDefaultValues(user) {
  const profile = user?.profile || {}

  return {
    name: user?.name || '',
    phone: user?.phone || '',
    cpf: profile.cpf || '',
    birthDate: profile.birthDate || '',
    street: profile.street || '',
    addressNumber: profile.addressNumber || '',
    complement: profile.complement || '',
    neighborhood: profile.neighborhood || '',
    zipCode: profile.zipCode || '',
    city: profile.city || '',
    state: profile.state || '',
    linkedin: profile.linkedin || '',
    summary: profile.summary || '',
    educationLevel: profile.educationLevel || '',
    experiences: profile.experiences?.length ? profile.experiences : [{ ...EMPTY_EXPERIENCE }],
    courses: profile.courses?.length ? profile.courses : [{ ...EMPTY_COURSE }],
  }
}

export function CandidateProfilePage() {
  const { user, token, refreshUser } = useAuth()
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  const methods = useForm({ defaultValues: buildDefaultValues(user) })
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = methods

  useEffect(() => {
    if (user) reset(buildDefaultValues(user))
  }, [user, reset])

  async function onSubmit(data) {
    setSaved(false)
    setError('')

    try {
      await candidateService.updateProfile(token, {
        name: data.name,
        phone: data.phone,
        profile: {
          cpf: data.cpf,
          birthDate: data.birthDate || null,
          street: data.street,
          addressNumber: data.addressNumber,
          complement: data.complement,
          neighborhood: data.neighborhood,
          zipCode: data.zipCode,
          city: data.city,
          state: data.state,
          linkedin: data.linkedin,
          summary: data.summary,
          educationLevel: data.educationLevel,
          experiences: data.experiences,
          courses: data.courses,
        },
      })
      await refreshUser()
      setSaved(true)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erro ao salvar perfil.')
    }
  }

  return (
    <>
      <SeoHead title="Meu Perfil" noindex />

      <Heading as="h1" level={3}>Meu perfil</Heading>
      <Text className="mt-2">
        Complete seus dados para que o RH possa conhecer melhor sua trajetória profissional.
      </Text>

      <div className="mt-8 max-w-3xl space-y-8">
        <ResumeUploadSection user={user} token={token} onUpdated={refreshUser} />

        {saved && (
          <p className="text-sm text-brand-blue-700 bg-brand-blue-50 rounded-xl px-4 py-3">
            Perfil atualizado com sucesso.
          </p>
        )}
        {error && (
          <p className="text-sm text-brand-red-700 bg-brand-red-50 rounded-xl px-4 py-3" role="alert">{error}</p>
        )}

        <FormProvider {...methods}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            <ProfileSection title="Dados pessoais" description="Informações básicas para contato e identificação.">
              <FormField id="name" label="Nome completo" error={errors.name?.message}>
                <input id="name" className={inputClassName} {...register('name', { required: 'Informe seu nome' })} />
              </FormField>

              <div className="grid sm:grid-cols-2 gap-5">
                <FormField id="phone" label="Telefone">
                  <input id="phone" type="tel" className={inputClassName} {...register('phone')} />
                </FormField>
                <FormField id="email" label="E-mail">
                  <input
                    id="email"
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className={`${inputClassName} bg-neutral-50 text-neutral-500`}
                  />
                </FormField>
              </div>

              <div className="grid sm:grid-cols-2 gap-5">
                <FormField id="cpf" label="CPF">
                  <input
                    id="cpf"
                    inputMode="numeric"
                    placeholder="000.000.000-00"
                    className={inputClassName}
                    {...register('cpf', {
                      onChange: (event) => setValue('cpf', formatCpfInput(event.target.value), { shouldDirty: true }),
                    })}
                  />
                </FormField>
                <FormField id="birthDate" label="Data de nascimento">
                  <input id="birthDate" type="date" className={inputClassName} {...register('birthDate')} />
                </FormField>
              </div>
            </ProfileSection>

            <ProfileSection title="Endereço" description="Endereço completo para processos seletivos e admissão.">
              <FormField id="street" label="Logradouro">
                <input id="street" className={inputClassName} {...register('street')} />
              </FormField>

              <div className="grid sm:grid-cols-2 gap-5">
                <FormField id="addressNumber" label="Número">
                  <input id="addressNumber" className={inputClassName} {...register('addressNumber')} />
                </FormField>
                <FormField id="complement" label="Complemento">
                  <input id="complement" className={inputClassName} {...register('complement')} />
                </FormField>
              </div>

              <div className="grid sm:grid-cols-2 gap-5">
                <FormField id="neighborhood" label="Bairro">
                  <input id="neighborhood" className={inputClassName} {...register('neighborhood')} />
                </FormField>
                <FormField id="zipCode" label="CEP">
                  <input
                    id="zipCode"
                    inputMode="numeric"
                    placeholder="00000-000"
                    className={inputClassName}
                    {...register('zipCode', {
                      onChange: (event) => setValue('zipCode', formatCepInput(event.target.value), { shouldDirty: true }),
                    })}
                  />
                </FormField>
              </div>

              <div className="grid sm:grid-cols-2 gap-5">
                <FormField id="city" label="Cidade">
                  <input id="city" className={inputClassName} {...register('city')} />
                </FormField>
                <FormField id="state" label="Estado">
                  <input id="state" maxLength={2} placeholder="SP" className={inputClassName} {...register('state')} />
                </FormField>
              </div>
            </ProfileSection>

            <ProfileSection title="Formação e resumo" description="Escolaridade e síntese da sua carreira.">
              <FormField id="educationLevel" label="Escolaridade">
                <select id="educationLevel" className={inputClassName} {...register('educationLevel')}>
                  <option value="">Selecione</option>
                  {EDUCATION_LEVELS.map((level) => (
                    <option key={level.value} value={level.value}>
                      {level.label}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField id="linkedin" label="LinkedIn">
                <input
                  id="linkedin"
                  type="url"
                  placeholder="https://linkedin.com/in/seu-perfil"
                  className={inputClassName}
                  {...register('linkedin')}
                />
              </FormField>

              <FormField id="summary" label="Resumo profissional">
                <textarea id="summary" rows={5} className={textareaClassName} {...register('summary')} />
              </FormField>
            </ProfileSection>

            <ProfileSection title="Experiências profissionais" description="Histórico de empregos e atividades.">
              <ExperienceFields />
            </ProfileSection>

            <ProfileSection title="Cursos e certificações" description="Capacitações relevantes para sua carreira.">
              <CourseFields />
            </ProfileSection>

            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Salvando...' : 'Salvar perfil completo'}
            </Button>
          </form>
        </FormProvider>
      </div>
    </>
  )
}
