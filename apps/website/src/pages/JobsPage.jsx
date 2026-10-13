import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ArrowDown, ArrowRight, Briefcase, Layers, MapPin, Search, Users } from 'lucide-react'
import { SeoHead } from '@/components/seo/SeoHead'
import { PageHeader, PageHeaderActions } from '@/components/layout/PageHeader/PageHeader'
import { PageHeroAside } from '@/components/layout/PageHeroAside/PageHeroAside'
import { PageCtaBand } from '@/components/layout/PageCtaBand/PageCtaBand'
import { Section } from '@/components/ui/Section/Section'
import { SectionHeader } from '@/components/ui/SectionHeader/SectionHeader'
import { Badge } from '@/components/ui/Badge/Badge'
import { Text } from '@/components/ui/Text/Text'
import { Button } from '@/components/ui/Button/Button'
import { Link } from '@/components/ui/Link/Link'
import { StaggerChildren, StaggerItem } from '@/components/motion/StaggerChildren'
import { publicJobsService } from '@/services/jobsService'
import { ROUTES, jobDetailPath } from '@/constants/routes'
import { company } from '@/constants/company'

export function JobsPage() {
  const [search, setSearch] = useState('')
  const [areaFilter, setAreaFilter] = useState('')

  const { data, isLoading, isError } = useQuery({
    queryKey: ['public-jobs'],
    queryFn: () => publicJobsService.list(),
  })

  const jobs = data?.jobs || []
  const areas = [...new Set(jobs.map((job) => job.area).filter(Boolean))]
  const locations = [...new Set(jobs.map((job) => job.location).filter(Boolean))]

  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      const matchesSearch =
        !search ||
        job.title.toLowerCase().includes(search.toLowerCase()) ||
        job.area.toLowerCase().includes(search.toLowerCase())
      const matchesArea = !areaFilter || job.area === areaFilter
      return matchesSearch && matchesArea
    })
  }, [jobs, search, areaFilter])

  const displayCount = isLoading ? '—' : String(jobs.length)

  return (
    <>
      <SeoHead
        title="Vagas"
        description={`Confira as vagas abertas na ${company.name} e candidate-se às oportunidades disponíveis.`}
      />

      <PageHeader
        badge="Vagas Abertas"
        title="Encontre sua próxima oportunidade"
        description={
          isLoading
            ? 'Carregando vagas abertas em diversas áreas e localidades.'
            : `${jobs.length} posições abertas em diversas áreas e localidades.`
        }
        aside={
          <PageHeroAside
            eyebrow="Oportunidades agora"
            stats={[
              { value: displayCount, label: 'Vagas abertas', icon: Briefcase },
              { value: isLoading ? '—' : String(areas.length), label: 'Áreas com vagas', icon: Layers },
              {
                value: isLoading ? '—' : String(locations.length || 15),
                label: locations.length ? 'Localidades' : 'Estados de atuação',
                icon: MapPin,
              },
              { value: '3.500+', label: 'Colaboradores', icon: Users },
            ]}
            highlight={{
              icon: Search,
              title: 'Não achou a vaga ideal?',
              description: 'Cadastre-se no banco de talentos e fique no radar',
            }}
          />
        }
      >
        <PageHeaderActions>
          <a href="#vagas">
            <Button type="button" size="lg">
              Ver vagas
              <ArrowDown size={18} aria-hidden="true" />
            </Button>
          </a>
          <Link to={ROUTES.TALENT_POOL}>
            <Button type="button" variant="outline" size="lg">
              Banco de talentos
            </Button>
          </Link>
        </PageHeaderActions>
      </PageHeader>

      <Section id="vagas" className="scroll-mt-28">
        <SectionHeader
          badge="Oportunidades"
          title="Vagas disponíveis"
          description="Filtre por cargo ou área e encontre onde o seu perfil se encaixa."
        />

        <div className="flex flex-col md:flex-row gap-4 mb-10">
          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400"
              aria-hidden="true"
            />
            <input
              type="search"
              placeholder="Buscar por cargo ou área..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-11 pl-11 pr-4 rounded-xl border border-brand-blue-100 text-sm focus:border-brand-blue-500 focus:ring-1 focus:ring-brand-blue-500 outline-none transition-colors"
              aria-label="Buscar vagas"
            />
          </div>
          <select
            value={areaFilter}
            onChange={(e) => setAreaFilter(e.target.value)}
            className="h-11 px-4 rounded-xl border border-brand-blue-100 text-sm focus:border-brand-blue-500 outline-none bg-white min-w-[200px]"
            aria-label="Filtrar por área"
          >
            <option value="">Todas as áreas</option>
            {areas.map((area) => (
              <option key={area} value={area}>
                {area}
              </option>
            ))}
          </select>
        </div>

        {isError && (
          <div className="text-center py-16 rounded-2xl border border-brand-blue-100 bg-brand-blue-50/40">
            <p className="font-display text-lg font-medium text-neutral-700">Não foi possível carregar as vagas</p>
            <Text size="sm" className="mt-2">
              Verifique se a API está rodando e tente novamente.
            </Text>
          </div>
        )}

        {!isLoading && filteredJobs.length === 0 && !isError && (
          <div className="text-center py-16 rounded-2xl border border-brand-blue-100 bg-brand-blue-50/40">
            <p className="font-display text-lg font-medium text-neutral-700">Nenhuma vaga encontrada</p>
            <Text size="sm" className="mt-2">
              Tente ajustar os filtros ou cadastre-se no banco de talentos.
            </Text>
            <Link to={ROUTES.TALENT_POOL} className="inline-block mt-6">
              <Button type="button">Cadastrar no banco de talentos</Button>
            </Link>
          </div>
        )}

        {isLoading && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 rounded-2xl bg-neutral-100 animate-pulse" />
            ))}
          </div>
        )}

        {!isLoading && filteredJobs.length > 0 && (
          <StaggerChildren className="space-y-4">
            {filteredJobs.map((job) => (
              <StaggerItem key={job.id}>
                <Link
                  to={jobDetailPath(job.slug)}
                  className="group block rounded-2xl border border-brand-blue-100 bg-neutral-0 p-6 md:p-8 hover:border-brand-red-200 hover:shadow-soft transition-all"
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <Badge variant="brand">{job.area}</Badge>
                        {job.featured && <Badge variant="outline">Destaque</Badge>}
                        {job.level && <Badge variant="outline">{job.level}</Badge>}
                      </div>
                      <h2 className="font-display text-xl font-semibold text-neutral-900 group-hover:text-brand-red-600 transition-colors">
                        {job.title}
                      </h2>
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
                          {job.contract ? ` · ${job.contract}` : ''}
                        </span>
                      </div>
                    </div>
                    <ArrowRight
                      size={20}
                      className="shrink-0 text-neutral-300 group-hover:text-brand-red-600 group-hover:translate-x-1 transition-all"
                      aria-hidden="true"
                    />
                  </div>
                </Link>
              </StaggerItem>
            ))}
          </StaggerChildren>
        )}
      </Section>

      <PageCtaBand
        title="Não encontrou a vaga ideal?"
        description="Deixe seu perfil no banco de talentos e seja considerado para oportunidades futuras."
        primary={{ label: 'Cadastrar no banco de talentos', to: ROUTES.TALENT_POOL }}
        secondary={{ label: 'Entenda o processo', to: ROUTES.PROCESS }}
      />
    </>
  )
}
