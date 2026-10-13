import { useFieldArray, useFormContext } from 'react-hook-form'
import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button/Button'
import { FormField, inputClassName, textareaClassName } from '@/features/auth/components/FormField'
import { EMPTY_EXPERIENCE } from '@/features/candidate/constants/profileDefaults'

export function ExperienceFields() {
  const { register, control, watch } = useFormContext()
  const { fields, append, remove } = useFieldArray({ control, name: 'experiences' })

  return (
    <div className="space-y-4">
      {fields.map((field, index) => {
        const isCurrent = watch(`experiences.${index}.current`)

        return (
          <div key={field.id} className="rounded-xl border border-neutral-200 p-4 space-y-4 bg-neutral-50/40">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-neutral-800">Experiência {index + 1}</p>
              {fields.length > 1 && (
                <button
                  type="button"
                  onClick={() => remove(index)}
                  className="inline-flex items-center gap-1 text-xs text-brand-red-600 hover:text-brand-red-700"
                >
                  <Trash2 size={14} />
                  Remover
                </button>
              )}
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <FormField id={`exp-company-${index}`} label="Empresa">
                <input
                  id={`exp-company-${index}`}
                  className={inputClassName}
                  {...register(`experiences.${index}.company`)}
                />
              </FormField>
              <FormField id={`exp-role-${index}`} label="Cargo">
                <input
                  id={`exp-role-${index}`}
                  className={inputClassName}
                  {...register(`experiences.${index}.role`)}
                />
              </FormField>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <FormField id={`exp-start-${index}`} label="Início">
                <input
                  id={`exp-start-${index}`}
                  type="month"
                  className={inputClassName}
                  {...register(`experiences.${index}.startDate`)}
                />
              </FormField>
              <FormField id={`exp-end-${index}`} label="Término">
                <input
                  id={`exp-end-${index}`}
                  type="month"
                  disabled={isCurrent}
                  className={`${inputClassName} disabled:bg-neutral-100 disabled:text-neutral-400`}
                  {...register(`experiences.${index}.endDate`)}
                />
              </FormField>
            </div>

            <label className="inline-flex items-center gap-2 text-sm text-neutral-700">
              <input type="checkbox" {...register(`experiences.${index}.current`)} />
              Trabalho atualmente neste cargo
            </label>

            <FormField id={`exp-desc-${index}`} label="Descrição das atividades">
              <textarea
                id={`exp-desc-${index}`}
                rows={3}
                className={textareaClassName}
                {...register(`experiences.${index}.description`)}
              />
            </FormField>
          </div>
        )
      })}

      <Button type="button" variant="outline" size="sm" onClick={() => append({ ...EMPTY_EXPERIENCE })}>
        <Plus size={16} />
        Adicionar experiência
      </Button>
    </div>
  )
}
