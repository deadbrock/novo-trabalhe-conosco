import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Save, Globe, RotateCcw, HelpCircle, MapPin } from 'lucide-react'
import { cmsService } from '@/services/cmsService'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Card, CardContent } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'
import { ApiError } from '@/services/api'
import { useAuth } from '@/context/AuthContext'
import { CmsSectionForm } from './components/CmsSectionForms'
import { CmsHelpModal, CmsHelpButton } from './components/CmsFormPrimitives'
import { CMS_SECTION_META, CMS_PUBLISH_HELP } from './constants/cmsSectionMeta'

export function CmsEditorPage() {
  const { slug } = useParams()
  const queryClient = useQueryClient()
  const { hasPermission } = useAuth()
  const [payload, setPayload] = useState(null)
  const [dirty, setDirty] = useState(false)
  const [feedback, setFeedback] = useState('')
  const [feedbackType, setFeedbackType] = useState('success')
  const [helpOpen, setHelpOpen] = useState(false)
  const [activeHelp, setActiveHelp] = useState(null)

  const canWrite = hasPermission('cms:write')
  const canPublish = hasPermission('cms:publish')
  const meta = CMS_SECTION_META[slug]

  const { data, isLoading } = useQuery({
    queryKey: ['cms-section', slug],
    queryFn: () => cmsService.getSection(slug),
    enabled: Boolean(slug),
  })

  const section = data?.section

  useEffect(() => {
    if (section?.payload) {
      setPayload(structuredClone(section.payload))
      setDirty(false)
    }
  }, [section])

  function showFeedback(message, type = 'success') {
    setFeedback(message)
    setFeedbackType(type)
  }

  function handleChange(nextPayload) {
    setPayload(nextPayload)
    setDirty(true)
    setFeedback('')
  }

  function restorePublished() {
    if (section?.published?.payload) {
      setPayload(structuredClone(section.published.payload))
      setDirty(true)
      showFeedback('Conteúdo restaurado para a última versão publicada. Publique ou salve rascunho para confirmar.')
    }
  }

  const saveMutation = useMutation({
    mutationFn: (data) => cmsService.saveDraft(slug, data),
    onSuccess: () => {
      showFeedback('Rascunho salvo com sucesso. O portal ainda exibe a versão publicada anterior.')
      setDirty(false)
      queryClient.invalidateQueries({ queryKey: ['cms-section', slug] })
      queryClient.invalidateQueries({ queryKey: ['cms-sections'] })
    },
    onError: (err) => showFeedback(err instanceof ApiError ? err.message : 'Erro ao salvar rascunho.', 'error'),
  })

  const publishMutation = useMutation({
    mutationFn: (data) => cmsService.publish(slug, data),
    onSuccess: () => {
      showFeedback('Publicado! O portal de carreiras será atualizado em alguns segundos.')
      setDirty(false)
      queryClient.invalidateQueries({ queryKey: ['cms-section', slug] })
      queryClient.invalidateQueries({ queryKey: ['cms-sections'] })
    },
    onError: (err) => showFeedback(err instanceof ApiError ? err.message : 'Erro ao publicar.', 'error'),
  })

  function openSectionHelp() {
    setActiveHelp(meta?.help || CMS_PUBLISH_HELP)
    setHelpOpen(true)
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  if (!section || !payload) {
    return <p className="text-sm text-neutral-500">Seção não encontrada.</p>
  }

  const isSaving = saveMutation.isPending || publishMutation.isPending

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div className="space-y-2 min-w-0">
          <Link to="/cms" className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-800">
            <ArrowLeft size={16} />
            Voltar ao CMS
          </Link>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">{section.name}</h1>
            <CmsHelpButton help={meta?.help} onClick={openSectionHelp} />
          </div>
          {meta && (
            <p className="text-sm text-neutral-600 leading-relaxed max-w-2xl">{meta.summary}</p>
          )}
          <p className="text-xs text-neutral-400 inline-flex items-center gap-1">
            <MapPin size={12} />
            Aparece em: {meta?.where || 'Portal de carreiras'}
          </p>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            {section.draft && <Badge variant="amber">Rascunho v{section.draft.version}</Badge>}
            {section.published && <Badge variant="green">Publicado v{section.published.version}</Badge>}
            {dirty && <Badge variant="default">Alterações não salvas</Badge>}
          </div>
        </div>

        <div className="flex flex-wrap gap-2 shrink-0">
          {canWrite && (
            <>
              <Button variant="secondary" onClick={restorePublished} disabled={!section.published || isSaving}>
                <RotateCcw size={16} />
                Restaurar publicado
              </Button>
              <Button onClick={() => saveMutation.mutate(payload)} disabled={isSaving || !dirty} variant="secondary">
                <Save size={16} />
                {saveMutation.isPending ? 'Salvando...' : 'Salvar rascunho'}
              </Button>
            </>
          )}
          {canPublish && (
            <Button onClick={() => publishMutation.mutate(payload)} disabled={isSaving} loading={publishMutation.isPending}>
              <Globe size={16} />
              {publishMutation.isPending ? 'Publicando...' : 'Publicar no portal'}
            </Button>
          )}
        </div>
      </div>

      <Card className="bg-blue-50/60 border-blue-100">
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-white text-blue-600 shrink-0">
              <HelpCircle size={18} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-blue-900">Como funciona</p>
              <p className="text-sm text-blue-800/90 mt-1 leading-relaxed">
                Edite os campos abaixo e clique em <strong>Publicar no portal</strong> para que as alterações
                apareçam no site de carreiras. Use <strong>Salvar rascunho</strong> se quiser guardar sem publicar ainda.
              </p>
              <button
                type="button"
                onClick={() => {
                  setActiveHelp(CMS_PUBLISH_HELP)
                  setHelpOpen(true)
                }}
                className="text-sm font-medium text-blue-700 hover:text-blue-900 mt-2 underline underline-offset-2"
              >
                Ver guia completo de publicação
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {feedback && (
        <p
          className={`text-sm rounded-lg px-3 py-2 ${
            feedbackType === 'error'
              ? 'text-red-700 bg-red-50'
              : 'text-emerald-700 bg-emerald-50'
          }`}
          role="status"
        >
          {feedback}
        </p>
      )}

      {canWrite ? (
        <CmsSectionForm
          slug={slug}
          value={payload}
          onChange={handleChange}
          setHelp={(help) => {
            setActiveHelp(help)
            setHelpOpen(true)
          }}
        />
      ) : (
        <Card>
          <CardContent className="py-8 text-center text-sm text-neutral-500">
            Você tem permissão apenas para visualizar. Solicite acesso de edição ao administrador.
          </CardContent>
        </Card>
      )}

      <CmsHelpModal open={helpOpen} onClose={() => setHelpOpen(false)} help={activeHelp} />
    </div>
  )
}
