import { SeoHead } from '@/components/seo/SeoHead'
import { JsonLd } from '@/components/seo/JsonLd'
import { company } from '@/constants/company'
import { HeroSection } from '@/features/home/sections/HeroSection'
import { MetricsSection } from '@/features/home/sections/MetricsSection'
import { TimelineSection } from '@/features/home/sections/TimelineSection'
import { CulturePreviewSection } from '@/features/home/sections/CulturePreviewSection'
import { BenefitsPreviewSection } from '@/features/home/sections/BenefitsPreviewSection'
import { TestimonialsSection } from '@/features/home/sections/TestimonialsSection'
import { ClientsSection } from '@/features/home/sections/ClientsSection'
import { AreasPreviewSection } from '@/features/home/sections/AreasPreviewSection'
import { ProcessPreviewSection } from '@/features/home/sections/ProcessPreviewSection'
import { TalentPoolCTASection } from '@/features/home/sections/TalentPoolCTASection'
import { JobsPreviewSection } from '@/features/home/sections/JobsPreviewSection'

const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: company.name,
  url: 'https://carreiras.fgservices.com.br',
  description: company.description,
  foundingDate: String(company.founded),
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'São Paulo',
    addressRegion: 'SP',
    addressCountry: 'BR',
  },
}

export function HomePage() {
  return (
    <>
      <SeoHead
        title="Carreiras"
        description={`${company.description} Conheça a cultura, benefícios e oportunidades na ${company.name}.`}
      />
      <JsonLd data={organizationSchema} />

      <HeroSection />
      <MetricsSection />
      <TimelineSection />
      <CulturePreviewSection />
      <BenefitsPreviewSection />
      <TestimonialsSection />
      <ClientsSection />
      <AreasPreviewSection />
      <ProcessPreviewSection />
      <JobsPreviewSection />
      <TalentPoolCTASection />
    </>
  )
}
