import { useEffect, useRef, useState } from 'react'
import { cn } from '@/utils/cn'
import { Section } from '@/components/ui/Section/Section'
import { Text } from '@/components/ui/Text/Text'
import { StaggerChildren, StaggerItem } from '@/components/motion/StaggerChildren'
import { metrics as defaultMetrics } from '@/mocks/metrics.mock'
import { useCmsSection } from '@/context/CmsContext'

function AnimatedMetric({ value, suffix, display, label, description, colorClass }) {
  const ref = useRef(null)
  const [displayValue, setDisplayValue] = useState(0)
  const [started, setStarted] = useState(false)
  const isTextMetric = Boolean(display)

  useEffect(() => {
    if (isTextMetric) return

    const element = ref.current
    if (!element) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setStarted(true)
          observer.disconnect()
        }
      },
      { threshold: 0.5 },
    )

    observer.observe(element)
    return () => observer.disconnect()
  }, [isTextMetric])

  useEffect(() => {
    if (isTextMetric || !started) return

    const duration = 1500
    const start = performance.now()

    function animate(now) {
      const progress = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplayValue(Math.floor(eased * value))

      if (progress < 1) requestAnimationFrame(animate)
    }

    requestAnimationFrame(animate)
  }, [started, value, isTextMetric])

  return (
    <StaggerItem>
      <div ref={ref} className="text-center lg:text-left">
        <p className={cn('font-display text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight tabular-nums', colorClass)}>
          {isTextMetric ? display : `${displayValue.toLocaleString('pt-BR')}${suffix ?? ''}`}
        </p>
        <p className="mt-2 font-display text-base font-medium text-neutral-800">{label}</p>
        <Text size="sm" color="muted" className="mt-1 max-w-xs mx-auto lg:mx-0">
          {description}
        </Text>
      </div>
    </StaggerItem>
  )
}

export function MetricsSection() {
  const cms = useCmsSection('metrics', { items: defaultMetrics })
  const metrics = cms.items || defaultMetrics

  return (
    <Section className="bg-brand-blue-50/50 border-y border-brand-blue-100">
      <StaggerChildren className="grid grid-cols-2 lg:grid-cols-4 gap-10 md:gap-12">
        {metrics.map((metric, index) => (
          <AnimatedMetric
            key={metric.label}
            {...metric}
            colorClass={index % 2 === 0 ? 'text-brand-red-600' : 'text-brand-blue-600'}
          />
        ))}
      </StaggerChildren>
    </Section>
  )
}
