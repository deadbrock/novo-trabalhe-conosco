import { cn } from '@/utils/cn'

export function FormField({
  id,
  label,
  error,
  children,
  className,
}) {
  return (
    <div className={cn('space-y-1.5', className)}>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-neutral-700">
          {label}
        </label>
      )}
      {children}
      {error && (
        <p id={`${id}-error`} className="text-xs text-brand-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}

export const inputClassName =
  'w-full h-11 px-4 rounded-xl border border-neutral-200 text-sm focus:border-brand-blue-500 focus:ring-1 focus:ring-brand-blue-500 outline-none transition-colors bg-white'

export const textareaClassName =
  'w-full px-4 py-3 rounded-xl border border-neutral-200 text-sm focus:border-brand-blue-500 focus:ring-1 focus:ring-brand-blue-500 outline-none transition-colors resize-none bg-white'
