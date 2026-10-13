import { useFieldArray, useFormContext } from 'react-hook-form'
import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button/Button'
import { FormField, inputClassName } from '@/features/auth/components/FormField'
import { EMPTY_COURSE } from '@/features/candidate/constants/profileDefaults'

export function CourseFields() {
  const { register, control } = useFormContext()
  const { fields, append, remove } = useFieldArray({ control, name: 'courses' })

  return (
    <div className="space-y-4">
      {fields.map((field, index) => (
        <div key={field.id} className="rounded-xl border border-neutral-200 p-4 space-y-4 bg-neutral-50/40">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-medium text-neutral-800">Curso {index + 1}</p>
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
            <FormField id={`course-name-${index}`} label="Nome do curso">
              <input
                id={`course-name-${index}`}
                className={inputClassName}
                {...register(`courses.${index}.name`)}
              />
            </FormField>
            <FormField id={`course-institution-${index}`} label="Instituição">
              <input
                id={`course-institution-${index}`}
                className={inputClassName}
                {...register(`courses.${index}.institution`)}
              />
            </FormField>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <FormField id={`course-year-${index}`} label="Ano de conclusão">
              <input
                id={`course-year-${index}`}
                inputMode="numeric"
                placeholder="2024"
                className={inputClassName}
                {...register(`courses.${index}.completionYear`)}
              />
            </FormField>
            <FormField id={`course-hours-${index}`} label="Carga horária">
              <input
                id={`course-hours-${index}`}
                placeholder="40h"
                className={inputClassName}
                {...register(`courses.${index}.workloadHours`)}
              />
            </FormField>
          </div>
        </div>
      ))}

      <Button type="button" variant="outline" size="sm" onClick={() => append({ ...EMPTY_COURSE })}>
        <Plus size={16} />
        Adicionar curso
      </Button>
    </div>
  )
}
