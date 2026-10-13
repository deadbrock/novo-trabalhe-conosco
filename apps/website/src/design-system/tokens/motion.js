export const motion = {
  duration: {
    fast: 0.2,
    base: 0.4,
    slow: 0.6,
    reveal: 0.8,
  },
  ease: {
    out: [0.16, 1, 0.3, 1],
    inOut: [0.65, 0, 0.35, 1],
  },
  spring: {
    gentle: { type: 'spring', stiffness: 120, damping: 20 },
    snappy: { type: 'spring', stiffness: 200, damping: 25 },
  },
}

export const fadeUpVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: motion.duration.slow, ease: motion.ease.out },
  },
}

export const staggerContainer = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
}
