import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const apiDir = path.join(root, 'packages/api')
const outFile = path.join(apiDir, 'prisma/migrations/20260722160000_init/migration.sql')

fs.mkdirSync(path.dirname(outFile), { recursive: true })

const sql = execSync(
  'pnpm exec dotenv -e ../../.env -- prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script',
  { cwd: apiDir, encoding: 'utf8' },
)

fs.writeFileSync(outFile, sql, 'utf8')
console.log(`Migration written to ${outFile}`)
