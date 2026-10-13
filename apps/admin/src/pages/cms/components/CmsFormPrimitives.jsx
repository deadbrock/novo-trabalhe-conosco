import { useState } from 'react'
import { HelpCircle, X, Plus, Trash2, ChevronUp, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { cmsInputClass, cmsTextareaClass } from '../constants/cmsFormStyles'

function HelpContent({ help }) {
  if (!help) return null

  return (
    <div className="space-y-5 text-sm text-neutral-600">
      {help.intro && <p className="text-neutral-700">{help.intro}</p>}

      {help.steps?.length > 0 && (
        <div>
          <p className="font-medium text-neutral-900 mb-2">Passo a passo</p>
          <ol className="list-decimal list-inside space-y-2">
            {help.steps.map((step, index) => (
              <li key={index} className="leading-relaxed">
                {step.split('**').map((part, i) =>
                  i % 2 === 1 ? (
                    <strong key={i} className="font-semibold text-neutral-800">
                      {part}
                    </strong>
                  ) : (
                    part
                  ),
                )}
              </li>
            ))}
          </ol>
        </div>
      )}

      {help.tips?.length > 0 && (
        <div className="rounded-lg bg-blue-50 border border-blue-100 px-4 py-3">
          <p className="font-medium text-blue-900 mb-2">Dicas</p>
          <ul className="list-disc list-inside space-y-1 text-blue-800">
            {help.tips.map((tip, index) => (
              <li key={index}>{tip}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

export function CmsHelpModal({ open, onClose, help }) {
  if (!open || !help) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div
        className="w-full max-w-lg bg-white rounded-xl shadow-xl max-h-[85vh] overflow-y-auto"
        role="dialog"
        aria-labelledby="cms-help-title"
      >
        <div className="flex items-start justify-between gap-4 px-5 py-4 border-b border-neutral-100 sticky top-0 bg-white">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600 shrink-0">
              <HelpCircle size={20} />
            </div>
            <h2 id="cms-help-title" className="text-lg font-semibold text-neutral-900 pt-0.5">
              {help.title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-neutral-100 text-neutral-500 shrink-0"
            aria-label="Fechar ajuda"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-5">
          <HelpContent help={help} />
        </div>

        <div className="px-5 pb-5">
          <Button variant="secondary" className="w-full" onClick={onClose}>
            Entendi
          </Button>
        </div>
      </div>
    </div>
  )
}

export function CmsHelpButton({ help, className = '', onClick }) {
  if (!help) return null

  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center justify-center p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors shrink-0 ${className}`}
      title="Como editar esta seção"
      aria-label="Abrir ajuda"
    >
      <HelpCircle size={18} />
    </button>
  )
}

export function CmsField({ label, hint, error, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-neutral-700 mb-1">{label}</label>
      {children}
      {hint && !error && <p className="text-xs text-neutral-400 mt-1">{hint}</p>}
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  )
}

export function CmsFormCard({ title, summary, help, onHelpClick, children }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="font-semibold text-neutral-900">{title}</h3>
            {summary && <p className="text-sm text-neutral-500 mt-1 leading-relaxed">{summary}</p>}
          </div>
          {help && onHelpClick && <CmsHelpButton help={help} onClick={onHelpClick} />}
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-2">{children}</CardContent>
    </Card>
  )
}

export function PageHeaderFields({ value = {}, onChange, prefix = 'pageHeader' }) {
  const header = value[prefix] || value

  function update(field, fieldValue) {
    if (prefix === 'pageHeader') {
      onChange({ ...value, pageHeader: { ...header, [field]: fieldValue } })
    } else {
      onChange({ ...value, [field]: fieldValue })
    }
  }

  const data = prefix === 'pageHeader' ? header : value

  return (
    <>
      <CmsField label="Etiqueta (badge)">
        <input
          type="text"
          className={cmsInputClass}
          value={data.badge || ''}
          onChange={(e) => update('badge', e.target.value)}
          placeholder="Ex.: Nossa História"
        />
      </CmsField>
      <CmsField label="Título da página">
        <input
          type="text"
          className={cmsInputClass}
          value={data.title || ''}
          onChange={(e) => update('title', e.target.value)}
        />
      </CmsField>
      <CmsField label="Descrição">
        <textarea
          className={cmsTextareaClass}
          rows={3}
          value={data.description || ''}
          onChange={(e) => update('description', e.target.value)}
        />
      </CmsField>
    </>
  )
}

export function CtaFields({ label, value = {}, onChange }) {
  return (
    <div className="grid sm:grid-cols-2 gap-4">
      <CmsField label={`Texto do botão — ${label}`}>
        <input
          type="text"
          className={cmsInputClass}
          value={value.label || ''}
          onChange={(e) => onChange({ ...value, label: e.target.value })}
        />
      </CmsField>
      <CmsField label="Link de destino" hint="Ex.: /vagas ou /nossa-cultura">
        <input
          type="text"
          className={cmsInputClass}
          value={value.href || ''}
          onChange={(e) => onChange({ ...value, href: e.target.value })}
        />
      </CmsField>
    </div>
  )
}

export function ListItemCard({
  index,
  title,
  onRemove,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
  children,
}) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-neutral-50/50 p-4 space-y-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-neutral-800">{title || `Item ${index + 1}`}</p>
        <div className="flex items-center gap-1">
          {onMoveUp && (
            <button
              type="button"
              disabled={!canMoveUp}
              onClick={onMoveUp}
              className="p-1.5 rounded-lg hover:bg-neutral-200 disabled:opacity-30 text-neutral-500"
              aria-label="Mover para cima"
            >
              <ChevronUp size={16} />
            </button>
          )}
          {onMoveDown && (
            <button
              type="button"
              disabled={!canMoveDown}
              onClick={onMoveDown}
              className="p-1.5 rounded-lg hover:bg-neutral-200 disabled:opacity-30 text-neutral-500"
              aria-label="Mover para baixo"
            >
              <ChevronDown size={16} />
            </button>
          )}
          {onRemove && (
            <button
              type="button"
              onClick={onRemove}
              className="p-1.5 rounded-lg hover:bg-red-50 text-red-600"
              aria-label="Remover item"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      </div>
      {children}
    </div>
  )
}

export function moveListItem(items, index, direction) {
  const next = [...items]
  const target = index + direction
  if (target < 0 || target >= next.length) return items
  ;[next[index], next[target]] = [next[target], next[index]]
  return next
}

export function AddListItemButton({ label, onClick }) {
  return (
    <Button type="button" variant="secondary" onClick={onClick} className="w-full sm:w-auto">
      <Plus size={16} />
      {label}
    </Button>
  )
}

export function slugify(text) {
  return String(text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}
