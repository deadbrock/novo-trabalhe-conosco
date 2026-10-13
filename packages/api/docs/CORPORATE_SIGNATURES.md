# Sistema Corporativo de Assinatura Eletrônica

Arquitetura desacoplada com **Provider Pattern**. DocuSign é o primeiro provider; novos providers (Clicksign, Adobe Sign, etc.) podem ser adicionados sem alterar o módulo `documents`.

## Estrutura de arquivos

```
packages/api/src/
├── modules/
│   ├── signatures/
│   │   └── providers/
│   │       ├── SignatureProvider.js      # Contrato base
│   │       ├── index.js                    # Factory getSignatureProvider()
│   │       └── docusign/
│   │           ├── DocuSignProvider.js     # JWT, envelope, embedded signing, download
│   │           ├── DocuSignError.js
│   │           └── DocuSignLogger.js       # logs/docusign/YYYY-MM-DD.jsonl
│   └── documents/
│       ├── documentRegistry.js             # Tipos de documento extensíveis
│       ├── documentStorage.js              # storage/documents/candidate-{id}/
│       ├── DocumentRepository.js
│       ├── DocumentService.js
│       ├── DocumentValidator.js
│       ├── DocumentController.js
│       └── DocumentRoutes.js
├── routes/webhooks.routes.js               # POST /api/webhooks/docusign
└── logs/docusign/                          # Auditoria (gerado em runtime)

apps/website/src/
├── features/signatures/SignatureModal.jsx  # Modal fullscreen + iframe
├── pages/SigningReturnPage.jsx             # Retorno embedded signing
└── services/documentsService.js

apps/admin/src/
├── pages/candidates/CandidateDocumentsPanel.jsx
└── services/adminDocumentsService.js
```

## Banco de dados

### `candidate_documents`
| Campo | Descrição |
|-------|-----------|
| provider | `docusign` (extensível) |
| provider_envelope_id | ID do envelope DocuSign |
| provider_document_id | Reservado para ID do documento no provider |
| status | PENDING, SENT, DELIVERED, VIEWED, SIGNED, DECLINED, VOIDED, ERROR |
| signed_pdf_path | Caminho do PDF assinado |
| certificate_pdf_path | Caminho do Certificate of Completion |

### `document_events`
Timeline de eventos (criação, envio, visualização, assinatura, webhooks).

## Endpoints — Candidato

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/documents` | Lista documentos do candidato autenticado |
| POST | `/api/documents/:id/sign` | Inicia assinatura → `{ success, signingUrl }` |
| GET | `/api/documents/:id/status` | Status atual |
| GET | `/api/documents/:id/download` | Download PDF assinado |
| GET | `/api/documents/:id/certificate` | Download certificado DocuSign |
| POST | `/api/candidate/documents/ethnic-declaration/sign` | Fluxo autodeclaração (cria doc + inicia DocuSign) |

## Endpoints — Admin (RH)

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/admin/candidates/:candidateId/documents` | Lista documentos |
| GET | `/api/admin/documents/:id/timeline` | Histórico de eventos |
| GET | `/api/admin/documents/:id/download` | Download PDF |
| GET | `/api/admin/documents/:id/certificate` | Download certificado |

## Webhook

`POST /api/webhooks/docusign`

- Valida HMAC (`DOCUSIGN_CONNECT_HMAC_KEY`)
- Atualiza `candidate_documents`
- Baixa PDF assinado + certificado
- Registra `document_events`
- Retorna HTTP 200

## Fluxo — Autodeclaração Étnico-Racial

1. Candidato preenche formulário no portal
2. Clica **Assinar documento** → confirma
3. Backend salva dados, cria `candidate_documents`, cria envelope DocuSign
4. Retorna `signingUrl`
5. `SignatureModal` abre iframe fullscreen
6. DocuSign redireciona para `/portal-do-candidato/assinatura/retorno`
7. Página de retorno envia `postMessage` → modal fecha → status atualizado
8. Webhook (opcional) finaliza download dos PDFs

## Variáveis de ambiente

```
DOCUSIGN_INTEGRATION_KEY
DOCUSIGN_USER_ID
DOCUSIGN_ACCOUNT_ID
DOCUSIGN_PRIVATE_KEY
DOCUSIGN_BASE_PATH
DOCUSIGN_OAUTH_BASE_PATH
DOCUSIGN_TEMPLATE_ID_AUTODECLARACAO
DOCUSIGN_TEMPLATE_ROLE
DOCUSIGN_CONNECT_HMAC_KEY
```

## Adicionar novo provider

1. Criar `modules/signatures/providers/clicksign/ClicksignProvider.js`
2. Implementar métodos de `SignatureProvider`
3. Registrar em `providers/index.js`
4. Definir `provider: 'clicksign'` ao criar documento

## Adicionar novo tipo de documento

1. Adicionar enum em `schema.prisma` → `CandidateDocumentType`
2. Registrar em `documentRegistry.js` com `templateId`
3. Criar fluxo no portal (página + rota)

## Migration

```powershell
cd packages/api
pnpm run db:push
pnpm run db:generate
```

Migration: `20260727190000_corporate_signatures`
