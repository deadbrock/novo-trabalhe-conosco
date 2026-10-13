import { Section } from '@/components/ui/Section/Section'
import { SectionHeader } from '@/components/ui/SectionHeader/SectionHeader'
import { Card } from '@/components/ui/Card/Card'
import { Text } from '@/components/ui/Text/Text'
import { StaggerChildren, StaggerItem } from '@/components/motion/StaggerChildren'
import { values as defaultValues } from '@/mocks/culture.mock'
import { useCmsSection } from '@/context/CmsContext'
import { ROUTES } from '@/constants/routes'

export function CulturePreviewSection() {
  const valuesCms = useCmsSection('values', { items: defaultValues })
  const values = valuesCms.items || defaultValues

  return (
    <Section className="bg-brand-red-50/40">
      <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-start">
        <div className="lg:col-span-4 lg:sticky lg:top-32">
          <SectionHeader
            badge="Nossa cultura"
            title="Valores que guiam cada decisão"
            description="Cultura não é pôster na parede. É comportamento diário, liderança presente e ambiente onde pessoas prosperam."
            link={ROUTES.CULTURE}
            linkLabel="Explorar nossa cultura"
          />
        </div>

        <StaggerChildren className="lg:col-span-8 grid sm:grid-cols-2 gap-6">
          {values.map((value, index) => (
            <StaggerItem key={value.id}>
              <Card hover className={index === 0 ? 'sm:col-span-2 lg:col-span-1' : ''}>
                <span className="font-display text-xs font-semibold text-brand-blue-600 tracking-widest uppercase">
                  0{index + 1}
                </span>
                <h3 className="mt-3 font-display text-lg font-semibold text-neutral-900">
                  {value.title}
                </h3>
                <Text size="sm" className="mt-2">
                  {value.description}
                </Text>
              </Card>
            </StaggerItem>
          ))}
        </StaggerChildren>
      </div>
    </Section>
  )
}
