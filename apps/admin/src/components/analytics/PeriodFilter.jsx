import { cn } from '@/utils/cn'

const PERIOD_OPTIONS = [
  { value: '7d', label: '7 dias' },
  { value: '30d', label: '30 dias' },
  { value: '90d', label: '90 dias' },
  { value: 'all', label: 'Todo período' },
]

export function PeriodFilter({ value, onChange, className }) {
  return (
    <div className={cn('inline-flex rounded-lg border border-neutral-200 bg-white p-1', className)}>
      {PERIOD_OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={cn(
            'px-3 py-1.5 text-xs font-medium rounded-md transition-colors',
            value === option.value
              ? 'bg-[#003d7a] text-white'
              : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50',
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

export { PERIOD_OPTIONS }
