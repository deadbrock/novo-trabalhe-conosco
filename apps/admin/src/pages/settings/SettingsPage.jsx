import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Users, Plug, ScrollText, User, ExternalLink, Plus, Shield } from 'lucide-react'
import { settingsService } from '@/services/settingsService'
import { catalogsService } from '@/services/jobsService'
import { CreateUserModal } from './CreateUserModal'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { ApiError } from '@/services/api'
import { cn } from '@/utils/cn'

const TABS = [
  { id: 'users', label: 'Usuários', icon: Users },
  { id: 'profiles', label: 'Perfis de acesso', icon: Shield },
  { id: 'integrations', label: 'Integrações', icon: Plug },
  { id: 'audit', label: 'Auditoria', icon: ScrollText },
]

const PROFILE_GUIDE = [
  {
    name: 'Administrador',
    summary: 'Acesso total e controle completo do sistema.',
    access: ['Todos os módulos', 'Usuários e integrações', 'Conteúdo do portal', 'Analytics', 'Auditoria'],
  },
  {
    name: 'Gestor de Recrutamento',
    summary: 'Acesso total à operação de recrutamento, sem gestão de usuários e integrações.',
    access: ['Dashboard, vagas, pipeline, candidatos', 'Entrevistas, comunicação, pré-admissão', 'Analytics e conteúdo do portal', 'Sem Configurações'],
  },
  {
    name: 'Analista de Recrutamento',
    summary: 'Operação diária de recrutamento, sem módulos estratégicos ou administrativos.',
    access: ['Dashboard, vagas, pipeline, banco de talentos', 'Candidatos, entrevistas, comunicação, pré-admissão', 'Sem DP, Analytics, Portal e Configurações'],
  },
  {
    name: 'Departamento Pessoal',
    summary: 'Foco em pré-admissão, admissões e documentação.',
    access: ['Pré-admissão e DP', 'Consulta de candidatos', 'Sem recrutamento operacional'],
  },
]

const inputClass =
  'w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#003d7a]/20 bg-white'

function statusBadge(status) {
  const map = {
    ACTIVE: { label: 'Ativo', variant: 'green' },
    INACTIVE: { label: 'Inativo', variant: 'default' },
    PENDING: { label: 'Pendente', variant: 'amber' },
  }
  const item = map[status] || map.INACTIVE
  return <Badge variant={item.variant}>{item.label}</Badge>
}

function UsersTab() {
  const queryClient = useQueryClient()
  const [editingId, setEditingId] = useState(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [form, setForm] = useState({})
  const [feedback, setFeedback] = useState('')
  const [feedbackError, setFeedbackError] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['settings-users'],
    queryFn: () => settingsService.listUsers(),
  })

  const { data: rolesData } = useQuery({
    queryKey: ['settings-roles-assignable'],
    queryFn: () => settingsService.listAssignableRoles(),
  })

  const { data: unitsData } = useQuery({
    queryKey: ['catalogs-units'],
    queryFn: () => catalogsService.units(),
  })

  const users = data?.users || []
  const roles = rolesData?.roles || []
  const units = unitsData?.items || []

  const updateMutation = useMutation({
    mutationFn: ({ id, body }) => settingsService.updateUser(id, body),
    onSuccess: () => {
      setFeedback('Usuário atualizado.')
      setFeedbackError(false)
      setEditingId(null)
      queryClient.invalidateQueries({ queryKey: ['settings-users'] })
    },
    onError: (err) => {
      setFeedback(err instanceof ApiError ? err.message : 'Erro ao atualizar.')
      setFeedbackError(true)
    },
  })

  const createMutation = useMutation({
    mutationFn: (body) => settingsService.createUser(body),
    onSuccess: () => {
      setFeedback('Usuário criado com sucesso.')
      setFeedbackError(false)
      setCreateOpen(false)
      queryClient.invalidateQueries({ queryKey: ['settings-users'] })
    },
    onError: (err) => {
      setFeedback(err instanceof ApiError ? err.message : 'Erro ao criar usuário.')
      setFeedbackError(true)
    },
  })

  function startEdit(user) {
    setEditingId(user.id)
    setForm({
      name: user.name,
      phone: user.phone,
      jobTitle: user.jobTitle,
      department: user.department,
      status: user.status,
      roleId: user.roleId,
      unitId: user.unitId || '',
    })
    setFeedback('')
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <p className="text-sm text-neutral-500">
          Cadastre e gerencie contas de acesso. Apenas administradores podem criar usuários.
        </p>
        <Button onClick={() => { setCreateOpen(true); setFeedback('') }}>
          <Plus size={16} />
          Novo usuário
        </Button>
      </div>

      {feedback && (
        <p className={`text-sm rounded-lg px-3 py-2 ${feedbackError ? 'text-red-700 bg-red-50' : 'text-emerald-700 bg-emerald-50'}`}>
          {feedback}
        </p>
      )}

      <div className="space-y-3">
        {users.map((user) => (
          <Card key={user.id}>
            <CardContent className="py-4">
              {editingId === user.id ? (
                <div className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-neutral-600 mb-1">Nome</label>
                      <input className={inputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-neutral-600 mb-1">E-mail</label>
                      <input className={`${inputClass} bg-neutral-50`} value={user.email} readOnly disabled />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-neutral-600 mb-1">Cargo</label>
                      <input className={inputClass} value={form.jobTitle} onChange={(e) => setForm({ ...form, jobTitle: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-neutral-600 mb-1">Departamento</label>
                      <input className={inputClass} value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-neutral-600 mb-1">Telefone</label>
                      <input className={inputClass} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-neutral-600 mb-1">Perfil de acesso</label>
                      <select className={inputClass} value={form.roleId} onChange={(e) => setForm({ ...form, roleId: e.target.value })}>
                        {roles.map((role) => (
                          <option key={role.id} value={role.id}>{role.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-neutral-600 mb-1">Status</label>
                      <select className={inputClass} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                        <option value="ACTIVE">Ativo</option>
                        <option value="INACTIVE">Inativo</option>
                        <option value="PENDING">Pendente</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-neutral-600 mb-1">Unidade operacional</label>
                      <select className={inputClass} value={form.unitId || ''} onChange={(e) => setForm({ ...form, unitId: e.target.value })}>
                        <option value="">Sede / sem recorte (vê tudo do perfil)</option>
                        {units.map((unit) => (
                          <option key={unit.id} value={unit.id}>{unit.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => updateMutation.mutate({ id: user.id, body: form })}
                      loading={updateMutation.isPending}
                    >
                      Salvar
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => setEditingId(null)}>
                      Cancelar
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-neutral-900">{user.name || user.email}</p>
                      {statusBadge(user.status)}
                      <Badge variant="default">{user.roleName}</Badge>
                    </div>
                    <p className="text-sm text-neutral-500 mt-0.5">{user.email}</p>
                    {(user.jobTitle || user.department || user.unitName) && (
                      <p className="text-xs text-neutral-400 mt-1">
                        {[user.jobTitle, user.department, user.unitName].filter(Boolean).join(' · ')}
                      </p>
                    )}
                    {user.lastLoginAt && (
                      <p className="text-xs text-neutral-400 mt-1">
                        Último acesso: {new Date(user.lastLoginAt).toLocaleString('pt-BR')}
                      </p>
                    )}
                  </div>
                  <Button size="sm" variant="secondary" onClick={() => startEdit(user)}>
                    Editar
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <CreateUserModal
        open={createOpen}
        roles={roles}
        units={units}
        saving={createMutation.isPending}
        onClose={() => setCreateOpen(false)}
        onSubmit={(body) => createMutation.mutate(body)}
      />
    </div>
  )
}

function ProfilesTab() {
  return (
    <div className="space-y-4">
      <p className="text-sm text-neutral-500">
        Cada usuário recebe um perfil que define quais módulos pode acessar no sistema.
      </p>
      <div className="grid sm:grid-cols-2 gap-4">
        {PROFILE_GUIDE.map((profile) => (
          <Card key={profile.name}>
            <CardHeader>
              <h3 className="font-semibold text-neutral-900">{profile.name}</h3>
              <p className="text-sm text-neutral-500 mt-1">{profile.summary}</p>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-neutral-600 space-y-1.5 list-disc list-inside">
                {profile.access.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

function IntegrationsTab() {
  const { data, isLoading } = useQuery({
    queryKey: ['settings-integrations'],
    queryFn: () => settingsService.getIntegrations(),
  })

  const integrations = data?.integrations

  if (isLoading) return <Skeleton className="h-48 w-full" />

  return (
    <div className="grid sm:grid-cols-2 gap-4">
      <Card>
        <CardHeader>
          <h3 className="font-semibold text-neutral-900">SendGrid (E-mail)</h3>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-neutral-500">Status</span>
            <Badge variant={integrations?.sendgrid?.configured ? 'green' : 'amber'}>
              {integrations?.sendgrid?.configured ? 'Configurado' : 'Não configurado'}
            </Badge>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-neutral-500">Remetente</span>
            <span className="text-neutral-800 text-right truncate">{integrations?.sendgrid?.fromEmail}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-neutral-500">Nome exibido</span>
            <span className="text-neutral-800 text-right truncate">{integrations?.sendgrid?.fromName}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h3 className="font-semibold text-neutral-900">Armazenamento</h3>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-neutral-500">Provedor</span>
            <Badge variant="default">{integrations?.storage?.provider}</Badge>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-neutral-500">Portal de vagas</span>
            <a href={integrations?.email?.appUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline inline-flex items-center gap-1">
              Abrir <ExternalLink size={12} />
            </a>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-neutral-500">Admin</span>
            <a href={integrations?.email?.adminUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline inline-flex items-center gap-1">
              Abrir <ExternalLink size={12} />
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function AuditTab() {
  const { data, isLoading } = useQuery({
    queryKey: ['settings-audit'],
    queryFn: () => settingsService.getAuditLog({ limit: 50 }),
  })

  const logs = data?.logs || []

  if (isLoading) return <Skeleton className="h-64 w-full" />

  return (
    <div className="space-y-3">
      <p className="text-sm text-neutral-500">
        Registro das últimas ações realizadas no sistema ({data?.total || 0} no total).
      </p>
      <div className="rounded-xl border border-neutral-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 text-left">
              <tr>
                <th className="px-4 py-3 font-medium text-neutral-600">Data</th>
                <th className="px-4 py-3 font-medium text-neutral-600">Usuário</th>
                <th className="px-4 py-3 font-medium text-neutral-600">Ação</th>
                <th className="px-4 py-3 font-medium text-neutral-600">Entidade</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-neutral-50/50">
                  <td className="px-4 py-3 text-neutral-500 whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleString('pt-BR')}
                  </td>
                  <td className="px-4 py-3">{log.actor?.name || '—'}</td>
                  <td className="px-4 py-3 text-neutral-900">{log.actionLabel || log.action}</td>
                  <td className="px-4 py-3 text-neutral-500">{log.entityLabel || log.entityType}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export function SettingsPage() {
  const [tab, setTab] = useState('users')

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Configurações</h1>
          <p className="text-sm text-neutral-500 mt-1">
            Administração do sistema, usuários, integrações e auditoria.
          </p>
        </div>
        <Link
          to="/perfil"
          className="inline-flex items-center gap-2 text-sm font-medium text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-lg transition-colors"
        >
          <User size={16} />
          Meu perfil
        </Link>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-neutral-200 pb-1">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={cn(
              'inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 -mb-px transition-colors',
              tab === id
                ? 'border-[#003d7a] text-[#003d7a]'
                : 'border-transparent text-neutral-500 hover:text-neutral-800',
            )}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </div>

      {tab === 'users' && <UsersTab />}
      {tab === 'profiles' && <ProfilesTab />}
      {tab === 'integrations' && <IntegrationsTab />}
      {tab === 'audit' && <AuditTab />}
    </div>
  )
}
