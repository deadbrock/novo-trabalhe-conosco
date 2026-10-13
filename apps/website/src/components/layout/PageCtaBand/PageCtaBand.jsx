import { ArrowRight } from 'lucide-react'
import { Section } from '@/components/ui/Section/Section'
import { Heading } from '@/components/ui/Heading/Heading'
import { Text } from '@/components/ui/Text/Text'
import { Button } from '@/components/ui/Button/Button'
import { Link } from '@/components/ui/Link/Link'
import { FadeIn } from '@/components/motion/FadeIn'

export function PageCtaBand({ title, description, primary, secondary }) {
  return (
    <Section>
      <FadeIn>
        <div className="relative overflow-hidden rounded-3xl gradient-brand px-8 py-12 md:px-16 md:py-16">
          <div className="absolute inset-0 bg-brand-blue-900/20" aria-hidden="true" />
          <div className="relative max-w-2xl">
            <Heading as="h2" level={3} className="text-neutral-0">
              {title}
            </Heading>
            {description && (
              <Text color="inverse" size="lg" className="mt-4 text-neutral-300">
                {description}
              </Text>
            )}
            <div className="mt-8 flex flex-wrap items-center gap-4">
              {primary && (
                <Link to={primary.to}>
                  <Button type="button" size="lg">
                    {primary.label}
                    <ArrowRight size={18} aria-hidden="true" />
                  </Button>
                </Link>
              )}
              {secondary && (
                <Link to={secondary.to}>
                  <Button
                    type="button"
                    size="lg"
                    variant="outline"
                    className="border-white/30 text-neutral-0 hover:bg-white/10 hover:border-white/50"
                  >
                    {secondary.label}
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </FadeIn>
    </Section>
  )
}
