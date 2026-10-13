import { useState } from 'react'
import { ApplicationCard } from './ApplicationCard'
import { stageStyles } from './pipelineUtils'
import { cn } from '@/utils/cn'

export function KanbanColumn({ stage, applications, onMove, movingId }) {
  const [isOver, setIsOver] = useState(false)
  const styles = stageStyles(stage.color)
  const totalCount = stage.totalCount ?? applications.length
  const showTruncatedHint = stage.truncated

  function handleDragOver(e) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setIsOver(true)
  }

  function handleDragLeave() {
    setIsOver(false)
  }

  function handleDrop(e) {
    e.preventDefault()
    setIsOver(false)
    const applicationId = e.dataTransfer.getData('application/id')
    const fromStage = e.dataTransfer.getData('application/stage')
    if (applicationId && fromStage !== stage.slug) {
      onMove(applicationId, stage.slug)
    }
  }

  function handleDragStart(e, application) {
    e.dataTransfer.setData('application/id', application.id)
    e.dataTransfer.setData('application/stage', application.currentStage)
    e.dataTransfer.effectAllowed = 'move'
  }

  return (
    <section
      className={cn(
        'flex flex-col w-72 shrink-0 rounded-xl border transition-colors',
        isOver ? 'border-[#003d7a] bg-[#003d7a]/5' : 'border-neutral-200 bg-neutral-50/50',
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <header className={cn('px-3 py-2.5 border-b rounded-t-xl flex items-center justify-between gap-2', styles.header)}>
        <div className="flex items-center gap-2 min-w-0">
          <span className={cn('w-2 h-2 rounded-full shrink-0', styles.dot)} />
          <h3 className={cn('text-sm font-medium truncate', styles.text)}>{stage.label}</h3>
        </div>
        <span className="text-xs font-medium text-neutral-500 bg-white/80 px-2 py-0.5 rounded-full shrink-0" title={showTruncatedHint ? `Exibindo ${applications.length} de ${totalCount}` : undefined}>
          {showTruncatedHint ? `${applications.length}/${totalCount}` : totalCount}
        </span>
      </header>

      <div className="flex-1 p-2 space-y-2 min-h-[120px] max-h-[calc(100vh-280px)] overflow-y-auto">
        {applications.length === 0 ? (
          <p className="text-xs text-neutral-400 text-center py-6 px-2">Arraste candidatos para esta etapa</p>
        ) : (
          applications.map((app) => (
            <ApplicationCard
              key={app.id}
              application={app}
              onDragStart={handleDragStart}
              isDragging={movingId === app.id}
            />
          ))
        )}
      </div>
    </section>
  )
}

export function KanbanBoard({ stages, onMove, movingId }) {
  return (
    <div className="flex gap-4 overflow-x-auto pb-4 -mx-1 px-1">
      {stages.map((stage) => (
        <KanbanColumn
          key={stage.slug}
          stage={stage}
          applications={stage.applications}
          onMove={onMove}
          movingId={movingId}
        />
      ))}
    </div>
  )
}
