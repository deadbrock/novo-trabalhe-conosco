import { Section } from '@/components/ui/Section/Section'
import { SectionHeader } from '@/components/ui/SectionHeader/SectionHeader'
import { Text } from '@/components/ui/Text/Text'
import { StaggerChildren, StaggerItem } from '@/components/motion/StaggerChildren'
import { timeline as defaultTimeline, timelinePreview as defaultPreview } from '@/mocks/timeline.mock'
import { useCmsSection } from '@/context/CmsContext'
import { ROUTES } from '@/constants/routes'

export function TimelineSection() {
  const cms = useCmsSection('timeline', { items: defaultTimeline, previewYears: [2010, 2015, 2020, 2023, 2025] })
  const items = cms.items || defaultTimeline
  const previewYears = cms.previewYears || [2010, 2015, 2020, 2023, 2025]
  const timelinePreview = items.filter((item) => previewYears.includes(item.year))

  return (
    <Section id="historia">
      <SectionHeader
        badge="Nossa trajetória"
        title="De uma loja local a referência nacional"
        description="Em 2010, nascemos em Igarassu/PE. Hoje, somos referência em terceirização com presença em 15 estados."
        link={ROUTES.HISTORY}
        linkLabel="Conheça nossa história completa"
      />

      <StaggerChildren className="relative">
        <div
          className="absolute left-4 md:left-1/2 top-0 bottom-0 w-px bg-neutral-200 md:-translate-x-px"
          aria-hidden="true"
        />
        <div className="space-y-12 md:space-y-0">
          {timelinePreview.map((item, index) => (
            <StaggerItem key={item.year}>
              <div
                className={`relative md:grid md:grid-cols-2 md:gap-12 items-center ${
                  index % 2 === 0 ? '' : 'md:direction-rtl'
                }`}
              >
                <div
                  className={`pl-12 md:pl-0 ${
                    index % 2 === 0 ? 'md:pr-12 md:text-right' : 'md:col-start-2 md:pl-12 md:text-left'
                  }`}
                >
                  <span className="font-display text-sm font-semibold text-brand-red-600 tracking-wide">
                    {item.year}
                  </span>
                  <h3 className="mt-1 font-display text-xl font-semibold text-neutral-900">
                    {item.title}
                  </h3>
                  <Text size="sm" className="mt-2 max-w-sm ml-auto md:ml-0">
                    {item.description}
                  </Text>
                </div>
                <div
                  className="absolute left-4 md:left-1/2 w-2 h-2 -translate-x-1/2 rounded-full bg-brand-red-600 ring-4 ring-neutral-0"
                  aria-hidden="true"
                />
              </div>
            </StaggerItem>
          ))}
        </div>
      </StaggerChildren>
    </Section>
  )
}
