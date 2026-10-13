import bcrypt from 'bcryptjs'
import { PrismaClient } from '@prisma/client'
import { StaffRole, PermissionAction } from '@fg/contracts'

const prisma = new PrismaClient()

const MODULES = [
  'dashboard',
  'recruitment',
  'pipeline',
  'talent_pool',
  'candidates',
  'interviews',
  'communication',
  'pre_admission',
  'hr_department',
  'analytics',
  'cms',
  'settings',
]

const ALL_ACTIONS = ['read', 'write', 'delete', 'publish']

function perms(modules, actions = ALL_ACTIONS) {
  return modules.flatMap((module) => actions.map((action) => `${module}:${action}`))
}

const RECRUITMENT_CORE = [
  'dashboard',
  'recruitment',
  'pipeline',
  'talent_pool',
  'candidates',
  'interviews',
  'communication',
  'pre_admission',
]

const ROLES = [
  {
    slug: StaffRole.ADMIN,
    name: 'Administrador',
    description: 'Acesso total e controle completo do sistema',
    isSystem: true,
    permissions: perms(MODULES),
  },
  {
    slug: StaffRole.RECRUITMENT_MANAGER,
    name: 'Gestor de Recrutamento',
    description: 'Acesso total exceto gestão de usuários e integrações',
    isSystem: true,
    permissions: perms([...RECRUITMENT_CORE, 'analytics', 'cms']),
  },
  {
    slug: StaffRole.RECRUITMENT_ANALYST,
    name: 'Analista de Recrutamento',
    description: 'Recrutamento operacional — sem DP, Analytics, Portal e Configurações',
    isSystem: true,
    permissions: perms(RECRUITMENT_CORE),
  },
  {
    slug: StaffRole.HR_DEPARTMENT,
    name: 'Departamento Pessoal',
    description: 'Pré-admissão, admissões e documentação',
    isSystem: true,
    permissions: [
      'dashboard:read',
      'pre_admission:read', 'pre_admission:write',
      'hr_department:read', 'hr_department:write',
      'candidates:read',
    ],
  },
]

const CMS_SECTIONS = [
  { slug: 'hero', name: 'Hero' },
  { slug: 'history', name: 'Nossa História' },
  { slug: 'mission', name: 'Missão' },
  { slug: 'values', name: 'Valores' },
  { slug: 'benefits', name: 'Benefícios' },
  { slug: 'timeline', name: 'Timeline' },
  { slug: 'metrics', name: 'Métricas' },
  { slug: 'testimonials', name: 'Depoimentos' },
  { slug: 'areas', name: 'Áreas de Atuação' },
  { slug: 'process', name: 'Processo Seletivo' },
  { slug: 'clients', name: 'Clientes' },
  { slug: 'faq', name: 'FAQ' },
  { slug: 'seo', name: 'SEO' },
  { slug: 'footer', name: 'Rodapé' },
]

const BRAZILIAN_STATES = [
  { code: 'PE', name: 'Pernambuco' },
  { code: 'SP', name: 'São Paulo' },
  { code: 'RJ', name: 'Rio de Janeiro' },
  { code: 'BA', name: 'Bahia' },
  { code: 'CE', name: 'Ceará' },
]

async function migrateLegacyRoles() {
  const legacyRh = await prisma.role.findFirst({ where: { slug: 'rh', deletedAt: null } })
  if (!legacyRh) return

  const manager = await prisma.role.findFirst({
    where: { slug: StaffRole.RECRUITMENT_MANAGER, deletedAt: null },
  })

  if (manager && manager.id !== legacyRh.id) {
    await prisma.staffProfile.updateMany({
      where: { roleId: legacyRh.id },
      data: { roleId: manager.id },
    })
    await prisma.rolePermission.deleteMany({ where: { roleId: legacyRh.id } })
    await prisma.role.update({
      where: { id: legacyRh.id },
      data: { deletedAt: new Date() },
    })
    console.log('✓ Papel legado "rh" migrado para Gestor de Recrutamento')
  } else if (!manager) {
    await prisma.role.update({
      where: { id: legacyRh.id },
      data: {
        slug: StaffRole.RECRUITMENT_MANAGER,
        name: 'Gestor de Recrutamento',
        description: 'Acesso total exceto gestão de usuários e integrações',
      },
    })
    console.log('✓ Papel "rh" renomeado para Gestor de Recrutamento')
  }
}

async function seedPermissions() {
  const permissions = []

  for (const module of MODULES) {
    for (const action of Object.values(PermissionAction)) {
      permissions.push({
        module,
        action,
        label: `${module}:${action}`,
      })
    }
  }

  for (const perm of permissions) {
    await prisma.permission.upsert({
      where: { module_action: { module: perm.module, action: perm.action } },
      update: {},
      create: perm,
    })
  }

  return prisma.permission.findMany()
}

async function seedRoles(allPermissions) {
  const permissionMap = Object.fromEntries(
    allPermissions.map((p) => [`${p.module}:${p.action}`, p.id]),
  )

  for (const roleDef of ROLES) {
    const role = await prisma.role.upsert({
      where: { slug: roleDef.slug },
      update: { name: roleDef.name, description: roleDef.description },
      create: {
        slug: roleDef.slug,
        name: roleDef.name,
        description: roleDef.description,
        isSystem: roleDef.isSystem,
      },
    })

    await prisma.rolePermission.deleteMany({ where: { roleId: role.id } })

    for (const permKey of roleDef.permissions) {
      const permissionId = permissionMap[permKey]
      if (permissionId) {
        await prisma.rolePermission.create({
          data: { roleId: role.id, permissionId },
        })
      }
    }
  }

  return prisma.role.findUnique({ where: { slug: StaffRole.ADMIN } })
}

async function seedAdminUser(adminRole) {
  const email = (process.env.ADMIN_EMAIL || 'admin@fgservices.com.br').toLowerCase()
  const password = process.env.ADMIN_PASSWORD || 'Admin@FG2026'
  const passwordHash = await bcrypt.hash(password, 10)

  const existing = await prisma.user.findFirst({
    where: { email, deletedAt: null },
    include: { staffProfile: true },
  })

  if (existing?.staffProfile) {
    await prisma.user.update({
      where: { id: existing.id },
      data: {
        passwordHash,
        status: 'ACTIVE',
        emailVerified: true,
        staffProfile: {
          update: { roleId: adminRole.id, name: 'Administrador FG', jobTitle: 'Administrador do Sistema' },
        },
      },
    })
    console.log(`✓ Admin atualizado: ${email}`)
    console.log(`  Senha: ${process.env.ADMIN_PASSWORD ? '(definida no .env)' : 'Admin@FG2026'}`)
    return
  }

  await prisma.user.create({
    data: {
      email,
      passwordHash,
      type: 'STAFF',
      status: 'ACTIVE',
      emailVerified: true,
      staffProfile: {
        create: {
          roleId: adminRole.id,
          name: 'Administrador FG',
          phone: '',
          jobTitle: 'Administrador do Sistema',
        },
      },
    },
  })

  console.log(`✓ Admin criado: ${email}`)
  console.log(`  Senha: ${process.env.ADMIN_PASSWORD ? '(definida no .env)' : 'Admin@FG2026'}`)
}

async function seedOperationalUnits() {
  await prisma.operationalUnit.upsert({
    where: { slug: 'sede-pe' },
    update: { name: 'Sede administrativa — Pernambuco', type: 'HEADQUARTERS', stateCodes: ['PE'], isHeadquarters: true },
    create: {
      id: 'unit-sede-pe',
      name: 'Sede administrativa — Pernambuco',
      slug: 'sede-pe',
      type: 'HEADQUARTERS',
      stateCodes: ['PE'],
      isHeadquarters: true,
    },
  })
  await prisma.operationalUnit.upsert({
    where: { slug: 'admin-outros-estados' },
    update: { name: 'Administrativo — outros estados', type: 'REGIONAL', stateCodes: ['BA', 'CE', 'SP', 'RJ'], isHeadquarters: false },
    create: {
      id: 'unit-admin-outros',
      name: 'Administrativo — outros estados',
      slug: 'admin-outros-estados',
      type: 'REGIONAL',
      stateCodes: ['BA', 'CE', 'SP', 'RJ'],
      isHeadquarters: false,
    },
  })
  console.log('✓ Unidades operacionais')
}

async function seedRecruitmentCatalogs() {
  const client = await prisma.client.upsert({
    where: { id: '00000000-0000-4000-8000-000000000001' },
    update: { name: 'FG Services — Interno' },
    create: {
      id: '00000000-0000-4000-8000-000000000001',
      name: 'FG Services — Interno',
      cnpj: '00.000.000/0001-00',
      active: true,
    },
  })

  await prisma.contract.upsert({
    where: { id: '00000000-0000-4000-8000-000000000002' },
    update: { name: 'Corporativo Nacional' },
    create: {
      id: '00000000-0000-4000-8000-000000000002',
      clientId: client.id,
      name: 'Corporativo Nacional',
      code: 'CORP-001',
      active: true,
    },
  })

  const departments = [
    { slug: 'operacoes', name: 'Operações' },
    { slug: 'comercial', name: 'Comercial' },
    { slug: 'gente-gestao', name: 'Gente & Gestão' },
    { slug: 'tecnologia', name: 'Tecnologia' },
    { slug: 'facilities', name: 'Facilities' },
  ]

  for (const dept of departments) {
    await prisma.department.upsert({
      where: { slug: dept.slug },
      update: { name: dept.name },
      create: dept,
    })
  }

  const peState = await prisma.state.findUnique({ where: { code: 'PE' } })
  if (peState) {
    await prisma.city.upsert({
      where: { stateId_name: { stateId: peState.id, name: 'Igarassu' } },
      update: {},
      create: { stateId: peState.id, name: 'Igarassu' },
    })
    await prisma.city.upsert({
      where: { stateId_name: { stateId: peState.id, name: 'Recife' } },
      update: {},
      create: { stateId: peState.id, name: 'Recife' },
    })
  }
}

async function seedSampleJobs() {
  const count = await prisma.job.count({ where: { deletedAt: null } })
  if (count > 0) return

  const contract = await prisma.contract.findFirst({ where: { deletedAt: null } })
  const dept = await prisma.department.findFirst({ where: { slug: 'gente-gestao' } })

  const samples = [
    {
      title: 'Analista de RH — Atração',
      slug: 'analista-de-rh-atracao',
      area: 'Gente & Gestão',
      locationLabel: 'Recife, PE',
      stateCode: 'PE',
      workModality: 'Híbrido',
      employmentType: 'CLT',
      level: 'Pleno',
      featured: true,
      description: 'Gerenciar processos seletivos end-to-end e fortalecer employer branding.',
      requirements: 'Experiência em recrutamento; Conhecimento em ATS; Comunicação excelente.',
      status: 'PUBLISHED',
      publishedAt: new Date(),
    },
    {
      title: 'Executivo Comercial',
      slug: 'executivo-comercial',
      area: 'Comercial',
      locationLabel: 'São Paulo, SP',
      stateCode: 'SP',
      workModality: 'Presencial',
      employmentType: 'CLT',
      level: 'Sênior',
      featured: true,
      description: 'Conduzir prospecção, negociação e relacionamento com contas estratégicas.',
      requirements: 'Experiência em vendas B2B; Histórico de metas; Disponibilidade para viagens.',
      status: 'PUBLISHED',
      publishedAt: new Date(),
    },
  ]

  for (const sample of samples) {
    await prisma.job.create({
      data: {
        ...sample,
        contractId: contract?.id,
        departmentId: dept?.id,
        urgency: 'MEDIUM',
        quantity: 1,
      },
    })
  }

  console.log(`✓ ${samples.length} vagas de exemplo criadas`)
}

async function seedCatalogs() {
  for (const state of BRAZILIAN_STATES) {
    await prisma.state.upsert({
      where: { code: state.code },
      update: { name: state.name },
      create: state,
    })
  }

  for (const section of CMS_SECTIONS) {
    await prisma.cmsSection.upsert({
      where: { slug: section.slug },
      update: { name: section.name },
      create: section,
    })
  }
}

async function seedCmsContent() {
  const { seedPublishedCmsDefaults } = await import('../src/services/cms.service.js')
  const created = await seedPublishedCmsDefaults()
  if (created > 0) {
    console.log(`✓ ${created} seção(ões) CMS publicada(s) com conteúdo padrão`)
  }
}

async function migrateJsonCandidates() {
  const fs = await import('node:fs')
  const path = await import('node:path')
  const { fileURLToPath } = await import('node:url')

  const __dirname = path.dirname(fileURLToPath(import.meta.url))
  const legacyUsersPath = path.resolve(__dirname, '../../../server/data/users.json')

  if (!fs.existsSync(legacyUsersPath)) return

  const legacyUsers = JSON.parse(fs.readFileSync(legacyUsersPath, 'utf-8'))

  for (const legacy of legacyUsers) {
    const email = legacy.email.toLowerCase()
    const exists = await prisma.user.findFirst({ where: { email, deletedAt: null } })
    if (exists) continue

    await prisma.user.create({
      data: {
        id: legacy.id,
        email,
        passwordHash: legacy.passwordHash,
        type: 'CANDIDATE',
        status: legacy.emailVerified ? 'ACTIVE' : 'PENDING',
        emailVerified: legacy.emailVerified,
        verificationToken: legacy.verificationToken,
        verificationTokenExpires: legacy.verificationTokenExpires
          ? new Date(legacy.verificationTokenExpires)
          : null,
        createdAt: new Date(legacy.createdAt),
        updatedAt: new Date(legacy.updatedAt),
        candidateProfile: {
          create: {
            name: legacy.name,
            phone: legacy.phone || '',
            linkedin: legacy.profile?.linkedin || '',
            city: legacy.profile?.city || '',
            state: legacy.profile?.state || '',
            summary: legacy.profile?.summary || '',
          },
        },
      },
    })

    console.log(`✓ Candidato migrado: ${email}`)
  }
}

async function seedPipelineStages() {
  const count = await prisma.pipelineStageConfig.count({ where: { deletedAt: null } })
  if (count > 0) return

  const { DEFAULT_PIPELINE_STAGES } = await import('@fg/contracts')

  for (const stage of DEFAULT_PIPELINE_STAGES) {
    await prisma.pipelineStageConfig.create({ data: stage })
  }

  console.log(`✓ ${DEFAULT_PIPELINE_STAGES.length} etapas do pipeline criadas`)
}

async function seedSampleApplications() {
  const count = await prisma.application.count({ where: { deletedAt: null } })
  if (count > 0) return

  const jobs = await prisma.job.findMany({ where: { deletedAt: null }, take: 2 })
  const candidates = await prisma.candidateProfile.findMany({
    where: { deletedAt: null },
    take: 2,
  })

  if (jobs.length === 0 || candidates.length === 0) return

  const stages = ['new', 'hr_review', 'contact', 'interview']

  for (let i = 0; i < Math.min(candidates.length, jobs.length); i++) {
    await prisma.application.create({
      data: {
        candidateId: candidates[i].id,
        jobId: jobs[i].id,
        status: i === 0 ? 'INTERVIEW' : 'REVIEW',
        source: 'website',
        currentStage: stages[Math.min(i + 2, stages.length - 1)] || 'new',
      },
    })
  }

  console.log(`✓ Candidaturas de exemplo no pipeline`)
}

async function seedSampleTalentPool() {
  const count = await prisma.talentPoolEntry.count({ where: { deletedAt: null } })
  if (count > 0) return

  const samples = [
    {
      name: 'Mariana Costa',
      email: 'mariana.costa.exemplo@fg.com',
      phone: '(81) 98888-1001',
      area: 'operacoes',
      areaLabel: 'Operações',
      desiredJob: 'Analista de RH — Atração',
      desiredJobSlug: 'analista-de-rh-atracao',
      linkedin: 'https://linkedin.com/in/marianacosta',
      message: 'Tenho experiência com ATS e processos seletivos em escala.',
      status: 'PENDING',
    },
    {
      name: 'Rafael Mendes',
      email: 'rafael.mendes.exemplo@fg.com',
      phone: '(11) 97777-2002',
      area: 'comercial',
      areaLabel: 'Comercial',
      desiredJob: 'Executivo Comercial',
      desiredJobSlug: 'executivo-comercial',
      linkedin: '',
      message: 'Disponível para início imediato.',
      status: 'REVIEWED',
    },
  ]

  for (const sample of samples) {
    await prisma.talentPoolEntry.create({ data: sample })
  }

  console.log(`✓ ${samples.length} cadastros de exemplo no banco de talentos`)
}

async function seedMessageTemplates() {
  const count = await prisma.messageTemplate.count({ where: { deletedAt: null } })
  if (count > 0) return

  const templates = [
    {
      name: 'Convite para entrevista',
      channel: 'EMAIL',
      subject: 'Convite de entrevista — {{vaga}} | {{empresa}}',
      body: `Olá, {{nome}}!

Ficamos felizes em convidá-lo(a) para uma entrevista referente à vaga de {{vaga}}.

Data e horário: {{data_entrevista}}
${''}
Link da reunião: {{link}}

Qualquer dúvida, responda este e-mail.

Equipe de Recrutamento — {{empresa}}`,
    },
    {
      name: 'Lembrete de entrevista',
      channel: 'EMAIL',
      subject: 'Lembrete: entrevista amanhã — {{vaga}}',
      body: `Olá, {{nome}}!

Este é um lembrete da sua entrevista para a vaga {{vaga}} em {{data_entrevista}}.

Link: {{link}}

Até lá!
Equipe {{empresa}}`,
    },
    {
      name: 'Contato WhatsApp',
      channel: 'WHATSAPP',
      subject: '',
      body: `Olá, {{nome}}! Aqui é a equipe de RH da {{empresa}}.

Gostaríamos de falar sobre sua candidatura para a vaga {{vaga}}. Podemos conversar?`,
    },
  ]

  for (const template of templates) {
    await prisma.messageTemplate.create({ data: template })
  }

  console.log(`✓ ${templates.length} modelos de comunicação criados`)
}

async function seedSampleInterview() {
  const count = await prisma.interview.count({ where: { deletedAt: null } })
  if (count > 0) return

  const application = await prisma.application.findFirst({
    where: { deletedAt: null, currentStage: 'interview' },
  })
  if (!application) return

  const scheduledAt = new Date()
  scheduledAt.setDate(scheduledAt.getDate() + 1)
  scheduledAt.setHours(10, 0, 0, 0)

  await prisma.interview.create({
    data: {
      applicationId: application.id,
      scheduledAt,
      durationMinutes: 45,
      type: 'VIDEO',
      meetingLink: 'https://meet.example.com/fg-interview',
      status: 'SCHEDULED',
      notes: 'Entrevista técnica com RH.',
    },
  })

  console.log('✓ Entrevista de exemplo agendada')
}

async function seedChecklistTemplate() {
  const templateId = '00000000-0000-4000-8000-000000000010'

  await prisma.documentChecklistTemplate.upsert({
    where: { id: templateId },
    update: {
      name: 'Admissão CLT — Padrão',
      description: 'Documentos obrigatórios para contratação CLT',
      isDefault: true,
      isActive: true,
    },
    create: {
      id: templateId,
      name: 'Admissão CLT — Padrão',
      description: 'Documentos obrigatórios para contratação CLT',
      isDefault: true,
      isActive: true,
    },
  })

  const { DEFAULT_DOCUMENT_CHECKLIST_ITEMS } = await import('../src/constants/documentChecklist.js')

  const items = DEFAULT_DOCUMENT_CHECKLIST_ITEMS.map((item) => ({
    label: item.label,
    description: item.description,
    sortOrder: item.sortOrder,
    required: item.required !== false,
  }))

  await prisma.preAdmissionChecklistItemTemplate.deleteMany({
    where: { templateId },
  })

  for (const item of items) {
    await prisma.preAdmissionChecklistItemTemplate.create({
      data: { templateId, ...item },
    })
  }

  console.log('✓ Checklist de pré-admissão padrão criado')
}

async function seedMissingApplicationDocumentations() {
  const { syncMissingApplicationDocumentations } = await import('../src/services/applicationDocumentation.service.js')
  const created = await syncMissingApplicationDocumentations()
  if (created > 0) {
    console.log(`✓ ${created} checklist(s) de documentação sincronizado(s)`)
  }
}

async function seedMissingPreAdmissionCases() {
  const { syncMissingPreAdmissionCases, syncPreAdmissionDocumentationLinks } = await import('../src/services/preAdmission.service.js')
  const created = await syncMissingPreAdmissionCases()
  const linked = await syncPreAdmissionDocumentationLinks()
  if (created > 0) {
    console.log(`✓ ${created} caso(s) de pré-admissão sincronizado(s) para candidatos já aprovados`)
  }
  if (linked > 0) {
    console.log(`✓ ${linked} caso(s) de pré-admissão vinculado(s) à documentação da candidatura`)
  }
}

async function main() {
  console.log('🌱 Iniciando seed...')

  const permissions = await seedPermissions()
  await migrateLegacyRoles()
  const adminRole = await seedRoles(permissions)
  await seedCatalogs()
  await seedOperationalUnits()
  await seedCmsContent()
  await seedRecruitmentCatalogs()
  await seedPipelineStages()
  await seedChecklistTemplate()
  await seedMissingApplicationDocumentations()
  await seedMissingPreAdmissionCases()
  await seedAdminUser(adminRole)
  await seedSampleJobs()
  await seedSampleApplications()
  await seedSampleTalentPool()
  await seedMessageTemplates()
  await seedSampleInterview()
  await migrateJsonCandidates()

  console.log('✅ Seed concluído.')
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
