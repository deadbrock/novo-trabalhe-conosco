import { forwardRef } from 'react'
import { cn } from '@/utils/cn'

const variants = {
  primary:
    'bg-brand-red-600 text-neutral-0 hover:bg-brand-red-700 active:bg-brand-red-800',
  secondary:
    'bg-brand-blue-600 text-neutral-0 hover:bg-brand-blue-700 active:bg-brand-blue-800',
  outline:
    'border border-brand-blue-200 bg-transparent text-brand-blue-700 hover:border-brand-blue-400 hover:bg-brand-blue-50',
  ghost:
    'bg-transparent text-brand-blue-600 hover:bg-brand-blue-50 hover:text-brand-blue-700',
  link: 'bg-transparent text-brand-red-600 underline-offset-4 hover:text-brand-red-700 hover:underline p-0 h-auto',
}

const sizes = {
  sm: 'h-9 px-4 text-sm',
  md: 'h-11 px-6 text-sm',
  lg: 'h-13 px-8 text-base',
}

export const Button = forwardRef(function Button(
  {
    className,
    variant = 'primary',
    size = 'md',
    asChild = false,
    children,
    ...props
  },
  ref,
) {
  const classes = cn(
    'inline-flex items-center justify-center gap-2 rounded-full font-medium font-display',
    'transition-colors duration-200 ease-out-expo',
    'disabled:pointer-events-none disabled:opacity-50',
    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue-500',
    variants[variant],
    variant !== 'link' && sizes[size],
    className,
  )

  if (asChild) {
    return (
      <span ref={ref} className={classes} {...props}>
        {children}
      </span>
    )
  }

  return (
    <button ref={ref} className={classes} {...props}>
      {children}
    </button>
  )
})
