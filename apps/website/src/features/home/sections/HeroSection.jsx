import { ArrowRight } from 'lucide-react'
import { Section } from '@/components/ui/Section/Section'
import { Heading } from '@/components/ui/Heading/Heading'
import { Text } from '@/components/ui/Text/Text'
import { Button } from '@/components/ui/Button/Button'
import { Badge } from '@/components/ui/Badge/Badge'
import { Link } from '@/components/ui/Link/Link'
import { FadeIn } from '@/components/motion/FadeIn'
import { InstitutionalVideo } from '@/components/media/Video/InstitutionalVideo'
import { ROUTES } from '@/constants/routes'
import { company } from '@/constants/company'
import { useCmsSection } from '@/context/CmsContext'

const DEFAULT_HERO = {
  badge: `Carreiras · ${company.name}`,
  title: 'Construa sua carreira em uma empresa que valoriza excelência',
  titleHighlight: 'valoriza excelência',
  description: `${company.description} Descubra nossa cultura, nossos benefícios e o ambiente onde profissionais de alto calibre crescem de verdade.`,
  primaryCta: { label: 'Conheça nossa cultura', href: ROUTES.CULTURE },
  secondaryCta: { label: 'Ver vagas abertas', href: ROUTES.JOBS },
  videoSrc: '/fg.mp4',
  videoLabel: 'Vídeo institucional FG Services',
}

function renderTitle(title, highlight) {
  if (!highlight || !title.includes(highlight)) return title
  const [before, after] = title.split(highlight)
  return (
    <>
      {before}
      <span className="gradient-text">{highlight}</span>
      {after}
    </>
  )
}

export function HeroSection() {
  const hero = useCmsSection('hero', DEFAULT_HERO)

  return (
    <Section padding={false} className="relative min-h-[92vh] flex items-center overflow-hidden pt-24">
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-brand-blue-50/30" />
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-bl from-brand-red-100/50 via-transparent to-brand-blue-100/60" />
        <div
          className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-brand-red-200 via-brand-blue-200 to-brand-red-200"
          aria-hidden="true"
        />
      </div>

      <div className="container-main py-16 md:py-24">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          <div className="lg:col-span-7">
            <FadeIn delay={0}>
              <Badge variant="blue" className="mb-6">
                {hero.badge}
              </Badge>
            </FadeIn>

            <FadeIn delay={0.1}>
              <Heading as="h1" level={1} className="max-w-3xl">
                {renderTitle(hero.title, hero.titleHighlight)}
              </Heading>
            </FadeIn>

            <FadeIn delay={0.2}>
              <Text size="lg" className="mt-6 max-w-xl">
                {hero.description}
              </Text>
            </FadeIn>

            <FadeIn delay={0.3}>
              <div className="mt-10 flex flex-wrap items-center gap-4">
                <Link to={hero.primaryCta?.href || ROUTES.CULTURE}>
                  <Button size="lg">
                    {hero.primaryCta?.label || 'Conheça nossa cultura'}
                    <ArrowRight size={18} aria-hidden="true" />
                  </Button>
                </Link>
                <Link to={hero.secondaryCta?.href || ROUTES.JOBS}>
                  <Button variant="outline" size="lg">
                    {hero.secondaryCta?.label || 'Ver vagas abertas'}
                  </Button>
                </Link>
              </div>
            </FadeIn>
          </div>

          <div className="lg:col-span-5">
            <FadeIn delay={0.2}>
              <InstitutionalVideo
                src={hero.videoSrc || '/fg.mp4'}
                label={hero.videoLabel || 'Vídeo institucional FG Services'}
                className="aspect-[4/5] max-w-md mx-auto lg:ml-auto rounded-3xl overflow-hidden shadow-elevated bg-brand-blue-900"
              />
            </FadeIn>
          </div>
        </div>
      </div>
    </Section>
  )
}
