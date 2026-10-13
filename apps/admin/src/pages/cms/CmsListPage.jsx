import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Globe, FileEdit, CheckCircle2, Clock, MapPin, ChevronRight } from 'lucide-react'
import { cmsService } from '@/services/cmsService'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { CmsHelpModal, CmsHelpButton } from './components/CmsFormPrimitives'
import { CMS_SECTION_META, CMS_PUBLISH_HELP } from './constants/cmsSectionMeta'

function statusBadge(section) {
  if (section.hasDraft) {
    return <Badge variant="amber">Rascunho pendente</Badge>
  }
  if (section.hasPublished) {
    return <Badge variant="green">Publicado</Badge>
  }
  return <Badge variant="default">Sem conteúdo</Badge>
}

export function CmsListPage() {
  const [helpOpen, setHelpOpen] = useState(false)
  const [activeHelp, setActiveHelp] = useState(null)

  const { data, isLoading } = useQuery({
    queryKey: ['cms-sections'],
    queryFn: () => cmsService.listSections(),
  })

  const sections = data?.sections || []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Conteúdo do Portal</h1>
        <p className="text-sm text-neutral-500 mt-1 max-w-2xl leading-relaxed">
          Edite textos, imagens e seções do site de carreiras sem precisar de conhecimento técnico.
          Escolha uma seção abaixo, faça as alterações e publique.
        </p>
      </div>

      <Card className="bg-neutral-50 border-neutral-200">
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-white text-blue-600 shrink-0 border border-neutral-100">
              <Globe size={18} />
            </div>
            <div>
              <p className="text-sm font-medium text-neutral-900">Tudo o que você editar aqui aparece no portal de vagas</p>
              <p className="text-sm text-neutral-500 mt-1">
                Após editar, clique em <strong className="text-neutral-700">Publicar no portal</strong> para
                candidatos e visitantes verem as mudanças.
              </p>
              <button
                type="button"
                onClick={() => {
                  setActiveHelp(CMS_PUBLISH_HELP)
                  setHelpOpen(true)
                }}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium mt-2"
              >
                Como publicar alterações →
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="grid gap-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : (
        <div className="grid gap-3">
          {sections.map((section) => {
            const meta = CMS_SECTION_META[section.slug]

            return (
              <Card key={section.slug} className="hover:shadow-sm transition-shadow">
                <CardContent className="py-4">
                  <div className="flex items-start gap-3">
                    <Link to={`/cms/${section.slug}`} className="flex items-start gap-3 flex-1 min-w-0 group">
                      <div className="p-2.5 rounded-lg bg-blue-50 text-blue-600 shrink-0 group-hover:bg-blue-100 transition-colors">
                        <Globe size={18} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-neutral-900 group-hover:text-blue-800 transition-colors">
                            {section.name}
                          </p>
                          <ChevronRight size={16} className="text-neutral-300 group-hover:text-blue-400 shrink-0" />
                        </div>
                        {meta?.summary && (
                          <p className="text-sm text-neutral-500 mt-1 leading-relaxed">{meta.summary}</p>
                        )}
                        {meta?.where && (
                          <p className="text-xs text-neutral-400 mt-1.5 inline-flex items-center gap-1">
                            <MapPin size={11} />
                            {meta.where}
                          </p>
                        )}
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          {statusBadge(section)}
                          {section.publishedVersion && (
                            <span className="text-xs text-neutral-400 inline-flex items-center gap-1">
                              <CheckCircle2 size={12} />
                              v{section.publishedVersion}
                            </span>
                          )}
                          {section.hasDraft && (
                            <span className="text-xs text-amber-600 inline-flex items-center gap-1">
                              <FileEdit size={12} />
                              rascunho v{section.draftVersion}
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>

                    <div className="flex flex-col items-end gap-2 shrink-0">
                      {meta?.help && (
                        <CmsHelpButton
                          help={meta.help}
                          onClick={() => {
                            setActiveHelp(meta.help)
                            setHelpOpen(true)
                          }}
                        />
                      )}
                      <span className="text-xs text-neutral-400 inline-flex items-center gap-1">
                        <Clock size={12} />
                        {new Date(section.updatedAt).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <CmsHelpModal open={helpOpen} onClose={() => setHelpOpen(false)} help={activeHelp} />
    </div>
  )
}
