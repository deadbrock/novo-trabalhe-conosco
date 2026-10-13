import { ArrowRight, MapPin, Briefcase } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { Section } from '@/components/ui/Section/Section'
import { SectionHeader } from '@/components/ui/SectionHeader/SectionHeader'
import { Badge } from '@/components/ui/Badge/Badge'
import { Text } from '@/components/ui/Text/Text'
import { Button } from '@/components/ui/Button/Button'
import { Link } from '@/components/ui/Link/Link'
import { StaggerChildren, StaggerItem } from '@/components/motion/StaggerChildren'
import { publicJobsService } from '@/services/jobsService'
import { ROUTES, jobDetailPath } from '@/constants/routes'

export function JobsPreviewSection() {
  const { data } = useQuery({
    queryKey: ['public-jobs-featured'],
    queryFn: () => publicJobsService.list(),
  })

  const featuredJobs = (data?.jobs || []).filter((j) => j.featured).slice(0, 3)
  const displayJobs = featuredJobs.length > 0 ? featuredJobs : (data?.jobs || []).slice(0, 3)

  return (
    <Section id="vagas">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12 md:mb-16">
        <SectionHeader
          badge="Vagas abertas"
          title="Oportunidades disponíveis"
          description="Quando você já conhece quem somos, está na hora de encontrar onde se encaixa."
          className="mb-0"
        />
        <Link to={ROUTES.JOBS}>
          <Button variant="outline">
            Ver todas as vagas
            <ArrowRight size={16} aria-hidden="true" />
          </Button>
        </Link>
      </div>

      {displayJobs.length === 0 ? (
        <Text size="sm" className="text-neutral-500">
          Novas oportunidades serão publicadas em breve. Cadastre-se no banco de talentos.
        </Text>
      ) : (
        <StaggerChildren className="space-y-4">
          {displayJobs.map((job) => (
            <StaggerItem key={job.id}>
              <Link
                to={jobDetailPath(job.slug)}
                className="group block rounded-2xl border border-brand-blue-100 bg-neutral-0 p-6 md:p-8 hover:border-brand-red-200 hover:shadow-soft transition-all"
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <Badge variant="brand">{job.area}</Badge>
                      {job.level && <Badge variant="outline">{job.level}</Badge>}
                      <Badge variant="outline">{job.contract}</Badge>
                    </div>
                    <h3 className="font-display text-lg md:text-xl font-semibold text-neutral-900 group-hover:text-brand-red-600 transition-colors">
                      {job.title}
                    </h3>
                    <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-neutral-500">
                      {job.location && (
                        <span className="inline-flex items-center gap-1.5">
                          <MapPin size={14} aria-hidden="true" />
                          {job.location}
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1.5">
                        <Briefcase size={14} aria-hidden="true" />
                        {job.type}
                      </span>
                    </div>
                  </div>
                  <ArrowRight
                    size={20}
                    className="shrink-0 text-neutral-300 group-hover:text-brand-red-600 group-hover:translate-x-1 transition-all"
                    aria-hidden="true"
                  />
                </div>
                <Text size="sm" className="mt-3 md:max-w-2xl">
                  {job.description}
                </Text>
              </Link>
            </StaggerItem>
          ))}
        </StaggerChildren>
      )}
    </Section>
  )
}
