import { cn } from '@/utils/cn'
import { Container } from '../Container/Container'

export function Section({
  id,
  className,
  containerClassName,
  children,
  as: Tag = 'section',
  padding = true,
  ...props
}) {
  return (
    <Tag
      id={id}
      className={cn(padding && 'section-padding', className)}
      {...props}
    >
      <Container className={containerClassName}>{children}</Container>
    </Tag>
  )
}
