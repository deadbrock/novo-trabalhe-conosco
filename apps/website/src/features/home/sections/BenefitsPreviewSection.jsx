import { Section } from '@/components/ui/Section/Section'
import { SectionHeader } from '@/components/ui/SectionHeader/SectionHeader'
import { Card } from '@/components/ui/Card/Card'
import { Badge } from '@/components/ui/Badge/Badge'
import { Text } from '@/components/ui/Text/Text'
import { StaggerChildren, StaggerItem } from '@/components/motion/StaggerChildren'
import { benefits as defaultBenefits } from '@/mocks/benefits.mock'
import { useCmsSection } from '@/context/CmsContext'
import { ROUTES } from '@/constants/routes'

export function BenefitsPreviewSection() {
  const cms = useCmsSection('benefits', { items: defaultBenefits })
  const benefits = cms.items || defaultBenefits
  const preview = benefits.slice(0, 4)

  return (
    <Section>
      <SectionHeader
        badge="Benefícios"
        title="Cuidamos de quem constrói nossa excelência"
        description="Pacote completo pensado para qualidade de vida, desenvolvimento e equilíbrio profissional."
        link={ROUTES.BENEFITS}
        linkLabel="Ver todos os benefícios"
      />

      <StaggerChildren className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {preview.map((benefit) => (
          <StaggerItem key={benefit.id}>
            <Card hover className="h-full flex flex-col">
              <Badge variant="blue" className="self-start">
                {benefit.category}
              </Badge>
              <h3 className="mt-4 font-display text-base font-semibold text-neutral-900">
                {benefit.title}
              </h3>
              <Text size="sm" className="mt-2 flex-1">
                {benefit.description}
              </Text>
            </Card>
          </StaggerItem>
        ))}
      </StaggerChildren>
    </Section>
  )
}
