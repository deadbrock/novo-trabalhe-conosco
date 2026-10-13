import { useRef, useState } from 'react'
import { Logo } from '@/components/media/Logo/Logo'
import { Link } from '@/components/ui/Link/Link'
import { Text } from '@/components/ui/Text/Text'
import { Divider } from '@/components/ui/Divider/Divider'
import { AboutSystemModal } from '@/components/common/AboutSystemModal'
import { footerNavigation } from '@/constants/navigation'
import { company } from '@/constants/company'
import { PORTAL_META } from '@/constants/portal'
import { ROUTES } from '@/constants/routes'
import { useCmsSection } from '@/context/CmsContext'
import { cn } from '@/utils/cn'

const DEFAULT_FOOTER = {
  tagline: company.tagline,
  legalName: company.legalName,
  cnpj: company.cnpj,
  email: company.email,
  phone: company.phone,
  headquarters: company.headquarters,
  privacyLabel: 'Política de Privacidade',
  privacyHref: ROUTES.HOME,
  termsLabel: 'Termos de Uso',
  termsHref: ROUTES.HOME,
}

export function Footer() {
  const footer = useCmsSection('footer', DEFAULT_FOOTER)
  const [aboutOpen, setAboutOpen] = useState(false)
  const authorTriggerRef = useRef(null)

  return (
    <>
      <footer className="gradient-brand-vertical text-neutral-200">
        <div className="container-main py-16 md:py-20">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 lg:gap-8">
            <div className="lg:col-span-4">
              <Logo className="bg-white rounded-xl px-3 py-2" />
              <Text color="inverse" size="sm" className="mt-4 max-w-xs text-neutral-400">
                {footer.tagline}
              </Text>
            </div>

            <div className="lg:col-span-2 lg:col-start-6">
              <h3 className="font-display text-sm font-semibold text-neutral-0 mb-4">Empresa</h3>
              <ul className="space-y-3">
                {footerNavigation.empresa.map((item) => (
                  <li key={item.href}>
                    <Link
                      to={item.href}
                      className="text-sm text-neutral-400 hover:text-neutral-0 transition-colors"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="lg:col-span-2">
              <h3 className="font-display text-sm font-semibold text-neutral-0 mb-4">Carreiras</h3>
              <ul className="space-y-3">
                {footerNavigation.carreiras.map((item) => (
                  <li key={item.href}>
                    <Link
                      to={item.href}
                      className="text-sm text-neutral-400 hover:text-neutral-0 transition-colors"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="lg:col-span-3">
              <h3 className="font-display text-sm font-semibold text-neutral-0 mb-4">Contato</h3>
              <ul className="space-y-3 text-sm text-neutral-400">
                <li>
                  <a href={`mailto:${footer.email}`} className="hover:text-neutral-0 transition-colors">
                    {footer.email}
                  </a>
                </li>
                <li>{footer.phone}</li>
                <li>{footer.headquarters}</li>
              </ul>
            </div>
          </div>

          <Divider className="my-10 border-brand-blue-700/50" />

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 text-xs text-neutral-500">
            <p>
              © {new Date().getFullYear()} {footer.legalName}. CNPJ {footer.cnpj}
            </p>
            <div className="flex gap-6">
              <Link to={footer.privacyHref || ROUTES.HOME} className="hover:text-brand-red-200 transition-colors">
                {footer.privacyLabel}
              </Link>
              <Link to={footer.termsHref || ROUTES.HOME} className="hover:text-brand-red-200 transition-colors">
                {footer.termsLabel}
              </Link>
            </div>
          </div>
        </div>

        <div className="border-t border-brand-blue-700/30">
          <div className="container-main py-8 text-center space-y-1.5">
            <p className="text-xs text-neutral-500">© 2026 FG Services</p>
            <p className="text-xs text-neutral-500">
              Portal de Carreiras • Versão {PORTAL_META.version}
            </p>
            <p className="text-xs text-neutral-500">
              Desenvolvido por{' '}
              <button
                ref={authorTriggerRef}
                type="button"
                onClick={() => setAboutOpen(true)}
                className={cn(
                  'inline p-0 border-0 bg-transparent font-inherit text-inherit',
                  'text-brand-blue-200 cursor-pointer',
                  'transition-colors duration-200 ease-out-expo',
                  'hover:text-brand-blue-100 hover:underline underline-offset-2',
                )}
              >
                {PORTAL_META.developer.name}
              </button>
            </p>
          </div>
        </div>
      </footer>

      <AboutSystemModal
        isOpen={aboutOpen}
        onClose={() => setAboutOpen(false)}
        returnFocusRef={authorTriggerRef}
      />
    </>
  )
}
