# Templates PDF para assinatura DocuSign

Coloque aqui os PDFs usados quando **não** houver `DOCUSIGN_TEMPLATE_ID_*` configurado no `.env`.

## Autodeclaração

Arquivo: `autodeclaracao.pdf`

- Deve conter o texto `/sign_here/` no local onde o candidato deve assinar (âncora DocuSign).
- Alternativa recomendada: criar um **Template** no DocuSign e definir `DOCUSIGN_TEMPLATE_ID_AUTODECLARACAO` no `.env`.

## Fluxo

1. RH clica **Solicitar assinatura** no checklist documental (admin).
2. Candidato acessa **Portal → Assinaturas** e assina via DocuSign embutido.
3. PDF assinado é salvo automaticamente no item correspondente do checklist.
