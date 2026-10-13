import { useRef, useState } from 'react'
import { Play, Pause } from 'lucide-react'
import { cn } from '@/utils/cn'
import { useReducedMotion } from '@/hooks/useReducedMotion'

export function InstitutionalVideo({
  src,
  className,
  label = 'Vídeo institucional',
}) {
  const videoRef = useRef(null)
  const reducedMotion = useReducedMotion()
  const [isPlaying, setIsPlaying] = useState(!reducedMotion)

  function togglePlayback() {
    const video = videoRef.current
    if (!video) return

    if (video.paused) {
      video.play()
      setIsPlaying(true)
    } else {
      video.pause()
      setIsPlaying(false)
    }
  }

  return (
    <div className={cn('relative group', className)}>
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover"
        autoPlay={!reducedMotion}
        muted
        loop
        playsInline
        preload="metadata"
        aria-label={label}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      >
        <source src={src} type="video/mp4" />
      </video>

      <div
        className="absolute inset-0 ring-1 ring-inset ring-white/10 pointer-events-none"
        aria-hidden="true"
      />

      <button
        type="button"
        onClick={togglePlayback}
        className="absolute bottom-4 right-4 inline-flex items-center justify-center w-10 h-10 rounded-full bg-neutral-900/60 backdrop-blur-sm text-neutral-0 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
        aria-label={isPlaying ? 'Pausar vídeo' : 'Reproduzir vídeo'}
      >
        {isPlaying ? <Pause size={16} /> : <Play size={16} />}
      </button>
    </div>
  )
}
