import sgMail from '@sendgrid/mail'
import { env } from '../config/env.js'
import { company } from '../templates/company.js'
import { EmailDeliveryError, parseSendGridError } from '../utils/sendgridError.js'

if (env.sendgridApiKey) {
  sgMail.setApiKey(env.sendgridApiKey)
}

function baseTemplate({ title, body, ctaLabel, ctaUrl }) {
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:Inter,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e5e5e5;">
        <tr><td style="background:linear-gradient(135deg,#c8050f,#003d7a);padding:28px 32px;">
          <p style="margin:0;color:#ffffff;font-size:18px;font-weight:600;">${company.name}</p>
          <p style="margin:4px 0 0;color:rgba(255,255,255,0.8);font-size:12px;letter-spacing:0.08em;text-transform:uppercase;">Portal de Carreiras</p>
        </td></tr>
        <tr><td style="padding:32px;">
          <h1 style="margin:0 0 16px;font-size:22px;color:#171717;">${title}</h1>
          <div style="font-size:15px;line-height:1.6;color:#525252;">${body}</div>
          ${ctaLabel && ctaUrl ? `
          <p style="margin:28px 0 0;">
            <a href="${ctaUrl}" style="display:inline-block;background:#c8050f;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:999px;font-size:14px;font-weight:600;">${ctaLabel}</a>
          </p>` : ''}
        </td></tr>
        <tr><td style="padding:20px 32px;border-top:1px solid #e5e5e5;background:#fafafa;">
          <p style="margin:0;font-size:12px;color:#a3a3a3;">© ${new Date().getFullYear()} ${company.name}. Todos os direitos reservados.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

function buildVerificationUrl(token) {
  return `${env.appUrl}/verificar-email?token=${token}`
}

async function sendEmail({ to, subject, html }) {
  if (!env.sendgridApiKey) {
    console.warn('[SendGrid] API key não configurada. E-mail simulado:', { to, subject })
    return { simulated: true }
  }

  try {
    await sgMail.send({
      to,
      from: { email: env.sendgridFromEmail, name: env.sendgridFromName },
      subject,
      html,
    })
    return { sent: true }
  } catch (error) {
    console.error('[SendGrid] Erro ao enviar:', error.response?.body || error.message)
    throw new EmailDeliveryError(parseSendGridError(error), error.response?.body)
  }
}

export async function sendVerificationEmail({ name, email, token }) {
  const verifyUrl = buildVerificationUrl(token)

  const result = await sendEmail({
    to: email,
    subject: `Confirme seu e-mail — ${company.name}`,
    html: baseTemplate({
      title: `Olá, ${name.split(' ')[0]}!`,
      body: `
        <p>Obrigado por criar sua conta no Portal de Carreiras da ${company.name}.</p>
        <p>Para ativar sua conta e acessar candidaturas, confirme seu e-mail clicando no botão abaixo. O link expira em 24 horas.</p>
      `,
      ctaLabel: 'Confirmar e-mail',
      ctaUrl: verifyUrl,
    }),
  })

  return { ...result, verifyUrl }
}

export async function sendWelcomeEmail({ name, email }) {
  const portalUrl = `${env.appUrl}/candidato`

  return sendEmail({
    to: email,
    subject: `Bem-vindo(a) ao Portal de Carreiras — ${company.name}`,
    html: baseTemplate({
      title: 'Conta ativada com sucesso!',
      body: `
        <p>Olá, ${name.split(' ')[0]}! Sua conta foi confirmada.</p>
        <p>Agora você pode se candidatar às vagas, acompanhar processos seletivos e manter seu perfil atualizado.</p>
      `,
      ctaLabel: 'Acessar portal',
      ctaUrl: portalUrl,
    }),
  })
}

export { buildVerificationUrl }

export async function sendCustomEmail({ to, subject, bodyHtml }) {
  return sendEmail({
    to,
    subject,
    html: baseTemplate({
      title: subject,
      body: bodyHtml,
    }),
  })
}

export async function sendDocumentationRequestEmail({ name, email, jobTitle, portalUrl, guidance }) {
  const tipsHtml = guidance.tips.map((tip) => `<li style="margin-bottom:8px;">${tip}</li>`).join('')

  return sendEmail({
    to: email,
    subject: `Envio de documentação — ${jobTitle} — ${company.name}`,
    html: baseTemplate({
      title: 'Documentação solicitada',
      body: `
        <p>Olá, ${name.split(' ')[0]}!</p>
        <p>Você foi selecionado(a) para a etapa de <strong>documentação</strong> da vaga <strong>${jobTitle}</strong>.</p>
        <p>Acesse o portal do candidato para enviar os documentos solicitados. Somente candidatos liberados pelo RH recebem esta mensagem.</p>
        <p><strong>${guidance.title}</strong></p>
        <ul style="padding-left:20px;margin:12px 0;">${tipsHtml}</ul>
        <p style="font-size:13px;color:#737373;">${guidance.uploadHint}</p>
      `,
      ctaLabel: 'Enviar documentação',
      ctaUrl: portalUrl,
    }),
  })
}

export async function sendDocumentationSubmittedToHrEmail({
  hrEmail,
  candidateName,
  jobTitle,
  reviewUrl,
  resubmitted = false,
}) {
  return sendEmail({
    to: hrEmail,
    subject: resubmitted
      ? `Documento corrigido — ${candidateName}`
      : `Documentação recebida — ${candidateName}`,
    html: baseTemplate({
      title: resubmitted ? 'Documento reenviado pelo candidato' : 'Nova documentação para validar',
      body: `
        <p>O candidato <strong>${candidateName}</strong> ${resubmitted ? 'reenviou um documento corrigido' : 'enviou toda a documentação obrigatória'} referente à vaga <strong>${jobTitle}</strong>.</p>
        <p>Acesse o perfil do candidato para validar os documentos e informar eventuais correções pelo portal.</p>
      `,
      ctaLabel: 'Validar documentação',
      ctaUrl: reviewUrl,
    }),
  })
}

export async function sendDocumentationItemRejectedEmail({
  name,
  email,
  jobTitle,
  itemLabel,
  reason,
  portalUrl,
}) {
  return sendEmail({
    to: email,
    subject: `Documento reprovado — ${itemLabel} — ${company.name}`,
    html: baseTemplate({
      title: 'Correção necessária',
      body: `
        <p>Olá, ${name.split(' ')[0]}!</p>
        <p>O RH analisou sua documentação para a vaga <strong>${jobTitle}</strong> e solicitou correção do item <strong>${itemLabel}</strong>.</p>
        <p><strong>Motivo:</strong> ${reason}</p>
        <p>Envie novamente pelo portal do candidato com um arquivo legível, nítido e bem iluminado.</p>
      `,
      ctaLabel: 'Corrigir documento',
      ctaUrl: portalUrl,
    }),
  })
}
