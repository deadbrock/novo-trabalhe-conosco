import { cn } from '@/utils/cn'

export function Divider({ className, ...props }) {
  return (
    <hr
      className={cn('border-0 border-t border-neutral-200', className)}
      {...props}
    />
  )
}
