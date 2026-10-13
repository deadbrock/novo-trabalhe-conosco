import { Text } from '@/components/ui/Text/Text'

export function ProfileSection({ title, description, children }) {
  return (
    <section className="rounded-2xl border border-brand-blue-100 bg-white p-6 md:p-8 space-y-5">
      <div>
        <h2 className="font-display text-lg font-semibold text-neutral-900">{title}</h2>
        {description && (
          <Text size="sm" className="mt-1">
            {description}
          </Text>
        )}
      </div>
      {children}
    </section>
  )
}
