/** Rótulos em português para ações do audit log */
export const AUDIT_ACTION_LABELS = {
  'candidate.register': 'Cadastro de candidato',
  'candidate.verify_email': 'E-mail verificado',
  'candidate.login': 'Login no portal de candidatos',
  'candidate.update_profile': 'Atualização de perfil (candidato)',
  'candidate.upload_resume': 'Envio de currículo',
  'candidate.delete_resume': 'Remoção de currículo',

  'staff.login': 'Login no sistema',
  'staff.logout': 'Logout do sistema',
  'staff.refresh_token': 'Renovação de sessão',
  'staff.update_profile': 'Atualização de perfil',
  'staff.change_password': 'Alteração de senha',
  'staff.upload_avatar': 'Foto de perfil atualizada',
  'staff.remove_avatar': 'Foto de perfil removida',

  'settings.create_staff_user': 'Novo usuário criado',
  'settings.update_staff_user': 'Usuário atualizado',

  'job.create': 'Vaga criada',
  'job.update': 'Vaga atualizada',
  'job.delete': 'Vaga excluída',
  'job.publish': 'Vaga publicada',
  'job.unpublish': 'Vaga despublicada',

  'application.create': 'Nova candidatura',
  'application.approve_documentation': 'Documentação aprovada',
  'application.reject': 'Candidatura reprovada',
  'application.documentation_open': 'Etapa de documentação iniciada',
  'application.documentation_upload': 'Documento enviado (candidato)',
  'application.documentation_staff_upload': 'Documento enviado (equipe)',
  'application.documentation_item_approve': 'Documento aprovado',
  'application.documentation_item_reject': 'Documento rejeitado',
  'application.documentation_complete': 'Documentação concluída',
  'application.documentation_notify_candidate': 'Candidato notificado p/ documentação',
  'application.documentation_submitted': 'Documentação enviada pelo candidato',
  'application.documentation_resubmitted': 'Documento corrigido pelo candidato',
  'application.documentation_notify_rejection': 'Candidato notificado sobre reprovação',

  'signature.request_created': 'Assinatura DocuSign solicitada',
  'signature.completed': 'Documento assinado via DocuSign',

  'pipeline.move': 'Candidato movido no pipeline',
  'pipeline.stages_update': 'Etapas do pipeline atualizadas',

  'talent_pool.submit': 'Cadastro no banco de talentos',
  'talent_pool.status_update': 'Status do banco de talentos atualizado',

  'candidate.note_create': 'Nota adicionada ao candidato',
  'candidate.note_delete': 'Nota removida do candidato',

  'interview.create': 'Entrevista agendada',
  'interview.update': 'Entrevista atualizada',
  'interview.delete': 'Entrevista cancelada',
  'interview.send_to_documentation': 'Candidato enviado para documentação',

  'communication.template_create': 'Modelo de mensagem criado',
  'communication.template_update': 'Modelo de mensagem atualizado',
  'communication.template_delete': 'Modelo de mensagem excluído',
  'communication.send': 'Mensagem enviada ao candidato',

  'pre_admission.create': 'Pré-admissão iniciada',
  'pre_admission.forward_to_dp': 'Encaminhado ao Departamento Pessoal',
  'pre_admission.item_approve': 'Item da pré-admissão aprovado',
  'pre_admission.item_reject': 'Item da pré-admissão rejeitado',
  'pre_admission.candidate_upload': 'Documento enviado na pré-admissão (candidato)',
  'pre_admission.staff_upload': 'Documento enviado na pré-admissão (equipe)',
  'pre_admission.dp_reject': 'Pré-admissão rejeitada pelo DP',
  'pre_admission.dp_approve': 'Pré-admissão aprovada pelo DP',
  'pre_admission.hire': 'Admissão concluída',

  'cms.draft_save': 'Rascunho do portal salvo',
  'cms.publish': 'Conteúdo publicado no portal',
}

export const AUDIT_ENTITY_LABELS = {
  User: 'Usuário',
  StaffProfile: 'Perfil de colaborador',
  CandidateProfile: 'Perfil de candidato',
  Job: 'Vaga',
  Application: 'Candidatura',
  Document: 'Documento',
  Interview: 'Entrevista',
  CmsSection: 'Conteúdo do portal',
  ApplicationDocumentation: 'Documentação da candidatura',
  ApplicationDocumentationItem: 'Item de documentação',
  PreAdmissionCase: 'Pré-admissão',
  PreAdmissionChecklistItem: 'Item de pré-admissão',
  TalentPoolEntry: 'Banco de talentos',
}

export function getAuditActionLabel(action) {
  if (!action) return '—'
  return AUDIT_ACTION_LABELS[action] || action.replace(/\./g, ' · ').replace(/_/g, ' ')
}

export function getAuditEntityLabel(entityType) {
  if (!entityType) return '—'
  return AUDIT_ENTITY_LABELS[entityType] || entityType
}
