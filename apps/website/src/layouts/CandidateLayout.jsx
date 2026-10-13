import { useEffect, useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { LayoutDashboard, FileText, User, LogOut, Briefcase, FileCheck, FileSignature } from 'lucide-react'
import { Logo } from '@/components/media/Logo/Logo'
import { SkipLink } from '@/components/layout/SkipLink/SkipLink'
import { useAuth } from '@/context/AuthContext'
import { candidateService } from '@/services/candidateService'
import { ROUTES } from '@/constants/routes'
import { cn } from '@/utils/cn'

const navItems = [
  { to: ROUTES.CANDIDATE_PORTAL, label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: ROUTES.CANDIDATE_APPLICATIONS, label: 'Candidaturas', icon: FileText },
  { to: ROUTES.CANDIDATE_PRE_ADMISSION, label: 'Documentação', icon: FileCheck },
  { to: ROUTES.CANDIDATE_SIGNATURES, label: 'Assinaturas', icon: FileSignature },
  { to: ROUTES.CANDIDATE_PROFILE, label: 'Meu perfil', icon: User },
]

export function CandidateLayout() {
  const { user, logout, token } = useAuth()
  const navigate = useNavigate()
  const [documentationPending, setDocumentationPending] = useState(0)

  useEffect(() => {
    if (!token) return
    candidateService.getDashboard(token)
      .then((data) => setDocumentationPending(data?.stats?.documentationPending || 0))
      .catch(() => setDocumentationPending(0))
  }, [token])

  function handleLogout() {
    logout()
    navigate(ROUTES.LOGIN)
  }

  return (
    <>
      <SkipLink />
      <div className="min-h-screen bg-brand-blue-50/30">
        <header className="bg-neutral-0 border-b border-brand-blue-100">
          <div className="container-main py-4 flex items-center justify-between gap-4">
            <Logo />
            <div className="flex items-center gap-4">
              <NavLink
                to={ROUTES.JOBS}
                className="hidden sm:inline-flex items-center gap-2 text-sm font-medium text-brand-blue-600 hover:text-brand-blue-700"
              >
                <Briefcase size={16} aria-hidden="true" />
                Ver vagas
              </NavLink>
              <div className="text-right hidden md:block">
                <p className="text-sm font-medium text-neutral-800">{user?.name}</p>
                <p className="text-xs text-neutral-500">{user?.email}</p>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center gap-2 text-sm font-medium text-brand-red-600 hover:text-brand-red-700"
              >
                <LogOut size={16} aria-hidden="true" />
                <span className="hidden sm:inline">Sair</span>
              </button>
            </div>
          </div>
        </header>

        <div className="container-main py-8 md:py-10">
          <div className="grid lg:grid-cols-[240px_1fr] gap-8">
            <aside className="lg:sticky lg:top-8 lg:self-start">
              <nav className="flex lg:flex-col gap-1 overflow-x-auto pb-2 lg:pb-0" aria-label="Navegação do portal">
                {navItems.map(({ to, label, icon: Icon, end }) => (
                  <NavLink
                    key={to}
                    to={to}
                    end={end}
                    className={({ isActive }) =>
                      cn(
                        'inline-flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-medium whitespace-nowrap transition-colors',
                        isActive
                          ? 'bg-brand-blue-600 text-white'
                          : 'text-brand-blue-700 hover:bg-brand-blue-50',
                      )
                    }
                  >
                    <Icon size={16} aria-hidden="true" />
                    {label}
                    {to === ROUTES.CANDIDATE_PRE_ADMISSION && documentationPending > 0 && (
                      <span className="ml-auto min-w-[18px] h-[18px] px-1 rounded-full bg-brand-red-600 text-white text-[10px] font-semibold flex items-center justify-center">
                        {documentationPending}
                      </span>
                    )}
                  </NavLink>
                ))}
              </nav>
            </aside>

            <main id="main-content">
              <Outlet />
            </main>
          </div>
        </div>
      </div>
    </>
  )
}
