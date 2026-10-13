export function PageHeroAside({ eyebrow, stats, highlight }) {
  const HighlightIcon = highlight?.icon

  return (
    <div className="rounded-3xl border border-brand-blue-100 bg-neutral-0 p-6 md:p-8 shadow-soft">
      {eyebrow && (
        <p className="font-display text-xs font-semibold tracking-widest uppercase text-brand-blue-600 mb-6">
          {eyebrow}
        </p>
      )}
      <div className="grid grid-cols-2 gap-x-6 gap-y-8">
        {stats.map(({ value, label, icon: Icon }) => (
          <div key={label}>
            {Icon && <Icon size={18} className="text-brand-red-600 mb-3" aria-hidden="true" />}
            <p className="font-display text-2xl md:text-3xl font-semibold tracking-tight text-neutral-900">
              {value}
            </p>
            <p className="mt-1 text-sm text-neutral-500">{label}</p>
          </div>
        ))}
      </div>
      {highlight && (
        <div className="mt-8 pt-6 border-t border-brand-blue-100 flex items-center gap-3">
          {HighlightIcon && (
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-red-50 text-brand-red-600">
              <HighlightIcon size={18} aria-hidden="true" />
            </span>
          )}
          <div>
            <p className="font-display text-sm font-semibold text-neutral-900">{highlight.title}</p>
            <p className="text-xs text-neutral-500">{highlight.description}</p>
          </div>
        </div>
      )}
    </div>
  )
}
