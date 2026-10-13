import { execSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const apiDir = path.join(root, 'packages/api')

console.log('🔧 FG Careers — Setup do banco de dados\n')
console.log('Certifique-se de que DATABASE_URL no .env está correto.')
console.log('Exemplo Docker: postgresql://fgcareers:fgcareers@localhost:5432/fgcareers\n')

try {
  console.log('→ Sincronizando schema (db push)...')
  execSync('pnpm exec dotenv -e ../../.env -- prisma db push', {
    cwd: apiDir,
    stdio: 'inherit',
  })

  console.log('\n→ Regenerando Prisma Client...')
  try {
    execSync('pnpm exec prisma generate', {
      cwd: apiDir,
      stdio: 'inherit',
    })
  } catch (generateError) {
    console.warn('\n⚠️  Falha ao regenerar Prisma Client (API em execução?).')
    console.warn('   Pare o servidor (`pnpm dev`) e rode: pnpm db:generate')
  }

  console.log('\n→ Executando seed (admin + catálogos + vagas exemplo)...')
  execSync('pnpm exec dotenv -e ../../.env -- node prisma/seed.js', {
    cwd: apiDir,
    stdio: 'inherit',
  })

  console.log('\n✅ Setup concluído!')
  console.log('\nFG Recruit — Login:')
  console.log('  URL:   http://localhost:5174/login')
  console.log('  Email: admin@fgservices.com.br')
  console.log('  Senha: Admin@FG2026 (ou ADMIN_PASSWORD no .env)')
} catch (error) {
  console.error('\n❌ Falha no setup. Verifique se PostgreSQL está rodando e DATABASE_URL está correto.')
  process.exit(1)
}
