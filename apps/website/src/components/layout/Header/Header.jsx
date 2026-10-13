import { useState } from 'react'
import { Menu, X } from 'lucide-react'
import { m, AnimatePresence } from 'framer-motion'
import { cn } from '@/utils/cn'
import { Logo } from '@/components/media/Logo/Logo'
import { Link } from '@/components/ui/Link/Link'
import { Button } from '@/components/ui/Button/Button'
import { mainNavigation } from '@/constants/navigation'
import { ROUTES } from '@/constants/routes'
import { useAuth } from '@/context/AuthContext'
import { useHeaderScroll } from './useHeaderScroll'

export function Header() {
  const scrolled = useHeaderScroll()
  const [mobileOpen, setMobileOpen] = useState(false)
  const { isAuthenticated } = useAuth()

  return (
    <>
      <header
        className={cn(
          'fixed top-0 inset-x-0 z-50 transition-all duration-300 ease-out-expo',
          scrolled
            ? 'bg-neutral-0/95 backdrop-blur-md border-b border-brand-blue-100 shadow-subtle py-3'
            : 'bg-transparent py-5',
        )}
      >
        <div className="container-main flex items-center justify-between gap-6">
          <Logo />

          <nav className="hidden lg:flex items-center gap-1" aria-label="Navegação principal">
            {mainNavigation.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className="px-3.5 py-2 text-sm font-medium text-brand-blue-700 hover:text-brand-red-600 rounded-full hover:bg-brand-blue-50 transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="hidden lg:flex items-center gap-3">
            <Link
              to={ROUTES.TALENT_POOL}
              className="text-sm font-medium text-brand-red-600 hover:text-brand-red-700 transition-colors px-3 py-2"
            >
              Banco de Talentos
            </Link>
            <Link to={isAuthenticated ? ROUTES.CANDIDATE_PORTAL : ROUTES.LOGIN}>
              <Button variant="secondary" size="sm">
                {isAuthenticated ? 'Meu portal' : 'Portal do Candidato'}
              </Button>
            </Link>
          </div>

          <button
            type="button"
            className="lg:hidden inline-flex items-center justify-center w-10 h-10 rounded-full border border-brand-blue-200 text-brand-blue-700 hover:bg-brand-blue-50 transition-colors"
            onClick={() => setMobileOpen(true)}
            aria-label="Abrir menu"
          >
            <Menu size={20} />
          </button>
        </div>
      </header>

      <AnimatePresence>
        {mobileOpen && (
          <>
            <m.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[60] bg-brand-blue-900/40 backdrop-blur-sm lg:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <m.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="fixed top-0 right-0 bottom-0 z-[70] w-full max-w-sm bg-neutral-0 lg:hidden flex flex-col"
              role="dialog"
              aria-modal="true"
              aria-label="Menu de navegação"
            >
              <div className="flex items-center justify-between p-6 border-b border-neutral-200">
                <Logo />
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  className="inline-flex items-center justify-center w-10 h-10 rounded-full border border-neutral-200"
                  aria-label="Fechar menu"
                >
                  <X size={20} />
                </button>
              </div>
              <nav className="flex-1 overflow-y-auto p-6 flex flex-col gap-1" aria-label="Navegação mobile">
                {mainNavigation.map((item) => (
                  <Link
                    key={item.href}
                    to={item.href}
                    onClick={() => setMobileOpen(false)}
                    className="px-4 py-3 text-base font-medium text-brand-blue-800 hover:bg-brand-blue-50 rounded-xl transition-colors"
                  >
                    {item.label}
                  </Link>
                ))}
                <Link
                  to={ROUTES.TALENT_POOL}
                  onClick={() => setMobileOpen(false)}
                  className="px-4 py-3 text-base font-medium text-neutral-800 hover:bg-neutral-50 rounded-xl transition-colors"
                >
                  Banco de Talentos
                </Link>
              </nav>
              <div className="p-6 border-t border-neutral-200 flex flex-col gap-3">
                <Link
                  to={isAuthenticated ? ROUTES.CANDIDATE_PORTAL : ROUTES.LOGIN}
                  onClick={() => setMobileOpen(false)}
                >
                  <Button className="w-full">{isAuthenticated ? 'Meu portal' : 'Portal do Candidato'}</Button>
                </Link>
              </div>
            </m.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
