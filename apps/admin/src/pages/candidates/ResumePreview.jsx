import { useEffect, useState } from 'react'
import { candidatesService } from '@/services/candidatesService'
import { ApiError } from '@/services/api'

export function ResumePreview({ candidateId, mimeType, fileName }) {
  const [previewUrl, setPreviewUrl] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let objectUrl

    async function loadPreview() {
      setLoading(true)
      setError('')

      try {
        objectUrl = await candidatesService.getResumePreviewUrl(candidateId)
        setPreviewUrl(objectUrl)
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'Erro ao carregar currículo.')
      } finally {
        setLoading(false)
      }
    }

    loadPreview()

    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [candidateId])

  if (loading) {
    return <p className="text-sm text-neutral-500 py-8 text-center">Carregando currículo...</p>
  }

  if (error) {
    return <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
  }

  if (mimeType === 'application/pdf' && previewUrl) {
    return (
      <iframe
        src={previewUrl}
        title={`Currículo de ${fileName || 'candidato'}`}
        className="w-full h-[min(70vh,560px)] rounded-lg border border-neutral-200 bg-neutral-50"
      />
    )
  }

  return (
    <div className="rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-8 text-center text-sm text-neutral-600">
      <p>Visualização inline disponível apenas para arquivos PDF.</p>
      <p className="mt-1 text-xs text-neutral-500">Use o botão abaixo para baixar {fileName || 'o currículo'}.</p>
    </div>
  )
}
