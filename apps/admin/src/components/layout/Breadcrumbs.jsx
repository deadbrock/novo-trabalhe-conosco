import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/utils/cn'

export function Breadcrumbs({ items, className }) {
  if (!items?.length) return null

  return (
    <nav aria-label="Breadcrumb" className={cn('flex items-center gap-1 text-sm', className)}>
      {items.map((item, index) => {
        const isLast = index === items.length - 1
        return (
          <span key={item.label} className="flex items-center gap-1 min-w-0">
            {index > 0 && <ChevronRight size={14} className="text-neutral-300 shrink-0" />}
            {item.href && !isLast ? (
              <Link to={item.href} className="text-neutral-500 hover:text-neutral-900 truncate">
                {item.label}
              </Link>
            ) : (
              <span className={cn('truncate', isLast ? 'text-neutral-900 font-medium' : 'text-neutral-500')}>
                {item.label}
              </span>
            )}
          </span>
        )
      })}
    </nav>
  )
}
