import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/Button/Button'
import { cn } from '@/utils/cn'

export function DocumentPreviewModal({ open, title, previewUrl, onClose }) {
  const dialogRef = useRef(null)

  useEffect(() => {
    if (!open) return undefined

    function handleKeyDown(event) {
      if (event.key === 'Escape') onClose()
    }

    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="document-preview-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-neutral-900/50 backdrop-blur-sm"
        aria-label="Fechar visualização"
        onClick={onClose}
      />

      <div
        ref={dialogRef}
        className={cn(
          'relative z-10 flex w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl',
          'h-[min(88vh,900px)] animate-in fade-in zoom-in-95 duration-200',
        )}
      >
        <header className="flex items-center justify-between gap-4 border-b border-neutral-100 px-5 py-4 sm:px-6">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-brand-blue-600">Somente leitura</p>
            <h2 id="document-preview-title" className="font-display text-lg font-semibold text-neutral-900">
              {title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-800"
            aria-label="Fechar"
          >
            <X size={20} />
          </button>
        </header>

        <div className="flex-1 bg-neutral-50 p-3 sm:p-4">
          {previewUrl ? (
            <iframe
              title={title}
              src={previewUrl}
              className="h-full w-full rounded-xl border border-neutral-200 bg-white"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-neutral-200 border-t-brand-red-600" />
            </div>
          )}
        </div>

        <footer className="border-t border-neutral-100 px-5 py-4 sm:px-6">
          <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">
            Fechar
          </Button>
        </footer>
      </div>
    </div>
  )
}
