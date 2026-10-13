import { cn } from '@/utils/cn'

const levels = {
  1: 'text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-semibold tracking-tight leading-[1.05]',
  2: 'text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tight leading-[1.1]',
  3: 'text-2xl md:text-3xl font-semibold tracking-tight leading-[1.15]',
  4: 'text-xl md:text-2xl font-semibold tracking-tight leading-[1.2]',
  5: 'text-lg md:text-xl font-medium tracking-tight leading-[1.25]',
}

export function Heading({ as: Tag = 'h2', level = 2, className, children, ...props }) {
  return (
    <Tag
      className={cn('font-display text-neutral-900 text-balance', levels[level], className)}
      {...props}
    >
      {children}
    </Tag>
  )
}
