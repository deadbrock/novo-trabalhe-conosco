import { cn } from '@/utils/cn'

export function RaceRadioGroup({ options, value, onChange, disabled = false, name = 'raceCategory' }) {
  return (
    <fieldset className="space-y-3" disabled={disabled}>
      <legend className="sr-only">Como você se autodeclara?</legend>
      {options.map((option) => {
        const selected = value === option.value

        return (
          <label
            key={option.value}
            className={cn(
              'flex min-h-[52px] cursor-pointer items-center gap-4 rounded-2xl border px-4 py-3.5 transition-all duration-200',
              selected
                ? 'border-brand-blue-600 bg-brand-blue-50/70 shadow-sm'
                : 'border-neutral-200 bg-white hover:border-brand-blue-200 hover:bg-brand-blue-50/30',
              disabled && 'cursor-not-allowed opacity-60',
            )}
          >
            <span
              className={cn(
                'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
                selected ? 'border-brand-blue-600' : 'border-neutral-300',
              )}
              aria-hidden="true"
            >
              <span
                className={cn(
                  'h-2.5 w-2.5 rounded-full bg-brand-blue-600 transition-transform duration-200',
                  selected ? 'scale-100' : 'scale-0',
                )}
              />
            </span>
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={selected}
              disabled={disabled}
              onChange={() => onChange(option.value)}
              className="sr-only"
            />
            <span className="text-base font-medium text-neutral-900">{option.label}</span>
          </label>
        )
      })}
    </fieldset>
  )
}
