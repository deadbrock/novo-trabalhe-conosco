import { useEffect, useId, useRef } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, m } from 'framer-motion'
import { X } from 'lucide-react'
import { PORTAL_META } from '@/constants/portal'
import { motion as motionTokens } from '@/design-system/tokens/motion'
import { useFocusTrap } from '@/hooks/useFocusTrap'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { cn } from '@/utils/cn'

function ModalDivider() {
  return <div className="h-px w-full bg-neutral-100" aria-hidden="true" />
}

export function AboutSystemModal({ isOpen, onClose, returnFocusRef }) {
  const dialogRef = useRef(null)
  const titleId = useId()
  const reducedMotion = useReducedMotion()

  useFocusTrap(dialogRef, isOpen)

  useEffect(() => {
    if (!isOpen) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    function handleKeyDown(event) {
      if (event.key === 'Escape') onClose()
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  useEffect(() => {
    if (!isOpen && returnFocusRef?.current) {
      returnFocusRef.current.focus()
    }
  }, [isOpen, returnFocusRef])

  const backdropTransition = reducedMotion
    ? { duration: 0 }
    : { duration: motionTokens.duration.fast, ease: motionTokens.ease.out }

  const panelTransition = reducedMotion
    ? { duration: 0 }
    : { duration: motionTokens.duration.base, ease: motionTokens.ease.out }

  const panelInitial = reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96 }
  const panelAnimate = reducedMotion ? { opacity: 1 } : { opacity: 1, scale: 1 }
  const panelExit = reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96 }

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <m.button
            type="button"
            aria-label="Fechar modal"
            className="absolute inset-0 bg-brand-blue-900/20 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={backdropTransition}
            onClick={onClose}
          />

          <m.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className={cn(
              'relative w-full max-w-md rounded-2xl bg-neutral-0',
              'border border-neutral-100 shadow-elevated',
              'px-8 py-10 sm:px-10 sm:py-12',
            )}
            initial={panelInitial}
            animate={panelAnimate}
            exit={panelExit}
            transition={panelTransition}
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={onClose}
              className={cn(
                'absolute top-4 right-4 inline-flex items-center justify-center',
                'w-9 h-9 rounded-full text-neutral-400',
                'hover:text-neutral-700 hover:bg-neutral-50 transition-colors',
              )}
              aria-label="Fechar"
            >
              <X size={18} aria-hidden="true" />
            </button>

            <div className="space-y-8 text-center">
              <header className="space-y-2 pt-2">
                <h2
                  id={titleId}
                  className="font-display text-2xl font-semibold tracking-tight text-neutral-900"
                >
                  {PORTAL_META.productName}
                </h2>
                <p className="text-sm text-neutral-500">{PORTAL_META.productSubtitle}</p>
              </header>

              <ModalDivider />

              <section className="space-y-1">
                <p className="text-xs font-medium uppercase tracking-wider text-neutral-400">
                  Versão
                </p>
                <p className="text-sm text-neutral-800">{PORTAL_META.version}</p>
              </section>

              <ModalDivider />

              <section className="space-y-1">
                <p className="text-xs font-medium uppercase tracking-wider text-neutral-400">
                  Desenvolvido por
                </p>
                <p className="text-sm font-medium text-neutral-900">
                  {PORTAL_META.developer.name}
                </p>
                <p className="text-sm text-neutral-500">{PORTAL_META.developer.role}</p>
              </section>

              <ModalDivider />

              <section className="space-y-1">
                <p className="text-xs font-medium uppercase tracking-wider text-neutral-400">
                  Contato
                </p>
                <a
                  href={`mailto:${PORTAL_META.developer.email}`}
                  className="text-sm text-brand-blue-600 hover:text-brand-blue-700 hover:underline transition-colors"
                >
                  {PORTAL_META.developer.email}
                </a>
              </section>
            </div>
          </m.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
