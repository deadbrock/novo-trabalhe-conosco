export function slugify(text) {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export async function uniqueJobSlug(prisma, title, excludeId = null) {
  const base = slugify(title) || 'vaga'
  let slug = base
  let counter = 1

  while (true) {
    const existing = await prisma.job.findFirst({
      where: {
        slug,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
    })
    if (!existing) return slug
    slug = `${base}-${counter++}`
  }
}

export function mapJobPublic(job) {
  return {
    id: job.id,
    slug: job.slug,
    title: job.title,
    area: job.area || job.department?.name || '',
    location: job.locationLabel || job.stateCode || '',
    type: job.workModality,
    contract: job.employmentType,
    level: job.level,
    description: job.description,
    requirements: job.requirements,
    benefits: job.benefits,
    salaryRange: job.salaryRange,
    workSchedule: job.workSchedule,
    urgency: job.urgency,
    featured: job.featured,
    postedAt: job.publishedAt?.toISOString() || job.createdAt.toISOString(),
    client: job.client?.name || '',
    contractName: job.contract?.name || '',
  }
}

export function mapJobAdmin(job) {
  return {
    ...mapJobPublic(job),
    status: job.status,
    quantity: job.quantity,
    stateCode: job.stateCode,
    unitId: job.unitId || job.unit?.id || null,
    unitName: job.unit?.name || null,
    clientId: job.clientId,
    contractId: job.contractId,
    departmentId: job.departmentId,
    cityId: job.cityId,
    publishedAt: job.publishedAt?.toISOString() || null,
    createdAt: job.createdAt.toISOString(),
    updatedAt: job.updatedAt.toISOString(),
  }
}

const jobInclude = {
  client: true,
  contract: true,
  department: true,
  unit: true,
}

export { jobInclude }
