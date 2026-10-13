import { prisma, notDeleted } from '../lib/prisma.js'

export async function listClients() {
  return prisma.client.findMany({
    where: { active: true, ...notDeleted() },
    orderBy: { name: 'asc' },
    select: { id: true, name: true, cnpj: true },
  })
}

export async function listContracts(clientId) {
  return prisma.contract.findMany({
    where: {
      active: true,
      ...notDeleted(),
      ...(clientId ? { clientId } : {}),
    },
    orderBy: { name: 'asc' },
    select: { id: true, name: true, code: true, clientId: true },
  })
}

export async function listDepartments() {
  return prisma.department.findMany({
    where: notDeleted(),
    orderBy: { name: 'asc' },
    select: { id: true, name: true, slug: true },
  })
}

export async function listStates() {
  return prisma.state.findMany({
    where: notDeleted(),
    orderBy: { name: 'asc' },
    select: { id: true, code: true, name: true },
  })
}

export async function listCities(stateId) {
  return prisma.city.findMany({
    where: {
      ...notDeleted(),
      ...(stateId ? { stateId } : {}),
    },
    orderBy: { name: 'asc' },
    select: { id: true, name: true, stateId: true },
  })
}
