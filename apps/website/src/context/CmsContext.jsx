import { createContext, useCallback, useContext, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { cmsService } from '@/services/cmsService'

const CmsContext = createContext({
  sections: {},
  loading: true,
  getSection: (_slug, fallback) => fallback,
})

export function CmsProvider({ children }) {
  const { data, isLoading } = useQuery({
    queryKey: ['cms-content'],
    queryFn: () => cmsService.getAll(),
    staleTime: 30_000,
    refetchInterval: 60_000,
  })

  const sections = data?.sections || {}

  const getSection = useCallback(
    (slug, fallback = null) => sections[slug] ?? fallback,
    [sections],
  )

  const value = useMemo(
    () => ({ sections, loading: isLoading, getSection }),
    [sections, isLoading, getSection],
  )

  return <CmsContext.Provider value={value}>{children}</CmsContext.Provider>
}

export function useCms() {
  return useContext(CmsContext)
}

export function useCmsSection(slug, fallback) {
  const { getSection } = useCms()
  return getSection(slug, fallback)
}

const DEFAULT_SEO = {
  siteName: 'FG Services Carreiras',
  defaultTitle: 'FG Services Carreiras',
  defaultDescription:
    'Construa sua carreira na FG Services — excelência em terceirização, cultura GPTW e oportunidades em todo o Brasil.',
  defaultKeywords: 'FG Services, carreiras, vagas, terceirização, emprego',
}

export function useCmsSeo() {
  return useCmsSection('seo', DEFAULT_SEO)
}
