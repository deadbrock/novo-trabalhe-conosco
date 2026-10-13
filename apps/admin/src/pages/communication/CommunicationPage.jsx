import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Mail, MessageSquare, Send, Plus, Pencil, Trash2, FileText } from 'lucide-react'
import { communicationService } from '@/services/communicationService'
import { interviewsService } from '@/services/interviewsService'
import { CHANNEL_MAP, LOG_STATUS_MAP, TEMPLATE_VARIABLES, formatDateTime } from './communicationUtils'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Card, CardContent } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'
import { ApiError } from '@/services/api'
import { useAuth } from '@/context/AuthContext'
import { cn } from '@/utils/cn'

const TABS = [
  { id: 'templates', label: 'Modelos' },
  { id: 'history', label: 'Histórico' },
]

export function CommunicationPage() {
  const queryClient = useQueryClient()
  const { hasPermission } = useAuth()
  const canWrite = hasPermission('communication:write')

  const [activeTab, setActiveTab] = useState('templates')
  const [feedback, setFeedback] = useState('')
  const [templateModal, setTemplateModal] = useState(null)
  const [sendOpen, setSendOpen] = useState(false)

  const { data: statsData } = useQuery({
    queryKey: ['communication-stats'],
    queryFn: () => communicationService.getStats(),
  })

  const { data: templatesData, isLoading: loadingTemplates } = useQuery({
    queryKey: ['communication-templates'],
    queryFn: () => communicationService.listTemplates(),
  })

  const { data: logsData, isLoading: loadingLogs } = useQuery({
    queryKey: ['communication-logs'],
    queryFn: () => communicationService.listLogs(),
    enabled: activeTab === 'history',
  })

  const saveTemplateMutation = useMutation({
    mutationFn: (payload) =>
      templateModal?.id
        ? communicationService.updateTemplate(templateModal.id, payload)
        : communicationService.createTemplate(payload),
    onSuccess: () => {
      setFeedback('')
      setTemplateModal(null)
      queryClient.invalidateQueries({ queryKey: ['communication-templates'] })
      queryClient.invalidateQueries({ queryKey: ['communication-stats'] })
    },
    onError: (err) => {
      setFeedback(err instanceof ApiError ? err.message : 'Erro ao salvar modelo.')
    },
  })

  const deleteTemplateMutation = useMutation({
    mutationFn: (id) => communicationService.removeTemplate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communication-templates'] })
      queryClient.invalidateQueries({ queryKey: ['communication-stats'] })
    },
  })

  const stats = statsData?.stats || {}
  const templates = templatesData?.templates || []
  const logs = logsData?.logs || []

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Comunicação</h1>
          <p className="text-sm text-neutral-500 mt-1">Modelos de mensagem e histórico de envios</p>
        </div>
        {canWrite && (
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setSendOpen(true)}>
              <Send size={16} />
              Enviar mensagem
            </Button>
            <Button onClick={() => setTemplateModal({})}>
              <Plus size={16} />
              Novo modelo
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Modelos ativos" value={stats.templates ?? 0} icon={FileText} />
        <StatCard label="Enviados" value={stats.sent ?? 0} icon={Mail} />
        <StatCard label="WhatsApp" value={stats.whatsapp ?? 0} icon={MessageSquare} />
        <StatCard label="Falhas" value={stats.failed ?? 0} icon={Send} />
      </div>

      <div className="border-b border-neutral-200">
        <div className="flex gap-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'px-4 py-2.5 text-sm font-medium border-b-2 -mb-px',
                activeTab === tab.id ? 'border-[#003d7a] text-[#003d7a]' : 'border-transparent text-neutral-500',
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {feedback && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{feedback}</p>}

      {activeTab === 'templates' && (
        loadingTemplates ? (
          <Skeleton className="h-32 w-full" />
        ) : templates.length === 0 ? (
          <Card><CardContent className="py-12 text-center text-sm text-neutral-400">Nenhum modelo cadastrado.</CardContent></Card>
        ) : (
          <div className="grid gap-3">
            {templates.map((template) => {
              const channel = CHANNEL_MAP[template.channel] || CHANNEL_MAP.EMAIL
              return (
                <Card key={template.id}>
                  <CardContent className="py-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold">{template.name}</p>
                          <Badge variant={channel.variant}>{channel.label}</Badge>
                          {!template.isActive && <Badge variant="default">Inativo</Badge>}
                        </div>
                        {template.subject && <p className="text-sm text-neutral-600 mt-1">Assunto: {template.subject}</p>}
                        <p className="text-sm text-neutral-500 mt-2 whitespace-pre-wrap line-clamp-3">{template.body}</p>
                      </div>
                      {canWrite && (
                        <div className="flex gap-2 shrink-0">
                          <Button variant="secondary" size="sm" onClick={() => setTemplateModal(template)}>
                            <Pencil size={14} />
                          </Button>
                          <Button variant="ghost" size="sm" className="text-red-600" onClick={() => deleteTemplateMutation.mutate(template.id)}>
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )
      )}

      {activeTab === 'history' && (
        loadingLogs ? (
          <Skeleton className="h-32 w-full" />
        ) : logs.length === 0 ? (
          <Card><CardContent className="py-12 text-center text-sm text-neutral-400">Nenhum envio registrado.</CardContent></Card>
        ) : (
          <div className="space-y-3">
            {logs.map((log) => {
              const channel = CHANNEL_MAP[log.channel] || CHANNEL_MAP.EMAIL
              const status = LOG_STATUS_MAP[log.status] || LOG_STATUS_MAP.DRAFT
              return (
                <Card key={log.id}>
                  <CardContent className="py-4 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={channel.variant}>{channel.label}</Badge>
                      <Badge variant={status.variant}>{status.label}</Badge>
                      {log.templateName && <Badge variant="default">{log.templateName}</Badge>}
                    </div>
                    <p className="text-sm font-medium">{log.subject || 'Sem assunto'}</p>
                    <p className="text-xs text-neutral-500">
                      Para: {log.recipient}
                      {log.candidateName && ` · ${log.candidateName}`}
                      {log.jobTitle && ` · ${log.jobTitle}`}
                    </p>
                    <p className="text-sm text-neutral-600 whitespace-pre-wrap line-clamp-4">{log.body}</p>
                    <p className="text-xs text-neutral-400">
                      {formatDateTime(log.sentAt || log.createdAt)}
                      {log.sentByName && ` · ${log.sentByName}`}
                    </p>
                    {log.errorMessage && <p className="text-xs text-red-600">{log.errorMessage}</p>}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )
      )}

      {templateModal && (
        <TemplateModal
          template={templateModal.id ? templateModal : null}
          onClose={() => setTemplateModal(null)}
          onSave={(payload) => saveTemplateMutation.mutate(payload)}
          saving={saveTemplateMutation.isPending}
        />
      )}

      {sendOpen && (
        <SendMessageModal
          templates={templates}
          onClose={() => setSendOpen(false)}
          onSent={() => {
            setSendOpen(false)
            queryClient.invalidateQueries({ queryKey: ['communication-logs'] })
            queryClient.invalidateQueries({ queryKey: ['communication-stats'] })
          }}
        />
      )}

      <p className="text-xs text-neutral-400">
        Variáveis disponíveis: {TEMPLATE_VARIABLES.join(', ')}
      </p>
    </div>
  )
}

function StatCard({ label, value, icon: Icon }) {
  return (
    <Card>
      <CardContent className="pt-4 pb-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-xs text-neutral-500">{label}</p>
            <p className="text-2xl font-semibold mt-1">{value}</p>
          </div>
          <div className="p-2 rounded-lg text-[#003d7a] bg-blue-50">
            <Icon size={16} />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function TemplateModal({ template, onClose, onSave, saving }) {
  const [form, setForm] = useState({
    name: template?.name || '',
    channel: template?.channel || 'EMAIL',
    subject: template?.subject || '',
    body: template?.body || '',
    isActive: template?.isActive !== false,
  })

  return (
    <ModalShell title={template ? 'Editar modelo' : 'Novo modelo'} onClose={onClose}>
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault()
          onSave(form)
        }}
      >
        <Input label="Nome" value={form.name} onChange={(v) => setForm({ ...form, name: v })} required />
        <Select label="Canal" value={form.channel} onChange={(v) => setForm({ ...form, channel: v })} options={[['EMAIL', 'E-mail'], ['WHATSAPP', 'WhatsApp']]} />
        {form.channel === 'EMAIL' && (
          <Input label="Assunto" value={form.subject} onChange={(v) => setForm({ ...form, subject: v })} />
        )}
        <Textarea label="Conteúdo" value={form.body} onChange={(v) => setForm({ ...form, body: v })} required rows={8} />
        <label className="inline-flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
          Modelo ativo
        </label>
        <ModalActions onClose={onClose} saving={saving} submitLabel={template ? 'Salvar' : 'Criar'} />
      </form>
    </ModalShell>
  )
}

function SendMessageModal({ templates, onClose, onSent }) {
  const [form, setForm] = useState({
    templateId: '',
    applicationId: '',
    channel: 'EMAIL',
    subject: '',
    body: '',
  })
  const [preview, setPreview] = useState(null)
  const [feedback, setFeedback] = useState('')
  const [sending, setSending] = useState(false)

  const { data: applicationsData } = useQuery({
    queryKey: ['interview-applications-send'],
    queryFn: () => interviewsService.getApplications(),
  })

  const applications = applicationsData?.applications || []

  function applyTemplate(templateId) {
    const template = templates.find((t) => t.id === templateId)
    if (!template) return
    setForm((prev) => ({
      ...prev,
      templateId,
      channel: template.channel,
      subject: template.subject,
      body: template.body,
    }))
  }

  async function handlePreview() {
    setFeedback('')
    try {
      const result = await communicationService.preview(form)
      setPreview(result.preview)
    } catch (err) {
      setFeedback(err instanceof ApiError ? err.message : 'Erro na pré-visualização.')
    }
  }

  async function handleSend() {
    setFeedback('')
    setSending(true)
    try {
      await communicationService.send(form)
      onSent()
    } catch (err) {
      setFeedback(err instanceof ApiError ? err.message : 'Erro ao enviar.')
    } finally {
      setSending(false)
    }
  }

  return (
    <ModalShell title="Enviar mensagem" onClose={onClose}>
      <div className="space-y-4">
        <Select
          label="Candidatura"
          value={form.applicationId}
          onChange={(v) => setForm({ ...form, applicationId: v })}
          options={[['', 'Selecione'], ...applications.map((a) => [a.id, `${a.candidateName} — ${a.jobTitle}`])]}
          required
        />
        <Select
          label="Modelo (opcional)"
          value={form.templateId}
          onChange={(v) => { setForm({ ...form, templateId: v }); applyTemplate(v) }}
          options={[['', 'Personalizado'], ...templates.filter((t) => t.isActive).map((t) => [t.id, t.name])]}
        />
        <Select label="Canal" value={form.channel} onChange={(v) => setForm({ ...form, channel: v })} options={[['EMAIL', 'E-mail'], ['WHATSAPP', 'WhatsApp']]} />
        {form.channel === 'EMAIL' && (
          <Input label="Assunto" value={form.subject} onChange={(v) => setForm({ ...form, subject: v })} />
        )}
        <Textarea label="Mensagem" value={form.body} onChange={(v) => setForm({ ...form, body: v })} rows={8} required />

        {preview && (
          <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4 text-sm space-y-2">
            <p className="font-medium">Pré-visualização</p>
            <p className="text-xs text-neutral-500">Para: {preview.recipient}</p>
            {preview.subject && <p className="text-xs text-neutral-600">Assunto: {preview.subject}</p>}
            <p className="whitespace-pre-wrap text-neutral-700">{preview.body}</p>
          </div>
        )}

        {feedback && <p className="text-sm text-red-600">{feedback}</p>}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button type="button" variant="secondary" onClick={handlePreview}>Pré-visualizar</Button>
          <Button type="button" onClick={handleSend} disabled={sending}>
            {sending ? 'Enviando...' : form.channel === 'WHATSAPP' ? 'Registrar envio' : 'Enviar e-mail'}
          </Button>
        </div>
        {form.channel === 'WHATSAPP' && (
          <p className="text-xs text-neutral-400">WhatsApp: a mensagem é registrada no histórico para envio manual (integração em fase futura).</p>
        )}
      </div>
    </ModalShell>
  )
}

function ModalShell({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="w-full max-w-xl bg-white rounded-xl shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button type="button" onClick={onClose} className="p-2 rounded-lg hover:bg-neutral-100 text-neutral-500">×</button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}

function Input({ label, value, onChange, required }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-medium text-neutral-600">{label}</span>
      <input required={required} value={value} onChange={(e) => onChange(e.target.value)} className={fieldClass} />
    </label>
  )
}

function Textarea({ label, value, onChange, required, rows = 4 }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-medium text-neutral-600">{label}</span>
      <textarea required={required} rows={rows} value={value} onChange={(e) => onChange(e.target.value)} className={fieldClass} />
    </label>
  )
}

function Select({ label, value, onChange, options, required }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-medium text-neutral-600">{label}</span>
      <select required={required} value={value} onChange={(e) => onChange(e.target.value)} className={fieldClass}>
        {options.map(([val, text]) => <option key={val || 'empty'} value={val}>{text}</option>)}
      </select>
    </label>
  )
}

function ModalActions({ onClose, saving, submitLabel }) {
  return (
    <div className="flex justify-end gap-2 pt-2">
      <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
      <Button type="submit" disabled={saving}>{saving ? 'Salvando...' : submitLabel}</Button>
    </div>
  )
}

const fieldClass = 'w-full min-h-9 px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#003d7a]/20 focus:border-[#003d7a]'
