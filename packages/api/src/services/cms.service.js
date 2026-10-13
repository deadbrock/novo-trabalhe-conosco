import { prisma, notDeleted } from '../lib/prisma.js'
import { createAuditLog } from './audit.service.js'

function mapContent(record) {
  return {
    id: record.id,
    version: record.version,
    status: record.status,
    payload: record.payload,
    publishedAt: record.publishedAt?.toISOString() || null,
    updatedAt: record.updatedAt.toISOString(),
    createdAt: record.createdAt.toISOString(),
  }
}

async function loadSectionBySlug(slug) {
  const section = await prisma.cmsSection.findFirst({
    where: { slug, ...notDeleted() },
    include: {
      contents: {
        where: notDeleted(),
        orderBy: { version: 'desc' },
      },
    },
  })
  if (!section) throw new Error('NOT_FOUND')
  return section
}

function getLatestContent(contents, status) {
  return contents.find((entry) => entry.status === status) || null
}

export async function listCmsSections() {
  const sections = await prisma.cmsSection.findMany({
    where: notDeleted(),
    include: {
      contents: {
        where: notDeleted(),
        orderBy: { version: 'desc' },
      },
    },
    orderBy: { name: 'asc' },
  })

  return sections.map((section) => {
    const published = getLatestContent(section.contents, 'PUBLISHED')
    const draft = getLatestContent(section.contents, 'DRAFT')

    return {
      id: section.id,
      slug: section.slug,
      name: section.name,
      hasDraft: Boolean(draft),
      hasPublished: Boolean(published),
      publishedVersion: published?.version ?? null,
      draftVersion: draft?.version ?? null,
      publishedAt: published?.publishedAt?.toISOString() || null,
      updatedAt: (draft || published)?.updatedAt.toISOString() || section.updatedAt.toISOString(),
    }
  })
}

export async function getCmsSectionForEdit(slug) {
  const section = await loadSectionBySlug(slug)
  const published = getLatestContent(section.contents, 'PUBLISHED')
  const draft = getLatestContent(section.contents, 'DRAFT')

  return {
    id: section.id,
    slug: section.slug,
    name: section.name,
    published: published ? mapContent(published) : null,
    draft: draft ? mapContent(draft) : null,
    payload: draft?.payload ?? published?.payload ?? {},
  }
}

export async function saveCmsDraft(slug, payload, actorId, auditContext = {}) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw new Error('VALIDATION')
  }

  const section = await loadSectionBySlug(slug)
  const draft = getLatestContent(section.contents, 'DRAFT')

  if (draft) {
    await prisma.cmsContent.update({
      where: { id: draft.id },
      data: { payload },
    })
  } else {
    const maxVersion = section.contents.reduce((max, entry) => Math.max(max, entry.version), 0)
    await prisma.cmsContent.create({
      data: {
        sectionId: section.id,
        version: maxVersion + 1,
        status: 'DRAFT',
        payload,
      },
    })
  }

  await createAuditLog({
    actorId,
    action: 'cms.draft_save',
    entityType: 'CmsSection',
    entityId: section.id,
    metadata: { slug, sectionName: section.name },
    ipAddress: auditContext.ipAddress,
  })

  return getCmsSectionForEdit(slug)
}

export async function publishCmsSection(slug, actorId, auditContext = {}) {
  const section = await loadSectionBySlug(slug)
  const draft = getLatestContent(section.contents, 'DRAFT')

  if (!draft) throw new Error('NO_DRAFT')

  const published = getLatestContent(section.contents, 'PUBLISHED')
  if (published) {
    await prisma.cmsContent.update({
      where: { id: published.id },
      data: { status: 'ARCHIVED' },
    })
  }

  await prisma.cmsContent.update({
    where: { id: draft.id },
    data: {
      status: 'PUBLISHED',
      publishedAt: new Date(),
      publishedById: actorId,
    },
  })

  await createAuditLog({
    actorId,
    action: 'cms.publish',
    entityType: 'CmsSection',
    entityId: section.id,
    metadata: { slug, sectionName: section.name, version: draft.version },
    ipAddress: auditContext.ipAddress,
  })

  return getCmsSectionForEdit(slug)
}

export async function getPublishedCmsContent(slug) {
  const section = await prisma.cmsSection.findFirst({
    where: { slug, ...notDeleted() },
    include: {
      contents: {
        where: { status: 'PUBLISHED', ...notDeleted() },
        orderBy: { version: 'desc' },
        take: 1,
      },
    },
  })

  if (!section?.contents[0]) return null

  const content = section.contents[0]
  return {
    slug: section.slug,
    name: section.name,
    version: content.version,
    payload: content.payload,
    publishedAt: content.publishedAt?.toISOString() || null,
  }
}

export async function getAllPublishedCmsContent() {
  const sections = await prisma.cmsSection.findMany({
    where: notDeleted(),
    include: {
      contents: {
        where: { status: 'PUBLISHED', ...notDeleted() },
        orderBy: { version: 'desc' },
        take: 1,
      },
    },
    orderBy: { slug: 'asc' },
  })

  const result = {}
  for (const section of sections) {
    if (section.contents[0]) {
      result[section.slug] = section.contents[0].payload
    }
  }

  return {
    sections: result,
    updatedAt: new Date().toISOString(),
  }
}

export async function seedPublishedCmsDefaults() {
  const { CMS_DEFAULT_PAYLOADS } = await import('../constants/cmsDefaults.js')
  let created = 0

  for (const [slug, payload] of Object.entries(CMS_DEFAULT_PAYLOADS)) {
    const section = await prisma.cmsSection.findFirst({
      where: { slug, ...notDeleted() },
      include: {
        contents: {
          where: { status: 'PUBLISHED', ...notDeleted() },
          take: 1,
        },
      },
    })

    if (!section) continue
    if (section.contents.length > 0) continue

    await prisma.cmsContent.create({
      data: {
        sectionId: section.id,
        version: 1,
        status: 'PUBLISHED',
        payload,
        publishedAt: new Date(),
      },
    })
    created += 1
  }

  return created
}
