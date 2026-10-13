import { Outlet } from 'react-router-dom'
import { Logo } from '@/components/media/Logo/Logo'
import { SkipLink } from '@/components/layout/SkipLink/SkipLink'

export function AuthLayout() {
  return (
    <>
      <SkipLink />
      <div className="min-h-screen grid lg:grid-cols-2">
        <div className="hidden lg:flex flex-col justify-between gradient-brand-vertical p-12 text-neutral-0">
          <Logo className="bg-white rounded-xl px-3 py-2 w-fit" />
          <div>
            <blockquote className="font-display text-3xl font-semibold leading-tight tracking-tight max-w-md">
              Junte-se a quem transforma serviços corporativos com excelência.
            </blockquote>
            <p className="mt-4 text-neutral-400 text-sm max-w-sm">
              Acesse seu portal para acompanhar candidaturas, atualizar perfil e receber novidades.
            </p>
          </div>
          <p className="text-xs text-neutral-600">© FG Services</p>
        </div>
        <div className="flex flex-col min-h-screen">
          <div className="lg:hidden p-6 border-b border-neutral-200">
            <Logo />
          </div>
          <div className="flex-1 flex items-center justify-center p-6 md:p-12">
            <div className="w-full max-w-md">
              <Outlet />
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
