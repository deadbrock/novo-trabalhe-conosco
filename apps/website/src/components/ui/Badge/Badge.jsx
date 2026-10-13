import { cn } from '@/utils/cn'

export function Badge({ className, variant = 'default', children, ...props }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-3 py-1 text-xs font-medium font-display tracking-wide',
        variant === 'default' && 'bg-brand-blue-50 text-brand-blue-700',
        variant === 'brand' && 'bg-brand-red-50 text-brand-red-700',
        variant === 'blue' && 'bg-brand-blue-100 text-brand-blue-700',
        variant === 'outline' && 'border border-brand-blue-200 text-brand-blue-600',
        className,
      )}
      {...props}
    >
      {children}
    </span>
  )
}
