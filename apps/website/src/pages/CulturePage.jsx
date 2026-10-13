import { ArrowDown, Award, Compass, Heart, Lightbulb, MapPin, ShieldCheck, Target, Users } from 'lucide-react'
import { SeoHead } from '@/components/seo/SeoHead'
import { PageHeader, PageHeaderActions } from '@/components/layout/PageHeader/PageHeader'
import { PageHeroAside } from '@/components/layout/PageHeroAside/PageHeroAside'
import { PageCtaBand } from '@/components/layout/PageCtaBand/PageCtaBand'
import { Section } from '@/components/ui/Section/Section'
import { SectionHeader } from '@/components/ui/SectionHeader/SectionHeader'
import { Heading } from '@/components/ui/Heading/Heading'
import { Text } from '@/components/ui/Text/Text'
import { Card } from '@/components/ui/Card/Card'
import { Badge } from '@/components/ui/Badge/Badge'
import { Button } from '@/components/ui/Button/Button'
import { Link } from '@/components/ui/Link/Link'
import { StaggerChildren, StaggerItem } from '@/components/motion/StaggerChildren'
import { values as defaultValues } from '@/mocks/culture.mock'
import { company } from '@/constants/company'
import { useCmsSection } from '@/context/CmsContext'
import { ROUTES } from '@/constants/routes'

const VALUE_ICONS = {
  excelencia: Target,
  integridade: ShieldCheck,
  inovacao: Lightbulb,
  pessoas: Heart,
}

export function CulturePage() {
  const mission = useCmsSection('mission', {
    purposeTitle: 'Nosso propósito',
    purposeText:
      'Elevar o padrão de serviços corporativos no Brasil, criando valor para clientes e oportunidades significativas de crescimento para nossos colaboradores.',
    pageHeader: {
      badge: 'Nossa Cultura',
      title: 'Cultura vivida, não apenas declarada',
      description:
        'Acreditamos que ambientes de alta performance são construídos com confiança, transparência e investimento real nas pessoas.',
    },
  })
  const valuesCms = useCmsSection('values', { title: 'Nossos valores', items: defaultValues })
  const values = valuesCms.items || defaultValues
  const pageHeader = mission.pageHeader || {}

  return (
    <>
      <SeoHead
        title="Nossa Cultura"
        description={`Descubra os valores, propósito e ambiente de trabalho na ${company.name}.`}
      />

      <PageHeader
        badge={pageHeader.badge || 'Nossa Cultura'}
        title={pageHeader.title || 'Cultura vivida, não apenas declarada'}
        description={pageHeader.description}
        aside={
          <PageHeroAside
            eyebrow="Cultura em números"
            stats={[
              { value: String(values.length), label: 'Valores que guiam', icon: Compass },
              { value: 'GPTW', label: 'Selo desde 2023', icon: Award },
              { value: '3.500+', label: 'Pessoas no time', icon: Users },
              { value: '15', label: 'Estados de atuação', icon: MapPin },
            ]}
            highlight={{
              icon: Heart,
              title: 'Pessoas em primeiro lugar',
              description: 'Cultura vivida no dia a dia, não só no discurso',
            }}
          />
        }
      >
        <PageHeaderActions>
          <a href="#valores">
            <Button type="button" size="lg">
              Ver nossos valores
              <ArrowDown size={18} aria-hidden="true" />
            </Button>
          </a>
          <Link to={ROUTES.JOBS}>
            <Button type="button" variant="outline" size="lg">
              Ver vagas abertas
            </Button>
          </Link>
        </PageHeaderActions>
      </PageHeader>

      <Section>
        <Card className="max-w-4xl">
          <Badge variant="blue">Propósito</Badge>
          <Heading as="h2" level={4} className="mt-6">
            {mission.purposeTitle || 'Nosso propósito'}
          </Heading>
          <Text size="lg" className="mt-4">
            {mission.purposeText}
          </Text>
        </Card>
      </Section>

      <Section id="valores" className="scroll-mt-28 bg-brand-blue-50/40">
        <SectionHeader
          badge="Valores"
          title={valuesCms.title || 'Nossos valores'}
          description="Princípios que orientam decisões, liderança e o jeito de trabalhar na FG Services."
        />
        <StaggerChildren className="grid sm:grid-cols-2 gap-6">
          {values.map((value, index) => {
            const Icon = VALUE_ICONS[value.id] || Compass
            return (
              <StaggerItem key={value.id}>
                <Card hover className="h-full">
                  <div className="flex items-start justify-between gap-4">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand-red-50 text-brand-red-600">
                      <Icon size={20} aria-hidden="true" />
                    </span>
                    <span className="font-display text-xs font-semibold text-brand-blue-600 tracking-widest uppercase">
                      Valor 0{index + 1}
                    </span>
                  </div>
                  <h3 className="mt-6 font-display text-xl font-semibold text-neutral-900">{value.title}</h3>
                  <Text size="sm" className="mt-3">
                    {value.description}
                  </Text>
                </Card>
              </StaggerItem>
            )
          })}
        </StaggerChildren>
      </Section>

      <PageCtaBand
        title="Cresça em um ambiente que valoriza quem você é"
        description="Conheça os benefícios e encontre a vaga alinhada ao seu momento de carreira."
        primary={{ label: 'Ver benefícios', to: ROUTES.BENEFITS }}
        secondary={{ label: 'Ver vagas abertas', to: ROUTES.JOBS }}
      />
    </>
  )
}
