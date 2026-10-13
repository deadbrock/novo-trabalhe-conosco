import { useEffect, useState } from 'react'
import { ArrowDown, ArrowUp, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { STAGE_COLOR_OPTIONS, stageStyles } from './pipelineUtils'
import { cn } from '@/utils/cn'

export function StageSettingsModal({ open, stages, onClose, onSave, saving }) {
  const [draft, setDraft] = useState([])

  useEffect(() => {
    if (open) setDraft(stages.map((s) => ({ ...s })))
  }, [open, stages])

  if (!open) return null

  function updateStage(index, patch) {
    setDraft((prev) => prev.map((s, i) => (i === index ? { ...s, ...patch } : s)))
  }

  function moveStage(index, direction) {
    const target = index + direction
    if (target < 0 || target >= draft.length) return
    setDraft((prev) => {
      const next = [...prev]
      ;[next[index], next[target]] = [next[target], next[index]]
      return next.map((s, i) => ({ ...s, sortOrder: i }))
    })
  }

  function handleSave() {
    onSave(
      draft.map((s, i) => ({
        slug: s.slug,
        label: s.label,
        color: s.color,
        sortOrder: i,
        isActive: s.isActive !== false,
      })),
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button type="button" className="absolute inset-0 bg-black/40" onClick={onClose} aria-label="Fechar" />
      <div className="relative w-full max-w-lg bg-white rounded-xl shadow-xl border border-neutral-200">
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100">
          <div>
            <h2 className="text-lg font-semibold">Configurar etapas</h2>
            <p className="text-sm text-neutral-500 mt-0.5">Renomeie, reordene e ajuste as cores das colunas</p>
          </div>
          <button type="button" onClick={onClose} className="p-2 rounded-lg hover:bg-neutral-100 text-neutral-500">
            <X size={18} />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-5 space-y-3">
          {draft.map((stage, index) => {
            const styles = stageStyles(stage.color)
            return (
              <div key={stage.slug} className="flex items-center gap-2 p-3 rounded-lg border border-neutral-200">
                <span className={cn('w-2.5 h-2.5 rounded-full shrink-0', styles.dot)} />
                <input
                  value={stage.label}
                  onChange={(e) => updateStage(index, { label: e.target.value })}
                  className="flex-1 h-9 px-3 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#003d7a]/20"
                />
                <select
                  value={stage.color}
                  onChange={(e) => updateStage(index, { color: e.target.value })}
                  className="h-9 px-2 text-sm border border-neutral-200 rounded-lg bg-white"
                >
                  {STAGE_COLOR_OPTIONS.map((color) => (
                    <option key={color} value={color}>
                      {color}
                    </option>
                  ))}
                </select>
                <div className="flex flex-col gap-0.5">
                  <button
                    type="button"
                    disabled={index === 0}
                    onClick={() => moveStage(index, -1)}
                    className="p-1 rounded hover:bg-neutral-100 disabled:opacity-30"
                  >
                    <ArrowUp size={14} />
                  </button>
                  <button
                    type="button"
                    disabled={index === draft.length - 1}
                    onClick={() => moveStage(index, 1)}
                    className="p-1 rounded hover:bg-neutral-100 disabled:opacity-30"
                  >
                    <ArrowDown size={14} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        <div className="flex justify-end gap-2 px-5 py-4 border-t border-neutral-100">
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Salvando...' : 'Salvar etapas'}
          </Button>
        </div>
      </div>
    </div>
  )
}
