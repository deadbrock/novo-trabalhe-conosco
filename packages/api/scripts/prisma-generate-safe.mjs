import { execSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { PrismaClient } from '@prisma/client'

const apiDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

async function clientLooksUpToDate() {
  const client = new PrismaClient()
  try {
    return (
      typeof client.preAdmissionCase?.findMany === 'function' &&
      typeof client.documentChecklistTemplate?.findMany === 'function' &&
      typeof client.operationalUnit?.findMany === 'function' &&
      typeof client.applicationSlaClock?.findMany === 'function'
    )
  } catch {
    return false
  } finally {
    await client.$disconnect().catch(() => {})
  }
}

try {
  execSync('pnpm exec prisma generate', { cwd: apiDir, stdio: 'inherit' })
} catch (error) {
  const stderr = String(error.stderr || '')
  const stdout = String(error.stdout || '')
  const message = `${error.message || error} ${stderr} ${stdout}`
  const isLockError = /EPERM|operation not permitted/i.test(message)

  if (isLockError) {
    const upToDate = await clientLooksUpToDate()
    if (upToDate) {
      console.warn('\n⚠️  Prisma generate ignorado: engine em uso por outro processo Node.')
      console.warn('   O client atual parece válido — continuando.\n')
      process.exit(0)
    }

    console.error('\n❌ Prisma generate falhou (arquivo bloqueado) e o client está desatualizado.')
    console.error('   Pare a API em execução e rode: pnpm db:generate\n')
    process.exit(1)
  }

  process.exit(error.status ?? 1)
}
