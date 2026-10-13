/**
 * Servidor legado — descontinuado.
 * Use: pnpm dev:api  (packages/api)
 */
console.error(`
❌ Este servidor (server/index.js) foi descontinuado.

O FG Recruit e as vagas usam a API em packages/api.

Para subir tudo:
  pnpm dev        # website + admin + api
  pnpm dev:api    # só a API (porta 3001)
`)
process.exit(1)
