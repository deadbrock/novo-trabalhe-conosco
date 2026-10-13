import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Download, Trash2 } from 'lucide-react'
import { candidatesService } from '@/services/candidatesService'
import { ResumePreview } from './ResumePreview'
import { CandidateProfileContent } from './CandidateProfileContent'
import { CandidateApplicationsContent } from './CandidateApplicationsContent'
import { CandidateTimelineContent } from './CandidateTimelineContent'
import { CandidateDocumentsPanel } from './CandidateDocumentsPanel'
import { STATUS_MAP, formatDate, formatFileSize } from './candidateUtils'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { ApiError } from '@/services/api'
import { useAuth } from '@/context/AuthContext'
import { cn } from '@/utils/cn'

const TABS = [
  { id: 'profile', label: 'Perfil' },
  { id: 'resume', label: 'Currículo' },
  { id: 'applications', label: 'Candidaturas' },
  { id: 'documents', label: 'Documentos' },
  { id: 'notes', label: 'Notas' },
  { id: 'timeline', label: 'Histórico' },
]

export function CandidateDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { hasPermission } = useAuth()
  const canWrite = hasPermission('candidates:write')
  const [activeTab, setActiveTab] = useState('profile')
  const [downloading, setDownloading] = useState(false)
  const [feedback, setFeedback] = useState('')

  const { data, isLoading, error } = useQuery({
    queryKey: ['candidate-detail', id],
    queryFn: () => candidatesService.get(id),
    enabled: Boolean(id),
  })

  const candidate = data?.candidate
  const statusInfo = candidate ? STATUS_MAP[candidate.status] || STATUS_MAP.PENDING : null

  async function handleDownloadResume() {
    if (!candidate) return
    setFeedback('')
    setDownloading(true)
    try {
      await candidatesService.downloadResume(candidate.id, candidate.resumeFileName || 'curriculo.pdf')
    } catch (err) {
      setFeedback(err instanceof ApiError ? err.message : 'Erro ao baixar currículo.')
    } finally {
      setDownloading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  if (error || !candidate) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/candidatos')}>
          <ArrowLeft size={16} />
          Voltar
        </Button>
        <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
          {error instanceof ApiError ? error.message : 'Candidato não encontrado.'}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div className="space-y-3">
          <Button variant="ghost" size="sm" className="-ml-2" onClick={() => navigate('/candidatos')}>
            <ArrowLeft size={16} />
            Candidatos
          </Button>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{candidate.name}</h1>
            <p className="text-sm text-neutral-500 mt-1">{candidate.email}</p>
            <div className="flex flex-wrap gap-2 mt-3">
              <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
              {candidate.emailVerified ? (
                <Badge variant="green">E-mail verificado</Badge>
              ) : (
                <Badge variant="amber">E-mail pendente</Badge>
              )}
              {candidate.applicationsCount > 0 && (
                <Badge variant="default">{candidate.applicationsCount} candidatura(s)</Badge>
              )}
            </div>
          </div>
        </div>
        <p className="text-xs text-neutral-400">Cadastro em {formatDate(candidate.createdAt)}</p>
      </div>

      {feedback && (
        <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{feedback}</p>
      )}

      <div className="border-b border-neutral-200">
        <div className="flex gap-1 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-colors',
                activeTab === tab.id
                  ? 'border-[#003d7a] text-[#003d7a]'
                  : 'border-transparent text-neutral-500 hover:text-neutral-800',
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-4xl">
        {activeTab === 'profile' && <CandidateProfileContent candidate={candidate} />}
        {activeTab === 'resume' && (
          <div className="space-y-4">
            {!candidate.hasResume ? (
              <p className="text-sm text-neutral-500">Currículo não enviado pelo candidato.</p>
            ) : (
              <>
                <div className="rounded-lg border border-neutral-200 bg-neutral-50/60 px-4 py-3">
                  <p className="font-medium text-neutral-900">{candidate.resumeFileName}</p>
                  <p className="text-xs text-neutral-500 mt-1">
                    {formatFileSize(candidate.resumeSize)}
                    {candidate.resumeUploadedAt && ` · Enviado em ${formatDate(candidate.resumeUploadedAt)}`}
                  </p>
                </div>
                <ResumePreview
                  candidateId={candidate.id}
                  mimeType={candidate.resumeMimeType}
                  fileName={candidate.resumeFileName}
                />
                <Button variant="secondary" onClick={handleDownloadResume} disabled={downloading}>
                  <Download size={16} />
                  {downloading ? 'Baixando...' : 'Baixar currículo'}
                </Button>
              </>
            )}
          </div>
        )}
        {activeTab === 'applications' && (
          <CandidateApplicationsContent
            candidate={candidate}
            canWrite={canWrite}
            canMoveStage={canWrite}
          />
        )}
        {activeTab === 'documents' && <CandidateDocumentsPanel candidateId={candidate.id} />}
        {activeTab === 'notes' && (
          <CandidateNotesContent candidateId={candidate.id} canWrite={canWrite} />
        )}
        {activeTab === 'timeline' && <CandidateTimelineContent candidateId={candidate.id} />}
      </div>
    </div>
  )
}

function CandidateNotesContent({ candidateId, canWrite }) {
  const queryClient = useQueryClient()
  const [content, setContent] = useState('')
  const [feedback, setFeedback] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['candidate-notes', candidateId],
    queryFn: () => candidatesService.getNotes(candidateId),
  })

  const createMutation = useMutation({
    mutationFn: (noteContent) => candidatesService.createNote(candidateId, noteContent),
    onSuccess: () => {
      setContent('')
      setFeedback('')
      queryClient.invalidateQueries({ queryKey: ['candidate-notes', candidateId] })
      queryClient.invalidateQueries({ queryKey: ['candidate-timeline', candidateId] })
    },
    onError: (err) => {
      setFeedback(err instanceof ApiError ? err.message : 'Erro ao salvar nota.')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (noteId) => candidatesService.deleteNote(candidateId, noteId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['candidate-notes', candidateId] })
      queryClient.invalidateQueries({ queryKey: ['candidate-timeline', candidateId] })
    },
    onError: (err) => {
      setFeedback(err instanceof ApiError ? err.message : 'Erro ao remover nota.')
    },
  })

  const notes = data?.notes || []

  return (
    <div className="space-y-6">
      {canWrite && (
        <form
          className="space-y-3"
          onSubmit={(event) => {
            event.preventDefault()
            if (!content.trim()) return
            createMutation.mutate(content.trim())
          }}
        >
          <label htmlFor="candidate-note" className="text-sm font-medium text-neutral-800">
            Nova nota interna
          </label>
          <textarea
            id="candidate-note"
            rows={4}
            value={content}
            onChange={(event) => setContent(event.target.value)}
            placeholder="Registre observações, pareceres ou lembretes sobre este candidato..."
            className="w-full text-sm border border-neutral-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#003d7a]/20 focus:border-[#003d7a]"
          />
          <Button type="submit" disabled={createMutation.isPending || !content.trim()}>
            {createMutation.isPending ? 'Salvando...' : 'Adicionar nota'}
          </Button>
        </form>
      )}

      {feedback && (
        <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{feedback}</p>
      )}

      {isLoading ? (
        <Skeleton className="h-24 w-full" />
      ) : notes.length === 0 ? (
        <p className="text-sm text-neutral-500">Nenhuma nota registrada.</p>
      ) : (
        <ul className="space-y-3">
          {notes.map((note) => (
            <li key={note.id} className="rounded-lg border border-neutral-200 p-4 bg-white">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm text-neutral-800 whitespace-pre-wrap">{note.content}</p>
                  <p className="text-xs text-neutral-400 mt-2">
                    {note.authorName} · {formatDate(note.createdAt)}
                  </p>
                </div>
                {canWrite && (
                  <button
                    type="button"
                    onClick={() => deleteMutation.mutate(note.id)}
                    disabled={deleteMutation.isPending}
                    className="p-2 rounded-lg text-neutral-400 hover:text-red-600 hover:bg-red-50 shrink-0"
                    aria-label="Remover nota"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
