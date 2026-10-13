import { ArrowDown, Clock, HelpCircle, ListOrdered, MessageSquareHeart, ShieldCheck } from 'lucide-react'
import { SeoHead } from '@/components/seo/SeoHead'
import { PageHeader, PageHeaderActions } from '@/components/layout/PageHeader/PageHeader'
import { PageHeroAside } from '@/components/layout/PageHeroAside/PageHeroAside'
import { PageCtaBand } from '@/components/layout/PageCtaBand/PageCtaBand'
import { Section } from '@/components/ui/Section/Section'
import { SectionHeader } from '@/components/ui/SectionHeader/SectionHeader'
import { Card } from '@/components/ui/Card/Card'
import { Text } from '@/components/ui/Text/Text'
import { Button } from '@/components/ui/Button/Button'
import { Link } from '@/components/ui/Link/Link'
import { StaggerChildren, StaggerItem } from '@/components/motion/StaggerChildren'
import { processSteps as defaultSteps } from '@/mocks/process.mock'
import { company } from '@/constants/company'
import { useCmsSection } from '@/context/CmsContext'
import { ROUTES } from '@/constants/routes'

const DEFAULT_FAQ = [
  {
    question: 'Quanto tempo leva o processo seletivo?',
    answer: 'Em média, de 2 a 4 semanas, dependendo da senioridade e número de etapas da vaga.',
  },
  {
    question: 'Receberei feedback se não for selecionado?',
    answer: 'Sim. Acreditamos em transparência e enviamos retorno construtivo sempre que possível.',
  },
  {
    question: 'Posso me candidatar a mais de uma vaga?',
    answer: 'Sim, desde que seu perfil seja compatível. Recomendamos priorizar as mais alinhadas.',
  },
]

export function ProcessPage() {
  const process = useCmsSection('process', {
    pageHeader: {
      badge: 'Processo Seletivo',
      title: 'Um processo desenhado para respeitar você',
      description: 'Clareza em cada etapa, comunicação constante e avaliação justa de competências e fit cultural.',
    },
    steps: defaultSteps,
  })
  const faqCms = useCmsSection('faq', { items: DEFAULT_FAQ })
  const processSteps = process.steps || defaultSteps
  const faqs = faqCms.items || DEFAULT_FAQ
  const pageHeader = process.pageHeader || {}

  return (
    <>
      <SeoHead
        title="Processo Seletivo"
        description={`Entenda como funciona o processo seletivo da ${company.name} — transparente, estruturado e humano.`}
      />

      <PageHeader
        badge={pageHeader.badge || 'Processo Seletivo'}
        title={pageHeader.title || 'Um processo desenhado para respeitar você'}
        description={pageHeader.description}
        aside={
          <PageHeroAside
            eyebrow="Como selecionamos"
            stats={[
              { value: String(processSteps.length).padStart(2, '0'), label: 'Etapas claras', icon: ListOrdered },
              { value: '2–4', label: 'Semanas em média', icon: Clock },
              { value: '100%', label: 'Com retorno', icon: MessageSquareHeart },
              { value: 'GPTW', label: 'Processo humano', icon: ShieldCheck },
            ]}
            highlight={{
              icon: ShieldCheck,
              title: 'Sem surpresas no caminho',
              description: 'Comunicação constante e avaliação justa em cada etapa',
            }}
          />
        }
      >
        <PageHeaderActions>
          <a href="#etapas">
            <Button type="button" size="lg">
              Ver etapas
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

      <Section id="etapas" className="scroll-mt-28">
        <SectionHeader
          badge="Etapas"
          title="Transparente, humano e estruturado"
          description="Cada etapa foi desenhada para respeitar seu tempo e oferecer clareza em todo o processo."
        />
        <StaggerChildren className="grid md:grid-cols-2 gap-6">
          {processSteps.map((step) => (
            <StaggerItem key={step.step}>
              <Card hover className="h-full">
                <span className="font-display text-5xl font-semibold text-brand-red-100 select-none">
                  {String(step.step).padStart(2, '0')}
                </span>
                <h3 className="mt-4 font-display text-xl font-semibold text-neutral-900">{step.title}</h3>
                <Text size="sm" className="mt-3">
                  {step.description}
                </Text>
              </Card>
            </StaggerItem>
          ))}
        </StaggerChildren>
      </Section>

      <Section id="faq" className="scroll-mt-28 bg-brand-blue-50/40">
        <SectionHeader
          badge="Dúvidas"
          title="Perguntas frequentes"
          description="Respostas objetivas para as dúvidas mais comuns de quem se candidata."
        />
        <StaggerChildren className="grid md:grid-cols-3 gap-6">
          {faqs.map((faq) => (
            <StaggerItem key={faq.question}>
              <Card hover className="h-full">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-blue-50 text-brand-blue-600">
                  <HelpCircle size={20} aria-hidden="true" />
                </span>
                <h3 className="mt-6 font-display text-base font-semibold text-neutral-900">{faq.question}</h3>
                <Text size="sm" className="mt-3">
                  {faq.answer}
                </Text>
              </Card>
            </StaggerItem>
          ))}
        </StaggerChildren>
      </Section>

      <PageCtaBand
        title="Pronto para dar o próximo passo?"
        description="Candidate-se às vagas abertas ou deixe seu perfil no banco de talentos."
        primary={{ label: 'Ver vagas abertas', to: ROUTES.JOBS }}
        secondary={{ label: 'Banco de talentos', to: ROUTES.TALENT_POOL }}
      />
    </>
  )
}
