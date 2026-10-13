import { execSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const apiDir = path.join(root, 'packages/api')

function stopApiOnWindows() {
  if (process.platform !== 'win32') return

  try {
    const output = execSync(
      'powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort 3001 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique"',
      { encoding: 'utf8' },
    ).trim()

    if (!output) return

    const pids = [...new Set(output.split(/\s+/).filter(Boolean))]
    for (const pid of pids) {
      try {
        execSync(`taskkill /PID ${pid} /F`, { stdio: 'ignore' })
        console.log(`→ API encerrada (PID ${pid}) para liberar o Prisma Client.`)
      } catch {
        /* processo já encerrado */
      }
    }
  } catch {
    /* porta livre ou comando indisponível */
  }
}

console.log('→ Regenerando Prisma Client...')
stopApiOnWindows()

try {
  execSync('pnpm exec prisma generate', { cwd: apiDir, stdio: 'inherit' })
  console.log('\n✅ Prisma Client regenerado.')
} catch (error) {
  console.error('\n❌ Falha ao regenerar Prisma Client.')
  console.error('   Se a API ainda estiver rodando, pare com Ctrl+C e tente novamente.')
  process.exit(error.status ?? 1)
}
