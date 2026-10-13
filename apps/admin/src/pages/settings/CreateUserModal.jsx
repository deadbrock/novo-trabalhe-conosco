import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { ApiError } from '@/services/api'

const inputClass =
  'w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#003d7a]/20 bg-white'

const EMPTY = {
  name: '',
  email: '',
  password: '',
  phone: '',
  jobTitle: '',
  department: '',
  roleId: '',
  unitId: '',
  status: 'ACTIVE',
}

export function CreateUserModal({ open, roles, units = [], onClose, onSubmit, saving }) {
  const [form, setForm] = useState(EMPTY)
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) {
      setForm({ ...EMPTY, roleId: roles[0]?.id || '' })
      setError('')
    }
  }, [open, roles])

  if (!open) return null

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
    setError('')
  }

  function handleSubmit(event) {
    event.preventDefault()
    if (!form.name.trim() || !form.email.trim() || !form.password || !form.roleId) {
      setError('Preencha nome, e-mail, senha e perfil de acesso.')
      return
    }
    if (form.password.length < 8) {
      setError('A senha deve ter pelo menos 8 caracteres.')
      return
    }
    onSubmit(form)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="w-full max-w-lg bg-white rounded-xl shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100">
          <h2 className="text-lg font-semibold">Novo usuário</h2>
          <button type="button" onClick={onClose} className="p-2 rounded-lg hover:bg-neutral-100 text-neutral-500">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <p className="text-sm text-neutral-500">
            Crie uma conta de acesso ao sistema. Somente administradores podem cadastrar usuários.
          </p>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-neutral-600 mb-1">Nome completo *</label>
              <input className={inputClass} value={form.name} onChange={(e) => update('name', e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-neutral-600 mb-1">E-mail *</label>
              <input type="email" className={inputClass} value={form.email} onChange={(e) => update('email', e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-neutral-600 mb-1">Senha inicial *</label>
              <input type="password" className={inputClass} value={form.password} onChange={(e) => update('password', e.target.value)} placeholder="Mínimo 8 caracteres" />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-600 mb-1">Perfil de acesso *</label>
              <select className={inputClass} value={form.roleId} onChange={(e) => update('roleId', e.target.value)}>
                <option value="">Selecione</option>
                {roles.map((role) => (
                  <option key={role.id} value={role.id}>{role.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-600 mb-1">Status</label>
              <select className={inputClass} value={form.status} onChange={(e) => update('status', e.target.value)}>
                <option value="ACTIVE">Ativo</option>
                <option value="INACTIVE">Inativo</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-600 mb-1">Cargo</label>
              <input className={inputClass} value={form.jobTitle} onChange={(e) => update('jobTitle', e.target.value)} placeholder="Ex.: Analista de RH" />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-600 mb-1">Departamento</label>
              <input className={inputClass} value={form.department} onChange={(e) => update('department', e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-neutral-600 mb-1">Telefone</label>
              <input className={inputClass} value={form.phone} onChange={(e) => update('phone', e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-neutral-600 mb-1">Unidade operacional</label>
              <select className={inputClass} value={form.unitId} onChange={(e) => update('unitId', e.target.value)}>
                <option value="">Sede / sem recorte (vê tudo do perfil)</option>
                {units.map((unit) => (
                  <option key={unit.id} value={unit.id}>{unit.name}</option>
                ))}
              </select>
              <p className="text-xs text-neutral-500 mt-1">
                Analistas de outros estados devem ficar na unidade administrativa correspondente.
              </p>
            </div>
          </div>

          {form.roleId && (
            <p className="text-xs text-blue-800 bg-blue-50 rounded-lg px-3 py-2">
              {roles.find((r) => r.id === form.roleId)?.description}
            </p>
          )}

          {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

          <div className="flex gap-2 pt-2">
            <Button type="submit" loading={saving}>Criar usuário</Button>
            <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export function handleCreateUserError(err, setFeedback) {
  setFeedback(err instanceof ApiError ? err.message : 'Erro ao criar usuário.')
}
