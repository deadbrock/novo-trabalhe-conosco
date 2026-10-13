# FG Careers Platform

Monorepo corporativo para recrutamento da FG Services.

## Estrutura

```
apps/
  website/     Portal Institucional + Portal do Candidato (porta 5173)
  admin/       FG Recruit — Painel RH (porta 5174)
packages/
  api/         Backend Express + Prisma + PostgreSQL
  contracts/   Enums e constantes compartilhados (sem UI)
docker/        Docker Compose (PostgreSQL)
```

## Pré-requisitos

- Node.js 20+
- pnpm 9+
- Docker (para PostgreSQL)

## Setup

```bash
# Instalar dependências
pnpm install

# Subir PostgreSQL
docker compose -f docker/docker-compose.yml up -d

# Configurar ambiente
cp .env.example .env

# Setup completo (schema + admin + vagas exemplo)
pnpm setup:db
```

## Desenvolvimento

```bash
# Website + Admin + API
pnpm dev

# Individual
pnpm dev:website   # http://localhost:5173
pnpm dev:admin     # http://localhost:5174
pnpm dev:api       # http://localhost:3001
```

## FG Recruit — Login

Após `pnpm setup:db`:

| Campo | Valor |
|-------|-------|
| URL | http://localhost:5174/login |
| E-mail | `admin@fgservices.com.br` |
| Senha | `Admin@FG2026` (ou `ADMIN_PASSWORD` no `.env`) |

Se o login falhar, verifique `DATABASE_URL` no `.env` e se PostgreSQL está rodando.

## Scripts

| Comando | Descrição |
|---------|-----------|
| `pnpm dev` | Website + Admin + API |
| `pnpm build` | Build de todos os apps |
| `pnpm db:migrate:dev` | Criar/aplicar migrations |
| `pnpm db:seed` | Seed (RBAC, admin, catálogos) |
| `pnpm db:studio` | Prisma Studio |

## Arquitetura

- **Isolamento total de UI** entre `website` e `admin`
- **Backend compartilhado** via `packages/api`
- **RBAC** desde a Fase 0
- **Soft delete** em todas as entidades
- **Auditoria** de ações críticas
- **Storage abstraction** (LOCAL → Supabase/Railway)
"# novo-trabalhe-conosco" 
