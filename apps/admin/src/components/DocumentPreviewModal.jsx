import { useEffect, useState } from 'react'
import { Download, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { ApiError } from '@/services/api'

function isImageMime(mimeType) {
  return mimeType?.startsWith('image/')
}

export function DocumentPreviewModal({
  item,
  onClose,
  loadPreviewUrl,
  onDownload,
}) {
  const [previewUrl, setPreviewUrl] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let objectUrl

    async function loadPreview() {
      setLoading(true)
      setError('')

      try {
        objectUrl = await loadPreviewUrl()
        setPreviewUrl(objectUrl)
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'Erro ao carregar documento.')
      } finally {
        setLoading(false)
      }
    }

    loadPreview()

    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [loadPreviewUrl])

  const mimeType = item.documentMimeType
  const canPreviewInline = mimeType === 'application/pdf' || isImageMime(mimeType)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-neutral-200 shrink-0">
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-neutral-900 truncate">{item.label}</h2>
            {item.documentFileName && (
              <p className="text-xs text-neutral-500 truncate mt-0.5">{item.documentFileName}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 shrink-0"
            aria-label="Fechar"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-auto p-5 min-h-[240px]">
          {loading && (
            <p className="text-sm text-neutral-500 py-8 text-center">Carregando documento...</p>
          )}

          {error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
          )}

          {!loading && !error && previewUrl && mimeType === 'application/pdf' && (
            <iframe
              src={previewUrl}
              title={`Visualização de ${item.label}`}
              className="w-full h-[min(70vh,560px)] rounded-lg border border-neutral-200 bg-neutral-50"
            />
          )}

          {!loading && !error && previewUrl && isImageMime(mimeType) && (
            <div className="flex justify-center">
              <img
                src={previewUrl}
                alt={item.label}
                className="max-w-full max-h-[min(70vh,560px)] rounded-lg border border-neutral-200 object-contain"
              />
            </div>
          )}

          {!loading && !error && previewUrl && !canPreviewInline && (
            <div className="rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-8 text-center text-sm text-neutral-600">
              <p>Visualização inline não disponível para este tipo de arquivo.</p>
              <p className="mt-1 text-xs text-neutral-500">
                Use o botão abaixo para baixar {item.documentFileName || 'o documento'}.
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 px-5 py-4 border-t border-neutral-200 shrink-0">
          <Button variant="secondary" onClick={onClose}>
            Fechar
          </Button>
          <Button onClick={onDownload}>
            <Download size={14} />
            Baixar
          </Button>
        </div>
      </div>
    </div>
  )
}
