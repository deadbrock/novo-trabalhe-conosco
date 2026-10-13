import { Section } from '@/components/ui/Section/Section'
import { SectionHeader } from '@/components/ui/SectionHeader/SectionHeader'
import { FadeIn } from '@/components/motion/FadeIn'
import { useCmsSection } from '@/context/CmsContext'

const DEFAULT_CLIENTS = {
  title: 'Empresas que confiam na FG Services',
  items: [],
}

export function ClientsSection() {
  const cms = useCmsSection('clients', DEFAULT_CLIENTS)
  const items = cms.items || []

  if (items.length === 0) return null

  return (
    <Section className="bg-neutral-50">
      <SectionHeader
        title={cms.title || DEFAULT_CLIENTS.title}
        align="center"
      />

      <FadeIn>
        <ul className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
          {items.map((client) => (
            <li key={client.id || client.name} className="flex items-center justify-center">
              {client.logoUrl ? (
                <img
                  src={client.logoUrl}
                  alt={client.name}
                  className="h-10 md:h-12 w-auto object-contain grayscale opacity-70 hover:grayscale-0 hover:opacity-100 transition-all"
                  loading="lazy"
                />
              ) : (
                <span className="text-sm font-medium text-neutral-500">{client.name}</span>
              )}
            </li>
          ))}
        </ul>
      </FadeIn>
    </Section>
  )
}
