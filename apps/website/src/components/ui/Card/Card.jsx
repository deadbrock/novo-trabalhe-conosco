import { cn } from '@/utils/cn'

export function Card({ className, children, hover = false, ...props }) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-brand-blue-100/80 bg-neutral-0 p-6 md:p-8',
        hover && 'transition-shadow duration-300 hover:shadow-soft',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}
