import { DEFAULT_PIPELINE_STAGES } from '../constants/pipeline.js'

export const PIPELINE_STAGE_LABELS = Object.fromEntries(
  DEFAULT_PIPELINE_STAGES.map((stage) => [stage.slug, stage.label]),
)

export function pipelineStageLabel(slug) {
  return PIPELINE_STAGE_LABELS[slug] || slug || '—'
}

export const DOCUMENTATION_STAGE = 'documentation'
export const APPROVED_STAGE = 'approved'
export const INTERVIEW_STAGE = 'interview'
