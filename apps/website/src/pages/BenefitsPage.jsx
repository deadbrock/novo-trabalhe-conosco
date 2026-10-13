import { ArrowDown, Gift, Heart, HeartPulse, Layers, Sparkles, Trophy, Users, Wallet } from 'lucide-react'
import { SeoHead } from '@/components/seo/SeoHead'
import { PageHeader, PageHeaderActions } from '@/components/layout/PageHeader/PageHeader'
import { PageHeroAside } from '@/components/layout/PageHeroAside/PageHeroAside'
import { PageCtaBand } from '@/components/layout/PageCtaBand/PageCtaBand'
import { Section } from '@/components/ui/Section/Section'
import { SectionHeader } from '@/components/ui/SectionHeader/SectionHeader'
import { Card } from '@/components/ui/Card/Card'
import { Badge } from '@/components/ui/Badge/Badge'
import { Text } from '@/components/ui/Text/Text'
import { Button } from '@/components/ui/Button/Button'
import { Link } from '@/components/ui/Link/Link'
import { StaggerChildren, StaggerItem } from '@/components/motion/StaggerChildren'
import { benefits as defaultBenefits } from '@/mocks/benefits.mock'
import { company } from '@/constants/company'
import { useCmsSection } from '@/context/CmsContext'
import { ROUTES } from '@/constants/routes'

const BENEFIT_ICONS = {
  saude: HeartPulse,
  reconhecimento: Trophy,
  financeiro: Wallet,
}

export function BenefitsPage() {
  const cms = useCmsSection('benefits', {
    pageHeader: {
      badge: 'Benefícios',
      title: 'Investimento real na sua qualidade de vida',
      description: 'Benefícios pensados para sustentar performance, bem-estar e desenvolvimento contínuo.',
    },
    items: defaultBenefits,
  })
  const benefits = cms.items || defaultBenefits
  const pageHeader = cms.pageHeader || {}
  const categories = [...new Set(benefits.map((benefit) => benefit.category).filter(Boolean))]

  return (
    <>
      <SeoHead
        title="Benefícios"
        description={`Conheça o pacote de benefícios completo oferecido pela ${company.name} aos colaboradores.`}
      />

      <PageHeader
        badge={pageHeader.badge || 'Benefícios'}
        title={pageHeader.title || 'Investimento real na sua qualidade de vida'}
        description={
          pageHeader.description ||
          'Benefícios pensados para sustentar performance, bem-estar e desenvolvimento contínuo.'
        }
        aside={
          <PageHeroAside
            eyebrow="Pacote em números"
            stats={[
              { value: String(benefits.length), label: 'Benefícios no pacote', icon: Gift },
              { value: String(categories.length || 3), label: 'Categorias de cuidado', icon: Layers },
              { value: 'GPTW', label: 'Cuidado com pessoas', icon: Heart },
              { value: '3.500+', label: 'Colaboradores', icon: Users },
            ]}
            highlight={{
              icon: Sparkles,
              title: 'Saúde, reconhecimento e equilíbrio',
              description: 'Um pacote pensado para sustentar alta performance',
            }}
          />
        }
      >
        <PageHeaderActions>
          <a href="#beneficios">
            <Button type="button" size="lg">
              Ver benefícios
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

      <Section id="beneficios" className="scroll-mt-28">
        <SectionHeader
          badge="Pacote completo"
          title="Cuidamos de quem constrói nossa excelência"
          description="Cada benefício existe para apoiar saúde, desenvolvimento e qualidade de vida no dia a dia."
        />
        <StaggerChildren className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {benefits.map((benefit) => {
            const Icon = BENEFIT_ICONS[benefit.id] || Sparkles
            return (
              <StaggerItem key={benefit.id}>
                <Card hover className="h-full">
                  <div className="flex items-start justify-between gap-4">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand-blue-50 text-brand-blue-600">
                      <Icon size={20} aria-hidden="true" />
                    </span>
                    <Badge variant="blue">{benefit.category}</Badge>
                  </div>
                  <h3 className="mt-6 font-display text-lg font-semibold text-neutral-900">{benefit.title}</h3>
                  <Text size="sm" className="mt-3">
                    {benefit.description}
                  </Text>
                </Card>
              </StaggerItem>
            )
          })}
        </StaggerChildren>
      </Section>

      <PageCtaBand
        title="Pronto para fazer parte desse cuidado?"
        description="Conheça as áreas de atuação e candidate-se às oportunidades abertas na FG Services."
        primary={{ label: 'Ver áreas de atuação', to: ROUTES.AREAS }}
        secondary={{ label: 'Ver vagas abertas', to: ROUTES.JOBS }}
      />
    </>
  )
}
