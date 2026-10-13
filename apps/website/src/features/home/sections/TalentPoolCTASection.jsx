import { ArrowRight } from 'lucide-react'
import { Section } from '@/components/ui/Section/Section'
import { Heading } from '@/components/ui/Heading/Heading'
import { Text } from '@/components/ui/Text/Text'
import { Button } from '@/components/ui/Button/Button'
import { Link } from '@/components/ui/Link/Link'
import { FadeIn } from '@/components/motion/FadeIn'
import { ROUTES } from '@/constants/routes'

export function TalentPoolCTASection() {
  return (
    <Section className="bg-brand-red-50/30">
      <FadeIn>
        <div className="relative rounded-3xl overflow-hidden gradient-brand px-8 py-12 md:px-16 md:py-16">
          <div
            className="absolute inset-0 bg-brand-blue-900/20"
            aria-hidden="true"
          />
          <div className="relative max-w-2xl">
            <Heading as="h2" level={3} className="text-neutral-0">
              Não encontrou a vaga ideal? Entre no nosso banco de talentos
            </Heading>
            <Text color="inverse" size="lg" className="mt-4 text-neutral-400">
              Cadastre seu perfil e seja considerado para oportunidades futuras alinhadas à sua
              experiência e interesses.
            </Text>
            <Link to={ROUTES.TALENT_POOL} className="inline-block mt-8">
              <Button size="lg">
                Cadastrar no banco de talentos
                <ArrowRight size={18} aria-hidden="true" />
              </Button>
            </Link>
          </div>
        </div>
      </FadeIn>
    </Section>
  )
}
