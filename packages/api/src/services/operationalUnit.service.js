import { prisma, notDeleted } from '../lib/prisma.js'

export function mapOperationalUnit(unit) {
  if (!unit) return null
  return {
    id: unit.id,
    name: unit.name,
    slug: unit.slug,
    type: unit.type,
    stateCodes: unit.stateCodes || [],
    isHeadquarters: unit.isHeadquarters,
  }
}

export async function listOperationalUnits() {
  const units = await prisma.operationalUnit.findMany({
    where: notDeleted(),
    orderBy: [{ isHeadquarters: 'desc' }, { name: 'asc' }],
  })
  return units.map(mapOperationalUnit)
}

export async function resolveUnitIdForJob({ unitId, stateCode, actor }) {
  if (unitId) return unitId
  if (actor?.unit?.id) return actor.unit.id

  const code = String(stateCode || '').toUpperCase()
  if (code) {
    const byState = await prisma.operationalUnit.findFirst({
      where: { ...notDeleted(), stateCodes: { has: code } },
      orderBy: { isHeadquarters: 'desc' },
    })
    if (byState) return byState.id
  }

  const headquarters = await prisma.operationalUnit.findFirst({
    where: { ...notDeleted(), isHeadquarters: true },
  })
  return headquarters?.id || null
}
