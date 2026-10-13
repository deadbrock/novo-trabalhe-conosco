import { ArrowDown, Award, Building2, MapPin, Store, TrendingUp, Users } from 'lucide-react'
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
import { timeline as defaultTimeline } from '@/mocks/timeline.mock'
import { company, historyContent as defaultHistory } from '@/constants/company'
import { useCmsSection } from '@/context/CmsContext'
import { ROUTES } from '@/constants/routes'
import { cn } from '@/utils/cn'

function HistoryChapter({ period, icon: Icon, title, text, accent }) {
  return (
    <Card hover className="h-full">
      <div className="flex items-start justify-between gap-4">
        <span
          className={cn(
            'flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl',
            accent === 'red' ? 'bg-brand-red-50 text-brand-red-600' : 'bg-brand-blue-50 text-brand-blue-600',
          )}
        >
          <Icon size={20} aria-hidden="true" />
        </span>
        <Badge variant={accent === 'red' ? 'brand' : 'blue'}>{period}</Badge>
      </div>
      <Heading as="h2" level={4} className="mt-6">
        {title}
      </Heading>
      <Text className="mt-4">{text}</Text>
    </Card>
  )
}

function HistoryTimeline({ items }) {
  return (
    <StaggerChildren className="relative">
      <div
        className="absolute left-4 md:left-1/2 top-2 bottom-2 w-px bg-brand-blue-100 md:-translate-x-px"
        aria-hidden="true"
      />
      <div className="space-y-10 md:space-y-6">
        {items.map((item, index) => {
          const isEven = index % 2 === 0
          return (
            <StaggerItem key={`${item.year}-${item.title}`}>
              <div className="relative md:grid md:grid-cols-2 md:gap-16 items-start">
                <div
                  className={cn(
                    'pl-12 md:pl-0',
                    isEven ? 'md:pr-16 md:text-right' : 'md:col-start-2 md:pl-16',
                  )}
                >
                  <span className="font-display text-sm font-semibold tracking-wide text-brand-red-600">
                    {item.year}
                  </span>
                  <h3 className="mt-1 font-display text-xl font-semibold text-neutral-900">{item.title}</h3>
                  <Text size="sm" className={cn('mt-2 max-w-sm', isEven && 'md:ml-auto')}>
                    {item.description}
                  </Text>
                </div>
                <div
                  className="absolute left-4 md:left-1/2 top-1.5 h-3 w-3 -translate-x-1/2 rounded-full bg-brand-red-600 ring-4 ring-neutral-0"
                  aria-hidden="true"
                />
              </div>
            </StaggerItem>
          )
        })}
      </div>
    </StaggerChildren>
  )
}

export function HistoryPage() {
  const history = useCmsSection('history', defaultHistory)
  const timelineCms = useCmsSection('timeline', { items: defaultTimeline })
  const timeline = timelineCms.items || defaultTimeline
  const pageHeader = history.pageHeader || {}
  const yearsOfHistory = new Date().getFullYear() - company.founded

  return (
    <>
      <SeoHead
        title="Nossa História"
        description={`Conheça a trajetória da ${company.name} — de loja de materiais de limpeza em Igarassu/PE a referência nacional em terceirização.`}
      />

      <PageHeader
        badge={pageHeader.badge || 'Nossa História'}
        title={pageHeader.title || 'De Igarassu para todo Nordeste'}
        description={
          pageHeader.description ||
          'Uma jornada de crescimento constante, construída com cuidado, compromisso e pessoas.'
        }
        aside={
          <PageHeroAside
            eyebrow="Nossa jornada em números"
            stats={[
              { value: String(company.founded), label: 'Fundação em Igarassu', icon: Store },
              { value: `${yearsOfHistory}+`, label: 'Anos de história', icon: Building2 },
              { value: '3.500+', label: 'Colaboradores', icon: Users },
              { value: '15', label: 'Estados de atuação', icon: MapPin },
            ]}
            highlight={{
              icon: Award,
              title: 'Certificada GPTW',
              description: 'Great Place to Work desde 2023',
            }}
          />
        }
      >
        <PageHeaderActions>
          <a href="#cronologia">
            <Button type="button" size="lg">
              Ver cronologia
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
        <StaggerChildren className="grid lg:grid-cols-2 gap-6 lg:gap-8">
          <StaggerItem>
            <HistoryChapter
              period="2010 — 2015"
              icon={Store}
              title={history.intro?.title || 'O Início'}
              text={history.intro?.text}
              accent="blue"
            />
          </StaggerItem>
          <StaggerItem>
            <HistoryChapter
              period="2020 — hoje"
              icon={TrendingUp}
              title={history.growth?.title || 'Crescimento e Conquistas'}
              text={history.growth?.text}
              accent="red"
            />
          </StaggerItem>
        </StaggerChildren>
      </Section>

      <Section id="cronologia" className="scroll-mt-28 bg-brand-blue-50/40">
        <SectionHeader
          badge="Cronologia"
          title="Nossos marcos"
          description={`${yearsOfHistory} anos de história, do empreendedorismo local à consolidação como referência nacional em terceirização.`}
        />
        <HistoryTimeline items={timeline} />
      </Section>

      <PageCtaBand
        title="Faça parte da próxima década da FG"
        description="Conheça nossa cultura e descubra onde o seu talento pode crescer com a gente."
        primary={{ label: 'Conheça nossa cultura', to: ROUTES.CULTURE }}
        secondary={{ label: 'Ver vagas abertas', to: ROUTES.JOBS }}
      />
    </>
  )
}
