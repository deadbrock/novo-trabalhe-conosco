import { cn } from '@/utils/cn'

export function Avatar({ name, src, className, size = 'md' }) {
  const initials = (name || '?')
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')

  const sizes = {
    sm: 'w-7 h-7 text-[10px]',
    md: 'w-9 h-9 text-xs',
    lg: 'w-11 h-11 text-sm',
  }

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={cn('rounded-full object-cover', sizes[size], className)}
      />
    )
  }

  return (
    <div
      className={cn(
        'rounded-full bg-[#003d7a] text-white font-medium flex items-center justify-center',
        sizes[size],
        className,
      )}
      aria-hidden="true"
    >
      {initials}
    </div>
  )
}
