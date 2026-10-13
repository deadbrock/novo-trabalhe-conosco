import { useRef, useState, useEffect } from 'react'
import { FileText, Upload, Download, Trash2, CheckCircle2, Eye, X } from 'lucide-react'
import { Button } from '@/components/ui/Button/Button'
import { Text } from '@/components/ui/Text/Text'
import { candidateService } from '@/services/candidateService'
import { ApiError } from '@/services/api'
import { cn } from '@/utils/cn'

const ACCEPT = '.pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document'

function formatFileSize(bytes) {
  if (!bytes) return ''
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatDate(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export function ResumeUploadSection({ user, token, onUpdated }) {
  const inputRef = useRef(null)
  const [uploading, setUploading] = useState(false)
  const [removing, setRemoving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [previewLoading, setPreviewLoading] = useState(false)

  const hasResume = Boolean(user?.profile?.resumeFileName)
  const resumeName = user?.profile?.resumeOriginalName || user?.profile?.resumeFileName
  const resumeSize = user?.profile?.resumeSize
  const resumeDate = user?.profile?.resumeUploadedAt
  const resumeMimeType = user?.profile?.resumeMimeType
  const canPreviewInline = resumeMimeType === 'application/pdf'

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  async function handleUpload(file) {
    if (!file) return

    setUploading(true)
    setMessage('')
    setError('')

    try {
      const result = await candidateService.uploadResume(token, file)
      setMessage(result.message)
      await onUpdated()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erro ao enviar currículo.')
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  function onFileChange(event) {
    handleUpload(event.target.files?.[0])
  }

  function onDrop(event) {
    event.preventDefault()
    setDragOver(false)
    handleUpload(event.dataTransfer.files?.[0])
  }

  async function handleDownload() {
    try {
      await candidateService.downloadResume(token, resumeName)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erro ao baixar currículo.')
    }
  }

  async function handlePreview() {
    if (!canPreviewInline) return

    setPreviewLoading(true)
    setError('')

    try {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
      const url = await candidateService.getResumePreviewUrl(token)
      setPreviewUrl(url)
      setPreviewOpen(true)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erro ao visualizar currículo.')
    } finally {
      setPreviewLoading(false)
    }
  }

  function closePreview() {
    setPreviewOpen(false)
  }

  async function handleRemove() {
    setRemoving(true)
    setMessage('')
    setError('')

    try {
      const result = await candidateService.deleteResume(token)
      setMessage(result.message)
      await onUpdated()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erro ao remover currículo.')
    } finally {
      setRemoving(false)
    }
  }

  return (
    <section className="rounded-2xl border border-brand-blue-100 bg-white p-6 md:p-8">
      <div className="flex items-start gap-3 mb-6">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-brand-blue-50 text-brand-blue-600 shrink-0">
          <FileText size={20} aria-hidden="true" />
        </div>
        <div>
          <h2 className="font-display text-lg font-semibold text-neutral-900">Currículo</h2>
          <Text size="sm" className="mt-1">
            Envie seu currículo em PDF, DOC ou DOCX (máx. 5MB).
          </Text>
        </div>
      </div>

      {hasResume && (
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-xl border border-brand-blue-100 bg-brand-blue-50/50 px-4 py-4">
          <div className="flex items-start gap-3 min-w-0">
            <CheckCircle2 className="text-brand-blue-600 shrink-0 mt-0.5" size={18} aria-hidden="true" />
            <div className="min-w-0">
              <p className="text-sm font-medium text-neutral-900 truncate">{resumeName}</p>
              <p className="text-xs text-neutral-500 mt-0.5">
                {formatFileSize(resumeSize)}
                {resumeDate && ` · Enviado em ${formatDate(resumeDate)}`}
              </p>
            </div>
          </div>
          <div className="flex gap-2 shrink-0 flex-wrap">
            {canPreviewInline && (
              <Button type="button" variant="outline" size="sm" onClick={handlePreview} disabled={previewLoading}>
                <Eye size={16} aria-hidden="true" />
                {previewLoading ? 'Abrindo...' : 'Visualizar'}
              </Button>
            )}
            <Button type="button" variant="outline" size="sm" onClick={handleDownload}>
              <Download size={16} aria-hidden="true" />
              Baixar
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleRemove}
              disabled={removing}
              className="text-brand-red-600 hover:text-brand-red-700 hover:bg-brand-red-50"
            >
              <Trash2 size={16} aria-hidden="true" />
              {removing ? 'Removendo...' : 'Remover'}
            </Button>
          </div>
        </div>
      )}

      <div
        className={cn(
          'relative rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors',
          dragOver ? 'border-brand-blue-400 bg-brand-blue-50/60' : 'border-neutral-200 hover:border-brand-blue-200',
        )}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
      >
        <Upload className="mx-auto text-neutral-400 mb-3" size={28} aria-hidden="true" />
        <p className="text-sm font-medium text-neutral-800">
          {hasResume ? 'Substituir currículo' : 'Arraste seu currículo aqui'}
        </p>
        <p className="text-xs text-neutral-500 mt-1">ou</p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-4"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
        >
          {uploading ? 'Enviando...' : 'Selecionar arquivo'}
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          className="sr-only"
          aria-label="Selecionar currículo"
          onChange={onFileChange}
        />
      </div>

      {previewOpen && previewUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-100">
              <p className="text-sm font-medium text-neutral-900 truncate">{resumeName}</p>
              <button
                type="button"
                onClick={closePreview}
                className="p-2 rounded-lg hover:bg-neutral-100 text-neutral-500"
                aria-label="Fechar visualização"
              >
                <X size={18} />
              </button>
            </div>
            <iframe
              src={previewUrl}
              title="Visualização do currículo"
              className="w-full h-[min(80vh,720px)]"
            />
          </div>
        </div>
      )}

      {message && (
        <p className="mt-4 text-sm text-brand-blue-700 bg-brand-blue-50 rounded-xl px-4 py-3">{message}</p>
      )}
      {error && (
        <p className="mt-4 text-sm text-brand-red-700 bg-brand-red-50 rounded-xl px-4 py-3" role="alert">{error}</p>
      )}
    </section>
  )
}
