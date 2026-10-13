import { Section } from '@/components/ui/Section/Section'
import { SectionHeader } from '@/components/ui/SectionHeader/SectionHeader'
import { Text } from '@/components/ui/Text/Text'
import { Link } from '@/components/ui/Link/Link'
import { StaggerChildren, StaggerItem } from '@/components/motion/StaggerChildren'
import { areas as defaultAreas } from '@/mocks/areas.mock'
import { useCmsSection } from '@/context/CmsContext'
import { ROUTES } from '@/constants/routes'

export function AreasPreviewSection() {
  const cms = useCmsSection('areas', { items: defaultAreas })
  const areas = cms.items || defaultAreas

  return (
    <Section className="bg-brand-blue-50/40">
      <SectionHeader
        badge="Áreas de atuação"
        title="Encontre o lugar certo para sua carreira"
        description="Diversas frentes de atuação, todas conectadas por uma cultura de excelência."
        link={ROUTES.AREAS}
        linkLabel="Explorar todas as áreas"
      />

      <StaggerChildren className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-brand-blue-200 rounded-2xl overflow-hidden border border-brand-blue-200">
        {areas.map((area) => (
          <StaggerItem key={area.id}>
            <Link
              to={ROUTES.AREAS}
              className="block bg-neutral-0 p-8 h-full hover:bg-brand-blue-50 transition-colors group"
            >
              <div className="flex items-start justify-between gap-4">
                <h3 className="font-display text-lg font-semibold text-neutral-900 group-hover:text-brand-red-600 transition-colors">
                  {area.title}
                </h3>
                <span className="shrink-0 font-display text-xs font-medium text-brand-blue-600 bg-brand-blue-50 px-2.5 py-1 rounded-full">
                  {area.openings} vagas
                </span>
              </div>
              <Text size="sm" className="mt-3">
                {area.description}
              </Text>
            </Link>
          </StaggerItem>
        ))}
      </StaggerChildren>
    </Section>
  )
}
