import { DEFAULT_PIPELINE_STAGES } from '@fg/contracts'
import { prisma, notDeleted } from '../lib/prisma.js'

function hasPipelineModel() {
  return typeof prisma.pipelineStageConfig?.count === 'function'
}

function mapRawStage(row) {
  return {
    id: row.id,
    slug: row.slug,
    label: row.label,
    color: row.color,
    sortOrder: row.sort_order,
    isTerminal: row.is_terminal,
    isActive: row.is_active,
  }
}

export async function countPipelineStages() {
  if (hasPipelineModel()) {
    return prisma.pipelineStageConfig.count({ where: notDeleted() })
  }

  const rows = await prisma.$queryRaw`
    SELECT COUNT(*)::int AS count
    FROM pipeline_stage_configs
    WHERE deleted_at IS NULL
  `
  return rows[0]?.count ?? 0
}

export async function findPipelineStages({ activeOnly = false } = {}) {
  if (hasPipelineModel()) {
    const stages = await prisma.pipelineStageConfig.findMany({
      where: {
        ...notDeleted(),
        ...(activeOnly ? { isActive: true } : {}),
      },
      orderBy: { sortOrder: 'asc' },
    })
    return stages
  }

  const rows = activeOnly
    ? await prisma.$queryRaw`
        SELECT id, slug, label, color, sort_order, is_terminal, is_active
        FROM pipeline_stage_configs
        WHERE deleted_at IS NULL AND is_active = true
        ORDER BY sort_order ASC
      `
    : await prisma.$queryRaw`
        SELECT id, slug, label, color, sort_order, is_terminal, is_active
        FROM pipeline_stage_configs
        WHERE deleted_at IS NULL
        ORDER BY sort_order ASC
      `

  return rows.map(mapRawStage)
}

export async function createPipelineStage(data) {
  if (hasPipelineModel()) {
    return prisma.pipelineStageConfig.create({ data })
  }

  const rows = await prisma.$queryRaw`
    INSERT INTO pipeline_stage_configs (
      id, slug, label, color, sort_order, is_terminal, is_active, created_at, updated_at
    ) VALUES (
      gen_random_uuid(), ${data.slug}, ${data.label}, ${data.color},
      ${data.sortOrder}, ${data.isTerminal ?? false}, ${data.isActive ?? true}, NOW(), NOW()
    )
    RETURNING id, slug, label, color, sort_order, is_terminal, is_active
  `
  return mapRawStage(rows[0])
}

export async function updatePipelineStageBySlug(slug, data) {
  if (hasPipelineModel()) {
    return prisma.pipelineStageConfig.update({ where: { slug }, data })
  }

  await prisma.$executeRaw`
    UPDATE pipeline_stage_configs
    SET
      label = ${data.label},
      color = ${data.color},
      sort_order = ${data.sortOrder},
      is_active = ${data.isActive ?? true},
      updated_at = NOW()
    WHERE slug = ${slug} AND deleted_at IS NULL
  `
}

export async function findActivePipelineStageBySlug(slug) {
  if (hasPipelineModel()) {
    return prisma.pipelineStageConfig.findFirst({
      where: { slug, ...notDeleted(), isActive: true },
    })
  }

  const rows = await prisma.$queryRaw`
    SELECT id, slug, label, color, sort_order, is_terminal, is_active
    FROM pipeline_stage_configs
    WHERE slug = ${slug} AND deleted_at IS NULL AND is_active = true
    LIMIT 1
  `
  return rows[0] ? mapRawStage(rows[0]) : null
}

export async function seedDefaultPipelineStages() {
  for (const stage of DEFAULT_PIPELINE_STAGES) {
    await createPipelineStage(stage)
  }
}
