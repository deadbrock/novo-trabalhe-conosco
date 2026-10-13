import { cn } from '@/utils/cn'
import { Badge } from '@/components/ui/Badge/Badge'
import { Heading } from '@/components/ui/Heading/Heading'
import { Text } from '@/components/ui/Text/Text'
import { Link } from '@/components/ui/Link/Link'
import { ArrowRight } from 'lucide-react'
import { FadeIn } from '@/components/motion/FadeIn'

export function SectionHeader({
  badge,
  title,
  description,
  link,
  linkLabel = 'Saiba mais',
  align = 'left',
  className,
}) {
  return (
    <FadeIn
      className={cn(
        'mb-12 md:mb-16',
        align === 'center' && 'text-center mx-auto max-w-2xl',
        align === 'left' && 'max-w-2xl',
        className,
      )}
    >
      {badge && (
        <Badge variant="brand" className="mb-4">
          {badge}
        </Badge>
      )}
      <Heading level={3}>{title}</Heading>
      {description && (
        <Text size="lg" className="mt-4">
          {description}
        </Text>
      )}
      {link && (
        <Link
          to={link}
          className="inline-flex items-center gap-2 mt-6 text-sm font-medium text-brand-red-600 hover:text-brand-red-700 transition-colors group"
        >
          {linkLabel}
          <ArrowRight
            size={16}
            className="transition-transform group-hover:translate-x-0.5"
            aria-hidden="true"
          />
        </Link>
      )}
    </FadeIn>
  )
}
