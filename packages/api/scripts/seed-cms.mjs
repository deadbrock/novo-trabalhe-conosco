import { seedPublishedCmsDefaults } from '../src/services/cms.service.js'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const created = await seedPublishedCmsDefaults()
console.log(`✓ ${created} seção(ões) CMS publicada(s)`)

await prisma.$disconnect()
