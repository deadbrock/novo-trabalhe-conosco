import { m } from 'framer-motion'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { staggerContainer, fadeUpVariants } from '@/design-system/tokens/motion'

export function StaggerChildren({ children, className }) {
  const reducedMotion = useReducedMotion()

  if (reducedMotion) {
    return <div className={className}>{children}</div>
  }

  return (
    <m.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-40px' }}
      variants={staggerContainer}
    >
      {children}
    </m.div>
  )
}

export function StaggerItem({ children, className }) {
  const reducedMotion = useReducedMotion()

  if (reducedMotion) {
    return <div className={className}>{children}</div>
  }

  return (
    <m.div className={className} variants={fadeUpVariants}>
      {children}
    </m.div>
  )
}
