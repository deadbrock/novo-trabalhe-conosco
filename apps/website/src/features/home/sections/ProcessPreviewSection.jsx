import { Section } from '@/components/ui/Section/Section'
import { SectionHeader } from '@/components/ui/SectionHeader/SectionHeader'
import { Text } from '@/components/ui/Text/Text'
import { StaggerChildren, StaggerItem } from '@/components/motion/StaggerChildren'
import { processSteps as defaultSteps } from '@/mocks/process.mock'
import { useCmsSection } from '@/context/CmsContext'
import { ROUTES } from '@/constants/routes'

export function ProcessPreviewSection() {
  const process = useCmsSection('process', { steps: defaultSteps })
  const processSteps = process.steps || defaultSteps

  return (
    <Section>
      <SectionHeader
        badge="Processo seletivo"
        title="Transparente, humano e estruturado"
        description="Cada etapa foi desenhada para respeitar seu tempo e oferecer clareza em todo o processo."
        link={ROUTES.PROCESS}
        linkLabel="Entenda o processo completo"
      />

      <StaggerChildren className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
        {processSteps.map((step) => (
          <StaggerItem key={step.step}>
            <div className="relative">
              <span className="font-display text-5xl font-semibold text-brand-blue-100 select-none">
                {String(step.step).padStart(2, '0')}
              </span>
              <h3 className="mt-2 font-display text-base font-semibold text-neutral-900">
                {step.title}
              </h3>
              <Text size="sm" className="mt-2">
                {step.description}
              </Text>
            </div>
          </StaggerItem>
        ))}
      </StaggerChildren>
    </Section>
  )
}
