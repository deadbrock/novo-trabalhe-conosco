import { cn } from '@/utils/cn'
import { Link } from '@/components/ui/Link/Link'
import { ROUTES } from '@/constants/routes'

export function Logo({ className, variant = 'full' }) {
  return (
    <Link
      to={ROUTES.HOME}
      className={cn('inline-flex items-center group', className)}
      aria-label="FG Services — Página inicial"
    >
      <img
        src="/fg-logo.png"
        alt="FG Services"
        width={160}
        height={48}
        className={cn(
          'h-10 w-auto object-contain object-left transition-opacity group-hover:opacity-90',
          variant === 'compact' && 'h-8',
        )}
      />
    </Link>
  )
}
