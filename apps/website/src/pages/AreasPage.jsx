import { ArrowDown, ArrowRight, Briefcase, Building2, Cog, Handshake, MapPin, Monitor, Users } from 'lucide-react'
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
import { areas as defaultAreas } from '@/mocks/areas.mock'
import { ROUTES } from '@/constants/routes'
import { company } from '@/constants/company'
import { useCmsSection } from '@/context/CmsContext'

const AREA_ICONS = {
  operacoes: Cog,
  comercial: Handshake,
  'gente-gestao': Users,
  tecnologia: Monitor,
  facilities: Building2,
}

export function AreasPage() {
  const cms = useCmsSection('areas', {
    pageHeader: {
      badge: 'Áreas de Atuação',
      title: 'Diversas frentes, uma mesma excelência',
      description: 'Encontre a área que combina com seu perfil e veja as oportunidades disponíveis.',
    },
    items: defaultAreas,
  })
  const areas = cms.items || defaultAreas
  const pageHeader = cms.pageHeader || {}
  const totalOpenings = areas.reduce((sum, area) => sum + (Number(area.openings) || 0), 0)

  return (
    <>
      <SeoHead
        title="Áreas de Atuação"
        description={`Explore as áreas de atuação e oportunidades de carreira na ${company.name}.`}
      />

      <PageHeader
        badge={pageHeader.badge || 'Áreas de Atuação'}
        title={pageHeader.title || 'Diversas frentes, uma mesma excelência'}
        description={pageHeader.description}
        aside={
          <PageHeroAside
            eyebrow="Onde você pode crescer"
            stats={[
              { value: String(areas.length), label: 'Frentes de atuação', icon: Briefcase },
              { value: String(totalOpenings), label: 'Vagas nestas áreas', icon: Users },
              { value: '15', label: 'Estados de atuação', icon: MapPin },
              { value: '3.500+', label: 'Colaboradores', icon: Building2 },
            ]}
            highlight={{
              icon: Handshake,
              title: 'Uma cultura, várias trajetórias',
              description: 'Excelência operacional conectada em todas as áreas',
            }}
          />
        }
      >
        <PageHeaderActions>
          <a href="#areas">
            <Button type="button" size="lg">
              Explorar áreas
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

      <Section id="areas" className="scroll-mt-28">
        <SectionHeader
          badge="Áreas"
          title="Encontre o lugar certo para sua carreira"
          description="Diversas frentes de atuação, todas conectadas por uma cultura de excelência."
        />
        <StaggerChildren className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {areas.map((area) => {
            const Icon = AREA_ICONS[area.id] || Briefcase
            return (
              <StaggerItem key={area.id}>
                <Card hover className="h-full flex flex-col">
                  <div className="flex items-start justify-between gap-4">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand-blue-50 text-brand-blue-600">
                      <Icon size={20} aria-hidden="true" />
                    </span>
                    {area.openings != null && <Badge variant="brand">{area.openings} vagas</Badge>}
                  </div>
                  <h3 className="mt-6 font-display text-xl font-semibold text-neutral-900">{area.title}</h3>
                  <Text size="sm" className="mt-3 flex-1">
                    {area.description}
                  </Text>
                  <Link
                    to={ROUTES.JOBS}
                    className="inline-flex items-center gap-2 mt-6 text-sm font-medium text-brand-red-600 hover:text-brand-red-700 transition-colors group"
                  >
                    Ver vagas desta área
                    <ArrowRight
                      size={16}
                      className="transition-transform group-hover:translate-x-0.5"
                      aria-hidden="true"
                    />
                  </Link>
                </Card>
              </StaggerItem>
            )
          })}
        </StaggerChildren>
      </Section>

      <PageCtaBand
        title="Encaixe seu talento na frente certa"
        description="Entenda o processo seletivo e candidate-se às vagas alinhadas ao seu perfil."
        primary={{ label: 'Entenda o processo', to: ROUTES.PROCESS }}
        secondary={{ label: 'Ver vagas abertas', to: ROUTES.JOBS }}
      />
    </>
  )
}
