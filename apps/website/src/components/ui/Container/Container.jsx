import { cn } from '@/utils/cn'

export function Container({ className, children, as: Tag = 'div', ...props }) {
  return (
    <Tag className={cn('container-main', className)} {...props}>
      {children}
    </Tag>
  )
}
