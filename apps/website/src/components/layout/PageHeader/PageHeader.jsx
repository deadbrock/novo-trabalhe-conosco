import { Badge } from '@/components/ui/Badge/Badge'
import { Heading } from '@/components/ui/Heading/Heading'
import { Text } from '@/components/ui/Text/Text'
import { Container } from '@/components/ui/Container/Container'
import { FadeIn } from '@/components/motion/FadeIn'
import { cn } from '@/utils/cn'

export function PageHeaderActions({ children }) {
  return <div className="mt-8 flex flex-wrap items-center gap-4">{children}</div>
}

export function PageHeader({ badge, title, description, aside, children }) {
  return (
    <section className="relative overflow-hidden section-padding pt-32 md:pt-40 bg-brand-blue-50 border-b border-brand-blue-100">
      {aside && (
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-bl from-brand-red-100/50 via-transparent to-transparent" />
        </div>
      )}

      <Container className="relative">
        <div className={cn('grid gap-10 lg:gap-16 items-center', aside && 'lg:grid-cols-12')}>
          <FadeIn className={cn(aside ? 'lg:col-span-7 max-w-3xl' : 'max-w-3xl')}>
            {badge && (
              <Badge variant="brand" className="mb-6">
                {badge}
              </Badge>
            )}
            <Heading as="h1" level={2}>
              {title}
            </Heading>
            {description && (
              <Text size="lg" className="mt-5 max-w-2xl">
                {description}
              </Text>
            )}
            {children}
          </FadeIn>

          {aside && (
            <FadeIn delay={0.15} className="lg:col-span-5">
              {aside}
            </FadeIn>
          )}
        </div>
      </Container>
    </section>
  )
}
