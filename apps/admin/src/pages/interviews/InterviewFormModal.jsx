import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { INTERVIEW_TYPE_MAP, toDatetimeLocalValue } from './interviewUtils'

const EMPTY_FORM = {
  applicationId: '',
  scheduledAt: '',
  durationMinutes: 60,
  type: 'VIDEO',
  location: '',
  meetingLink: '',
  status: 'SCHEDULED',
  notes: '',
  score: '',
  feedback: '',
}

export function InterviewFormModal({
  open,
  interview,
  candidates,
  preselectedApplicationId = '',
  onClose,
  onSubmit,
  saving,
}) {
  const [form, setForm] = useState(EMPTY_FORM)
  const isEdit = Boolean(interview?.id)

  useEffect(() => {
    if (!open) return
    if (interview) {
      setForm({
        applicationId: interview.applicationId,
        scheduledAt: toDatetimeLocalValue(interview.scheduledAt),
        durationMinutes: interview.durationMinutes,
        type: interview.type,
        location: interview.location || '',
        meetingLink: interview.meetingLink || '',
        status: interview.status,
        notes: interview.notes || '',
        score: interview.score ?? '',
        feedback: interview.feedback || '',
      })
    } else {
      setForm({
        ...EMPTY_FORM,
        applicationId: preselectedApplicationId || '',
      })
    }
  }, [open, interview, preselectedApplicationId])

  if (!open) return null

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function handleSubmit(event) {
    event.preventDefault()
    onSubmit({
      ...form,
      score: form.score === '' ? null : Number(form.score),
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="w-full max-w-xl bg-white rounded-xl shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100">
          <h2 className="text-lg font-semibold">{isEdit ? 'Editar entrevista' : 'Agendar entrevista'}</h2>
          <button type="button" onClick={onClose} className="p-2 rounded-lg hover:bg-neutral-100 text-neutral-500">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {!isEdit && (
            <Field label="Candidato">
              {candidates.length === 0 ? (
                <p className="text-sm text-neutral-500 rounded-lg border border-dashed border-neutral-200 px-3 py-4">
                  Nenhum candidato na etapa Entrevista do pipeline. Mova o candidato para essa etapa antes de agendar.
                </p>
              ) : (
                <select
                  required
                  value={form.applicationId}
                  onChange={(e) => updateField('applicationId', e.target.value)}
                  className={inputClass}
                >
                  <option value="">Selecione o candidato</option>
                  {candidates.map((candidate) => (
                    <option key={candidate.applicationId} value={candidate.applicationId}>
                      {candidate.candidateName} — {candidate.jobTitle}
                    </option>
                  ))}
                </select>
              )}
            </Field>
          )}

          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Data e hora">
              <input
                type="datetime-local"
                required
                value={form.scheduledAt}
                onChange={(e) => updateField('scheduledAt', e.target.value)}
                className={inputClass}
              />
            </Field>
            <Field label="Duração (min)">
              <input
                type="number"
                min={15}
                step={15}
                value={form.durationMinutes}
                onChange={(e) => updateField('durationMinutes', e.target.value)}
                className={inputClass}
              />
            </Field>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Tipo">
              <select value={form.type} onChange={(e) => updateField('type', e.target.value)} className={inputClass}>
                {Object.entries(INTERVIEW_TYPE_MAP).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </Field>
            {isEdit && (
              <Field label="Status">
                <select value={form.status} onChange={(e) => updateField('status', e.target.value)} className={inputClass}>
                  <option value="SCHEDULED">Agendada</option>
                  <option value="COMPLETED">Concluída</option>
                  <option value="CANCELLED">Cancelada</option>
                  <option value="NO_SHOW">Não compareceu</option>
                </select>
              </Field>
            )}
          </div>

          {form.type === 'IN_PERSON' ? (
            <Field label="Local">
              <input value={form.location} onChange={(e) => updateField('location', e.target.value)} className={inputClass} />
            </Field>
          ) : (
            <Field label={form.type === 'PHONE' ? 'Telefone / contato' : 'Link da reunião'}>
              <input
                value={form.meetingLink}
                onChange={(e) => updateField('meetingLink', e.target.value)}
                className={inputClass}
              />
            </Field>
          )}

          <Field label="Notas internas">
            <textarea
              rows={3}
              value={form.notes}
              onChange={(e) => updateField('notes', e.target.value)}
              className={inputClass}
            />
          </Field>

          {isEdit && (
            <>
              <Field label="Score (0-10)">
                <input
                  type="number"
                  min={0}
                  max={10}
                  value={form.score}
                  onChange={(e) => updateField('score', e.target.value)}
                  className={inputClass}
                />
              </Field>
              <Field label="Parecer">
                <textarea
                  rows={4}
                  value={form.feedback}
                  onChange={(e) => updateField('feedback', e.target.value)}
                  className={inputClass}
                  placeholder="Avaliação final da entrevista..."
                />
              </Field>
            </>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={saving || (!isEdit && candidates.length === 0)}>
              {saving ? 'Salvando...' : isEdit ? 'Salvar alterações' : 'Agendar'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-medium text-neutral-600">{label}</span>
      {children}
    </label>
  )
}

const inputClass = 'w-full min-h-9 px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#003d7a]/20 focus:border-[#003d7a]'
