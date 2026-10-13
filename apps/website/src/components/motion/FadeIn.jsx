import { LazyMotion, domAnimation, m } from 'framer-motion'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { fadeUpVariants } from '@/design-system/tokens/motion'

export function FadeIn({ children, className, delay = 0 }) {
  const reducedMotion = useReducedMotion()

  if (reducedMotion) {
    return <div className={className}>{children}</div>
  }

  return (
    <m.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-60px' }}
      variants={{
        hidden: fadeUpVariants.hidden,
        visible: {
          ...fadeUpVariants.visible,
          transition: {
            ...fadeUpVariants.visible.transition,
            delay,
          },
        },
      }}
    >
      {children}
    </m.div>
  )
}

export function MotionProvider({ children }) {
  return <LazyMotion features={domAnimation}>{children}</LazyMotion>
}
