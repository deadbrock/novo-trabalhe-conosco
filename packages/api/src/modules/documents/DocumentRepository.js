import { prisma, notDeleted } from '../../lib/prisma.js'

const documentInclude = {
  candidate: {
    include: {
      user: { select: { id: true, email: true } },
    },
  },
  application: {
    include: {
      job: { select: { id: true, title: true } },
      documentation: {
        include: {
          items: { where: notDeleted() },
        },
      },
    },
  },
  events: {
    orderBy: { createdAt: 'asc' },
  },
}

export class DocumentRepository {
  findById(id) {
    return prisma.candidateDocument.findFirst({
      where: { id, ...notDeleted() },
      include: documentInclude,
    })
  }

  findByEnvelopeId(envelopeId) {
    return prisma.candidateDocument.findFirst({
      where: { providerEnvelopeId: envelopeId, ...notDeleted() },
      include: documentInclude,
    })
  }

  findByCandidateAndType(candidateId, documentType) {
    return prisma.candidateDocument.findFirst({
      where: { candidateId, documentType, ...notDeleted() },
      orderBy: { createdAt: 'desc' },
      include: documentInclude,
    })
  }

  findByCandidateUserId(userId, documentId) {
    return prisma.candidateDocument.findFirst({
      where: {
        id: documentId,
        ...notDeleted(),
        candidate: { userId, ...notDeleted() },
      },
      include: documentInclude,
    })
  }

  listByCandidateId(candidateId) {
    return prisma.candidateDocument.findMany({
      where: { candidateId, ...notDeleted() },
      include: documentInclude,
      orderBy: { createdAt: 'desc' },
    })
  }

  create(data) {
    return prisma.candidateDocument.create({
      data,
      include: documentInclude,
    })
  }

  update(id, data) {
    return prisma.candidateDocument.update({
      where: { id },
      data,
      include: documentInclude,
    })
  }

  addEvent(documentId, event, payload = {}) {
    return prisma.documentEvent.create({
      data: {
        documentId,
        event,
        payload,
      },
    })
  }

  listEvents(documentId) {
    return prisma.documentEvent.findMany({
      where: { documentId },
      orderBy: { createdAt: 'asc' },
    })
  }
}

export const documentRepository = new DocumentRepository()
