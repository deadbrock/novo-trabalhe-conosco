import { cn } from '@/utils/cn'

const sizes = {
  lg: 'text-lg md:text-xl leading-relaxed',
  md: 'text-base leading-relaxed',
  sm: 'text-sm leading-relaxed',
  xs: 'text-xs leading-normal tracking-wide uppercase',
}

const colors = {
  default: 'text-neutral-600',
  muted: 'text-neutral-500',
  strong: 'text-neutral-800',
  inverse: 'text-neutral-200',
}

export function Text({ as: Tag = 'p', size = 'md', color = 'default', className, children, ...props }) {
  return (
    <Tag className={cn('font-body text-pretty', sizes[size], colors[color], className)} {...props}>
      {children}
    </Tag>
  )
}
