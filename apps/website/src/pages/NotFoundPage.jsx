import { SeoHead } from '@/components/seo/SeoHead'
import { Section } from '@/components/ui/Section/Section'
import { Heading } from '@/components/ui/Heading/Heading'
import { Text } from '@/components/ui/Text/Text'
import { Button } from '@/components/ui/Button/Button'
import { Link } from '@/components/ui/Link/Link'
import { ROUTES } from '@/constants/routes'

export function NotFoundPage() {
  return (
    <>
      <SeoHead title="Página não encontrada" noindex />

      <Section className="min-h-[60vh] flex items-center">
        <div className="text-center max-w-md mx-auto">
          <p className="font-display text-8xl font-semibold text-neutral-100 select-none">404</p>
          <Heading as="h1" level={4} className="mt-4">Página não encontrada</Heading>
          <Text size="sm" className="mt-3">
            A página que você procura não existe ou foi movida.
          </Text>
          <Link to={ROUTES.HOME} className="inline-block mt-8">
            <Button>Voltar ao início</Button>
          </Link>
        </div>
      </Section>
    </>
  )
}
