import { useEffect } from 'react'
import { FileSignature } from 'lucide-react'
import { Button } from '@/components/ui/Button/Button'

export function ConfirmSignModal({ open, loading, onCancel, onConfirm }) {
  useEffect(() => {
    if (!open) return undefined

    function handleKeyDown(event) {
      if (event.key === 'Escape' && !loading) onCancel()
    }

    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [open, loading, onCancel])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center" role="dialog" aria-modal="true">
      <button
        type="button"
        className="absolute inset-0 bg-neutral-900/45 backdrop-blur-sm"
        aria-label="Cancelar"
        disabled={loading}
        onClick={onCancel}
      />

      <div className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="px-6 pt-8 pb-6 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-blue-50 text-brand-blue-700">
            <FileSignature size={28} aria-hidden="true" />
          </div>
          <h2 className="font-display text-xl font-semibold text-neutral-900">Confirmar assinatura</h2>
          <p className="mt-3 text-sm leading-relaxed text-neutral-600">
            Você confirma que deseja assinar eletronicamente este documento?
          </p>
          <p className="mt-2 text-xs text-neutral-500">
            Após a confirmação, o PDF será gerado automaticamente com os dados informados.
          </p>
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-neutral-100 px-6 py-5 sm:flex-row sm:justify-end">
          <Button variant="outline" disabled={loading} onClick={onCancel} className="w-full sm:w-auto">
            Cancelar
          </Button>
          <Button disabled={loading} onClick={onConfirm} className="w-full sm:w-auto">
            {loading ? 'Processando...' : 'Confirmar assinatura'}
          </Button>
        </div>
      </div>
    </div>
  )
}
