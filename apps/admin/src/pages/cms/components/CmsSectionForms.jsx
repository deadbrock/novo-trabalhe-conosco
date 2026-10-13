import {
  CmsField,
  CmsFormCard,
  PageHeaderFields,
  CtaFields,
  ListItemCard,
  moveListItem,
  AddListItemButton,
  slugify,
} from './CmsFormPrimitives'
import { cmsInputClass, cmsTextareaClass, cmsSelectClass } from '../constants/cmsFormStyles'
import { CMS_SECTION_META } from '../constants/cmsSectionMeta'

function openHelp(setHelp, key) {
  const meta = CMS_SECTION_META[key]
  if (meta?.help) setHelp(meta.help)
}

function TextBlockFields({ title, text, onTitleChange, onTextChange, titleLabel = 'Título', textLabel = 'Texto' }) {
  return (
    <>
      <CmsField label={titleLabel}>
        <input type="text" className={cmsInputClass} value={title || ''} onChange={(e) => onTitleChange(e.target.value)} />
      </CmsField>
      <CmsField label={textLabel}>
        <textarea className={cmsTextareaClass} rows={5} value={text || ''} onChange={(e) => onTextChange(e.target.value)} />
      </CmsField>
    </>
  )
}

export function HeroForm({ value, onChange, setHelp }) {
  const v = value || {}
  const meta = CMS_SECTION_META.hero

  return (
    <div className="space-y-4">
      <CmsFormCard
        title="Banner principal"
        summary="Título, descrição e etiqueta exibidos no topo da página inicial."
        help={meta.help}
        onHelpClick={() => openHelp(setHelp, 'hero')}
      >
        <CmsField label="Etiqueta superior" hint="Texto pequeno acima do título">
          <input type="text" className={cmsInputClass} value={v.badge || ''} onChange={(e) => onChange({ ...v, badge: e.target.value })} />
        </CmsField>
        <CmsField label="Título principal">
          <input type="text" className={cmsInputClass} value={v.title || ''} onChange={(e) => onChange({ ...v, title: e.target.value })} />
        </CmsField>
        <CmsField label="Frase em destaque no título" hint="Parte do título que aparece colorida">
          <input type="text" className={cmsInputClass} value={v.titleHighlight || ''} onChange={(e) => onChange({ ...v, titleHighlight: e.target.value })} />
        </CmsField>
        <CmsField label="Descrição">
          <textarea className={cmsTextareaClass} rows={4} value={v.description || ''} onChange={(e) => onChange({ ...v, description: e.target.value })} />
        </CmsField>
      </CmsFormCard>

      <CmsFormCard title="Botões de ação" summary="Dois botões abaixo do texto principal.">
        <CtaFields label="primário" value={v.primaryCta || {}} onChange={(cta) => onChange({ ...v, primaryCta: cta })} />
        <CtaFields label="secundário" value={v.secondaryCta || {}} onChange={(cta) => onChange({ ...v, secondaryCta: cta })} />
      </CmsFormCard>

      <CmsFormCard title="Vídeo institucional" summary="Vídeo exibido ao lado do texto na home.">
        <CmsField label="Caminho do vídeo" hint="Ex.: /fg.mp4">
          <input type="text" className={cmsInputClass} value={v.videoSrc || ''} onChange={(e) => onChange({ ...v, videoSrc: e.target.value })} />
        </CmsField>
        <CmsField label="Descrição do vídeo (acessibilidade)">
          <input type="text" className={cmsInputClass} value={v.videoLabel || ''} onChange={(e) => onChange({ ...v, videoLabel: e.target.value })} />
        </CmsField>
      </CmsFormCard>
    </div>
  )
}

export function SeoForm({ value, onChange, setHelp }) {
  const v = value || {}
  const meta = CMS_SECTION_META.seo

  return (
    <CmsFormCard
      title="Configurações de SEO"
      summary="Títulos e descrições usados pelo Google e redes sociais em todo o portal."
      help={meta.help}
      onHelpClick={() => openHelp(setHelp, 'seo')}
    >
      <CmsField label="Nome do site">
        <input type="text" className={cmsInputClass} value={v.siteName || ''} onChange={(e) => onChange({ ...v, siteName: e.target.value })} />
      </CmsField>
      <CmsField label="Título padrão">
        <input type="text" className={cmsInputClass} value={v.defaultTitle || ''} onChange={(e) => onChange({ ...v, defaultTitle: e.target.value })} />
      </CmsField>
      <CmsField label="Descrição padrão" hint="Recomendado: até 160 caracteres">
        <textarea className={cmsTextareaClass} rows={3} value={v.defaultDescription || ''} onChange={(e) => onChange({ ...v, defaultDescription: e.target.value })} />
      </CmsField>
      <CmsField label="Palavras-chave" hint="Separadas por vírgula">
        <input type="text" className={cmsInputClass} value={v.defaultKeywords || ''} onChange={(e) => onChange({ ...v, defaultKeywords: e.target.value })} />
      </CmsField>
    </CmsFormCard>
  )
}

export function FooterForm({ value, onChange, setHelp }) {
  const v = value || {}
  const meta = CMS_SECTION_META.footer

  return (
    <div className="space-y-4">
      <CmsFormCard
        title="Informações de contato"
        summary="Dados exibidos no rodapé de todas as páginas."
        help={meta.help}
        onHelpClick={() => openHelp(setHelp, 'footer')}
      >
        <CmsField label="Slogan">
          <input type="text" className={cmsInputClass} value={v.tagline || ''} onChange={(e) => onChange({ ...v, tagline: e.target.value })} />
        </CmsField>
        <div className="grid sm:grid-cols-2 gap-4">
          <CmsField label="Razão social">
            <input type="text" className={cmsInputClass} value={v.legalName || ''} onChange={(e) => onChange({ ...v, legalName: e.target.value })} />
          </CmsField>
          <CmsField label="CNPJ">
            <input type="text" className={cmsInputClass} value={v.cnpj || ''} onChange={(e) => onChange({ ...v, cnpj: e.target.value })} />
          </CmsField>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <CmsField label="E-mail">
            <input type="email" className={cmsInputClass} value={v.email || ''} onChange={(e) => onChange({ ...v, email: e.target.value })} />
          </CmsField>
          <CmsField label="Telefone">
            <input type="text" className={cmsInputClass} value={v.phone || ''} onChange={(e) => onChange({ ...v, phone: e.target.value })} />
          </CmsField>
        </div>
        <CmsField label="Sede">
          <input type="text" className={cmsInputClass} value={v.headquarters || ''} onChange={(e) => onChange({ ...v, headquarters: e.target.value })} />
        </CmsField>
      </CmsFormCard>

      <CmsFormCard title="Links legais" summary="Política de privacidade e termos de uso.">
        <div className="grid sm:grid-cols-2 gap-4">
          <CmsField label="Texto — Privacidade">
            <input type="text" className={cmsInputClass} value={v.privacyLabel || ''} onChange={(e) => onChange({ ...v, privacyLabel: e.target.value })} />
          </CmsField>
          <CmsField label="Link — Privacidade">
            <input type="text" className={cmsInputClass} value={v.privacyHref || ''} onChange={(e) => onChange({ ...v, privacyHref: e.target.value })} />
          </CmsField>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <CmsField label="Texto — Termos">
            <input type="text" className={cmsInputClass} value={v.termsLabel || ''} onChange={(e) => onChange({ ...v, termsLabel: e.target.value })} />
          </CmsField>
          <CmsField label="Link — Termos">
            <input type="text" className={cmsInputClass} value={v.termsHref || ''} onChange={(e) => onChange({ ...v, termsHref: e.target.value })} />
          </CmsField>
        </div>
      </CmsFormCard>
    </div>
  )
}

export function HistoryForm({ value, onChange, setHelp }) {
  const v = value || {}
  const meta = CMS_SECTION_META.history

  return (
    <div className="space-y-4">
      <CmsFormCard title="Cabeçalho da página" summary="Título e introdução da página Nossa História." help={meta.help} onHelpClick={() => openHelp(setHelp, 'history')}>
        <PageHeaderFields value={v} onChange={onChange} />
      </CmsFormCard>
      <CmsFormCard title="O Início" summary="Primeiro bloco narrativo da história.">
        <TextBlockFields
          title={v.intro?.title}
          text={v.intro?.text}
          onTitleChange={(t) => onChange({ ...v, intro: { ...v.intro, title: t } })}
          onTextChange={(t) => onChange({ ...v, intro: { ...v.intro, text: t } })}
        />
      </CmsFormCard>
      <CmsFormCard title="Crescimento e Conquistas" summary="Segundo bloco com marcos recentes.">
        <TextBlockFields
          title={v.growth?.title}
          text={v.growth?.text}
          onTitleChange={(t) => onChange({ ...v, growth: { ...v.growth, title: t } })}
          onTextChange={(t) => onChange({ ...v, growth: { ...v.growth, text: t } })}
        />
      </CmsFormCard>
    </div>
  )
}

export function MissionForm({ value, onChange, setHelp }) {
  const v = value || {}
  const meta = CMS_SECTION_META.mission

  return (
    <div className="space-y-4">
      <CmsFormCard title="Cabeçalho da página" summary="Apresentação da página Nossa Cultura." help={meta.help} onHelpClick={() => openHelp(setHelp, 'mission')}>
        <PageHeaderFields value={v} onChange={onChange} />
      </CmsFormCard>
      <CmsFormCard title="Propósito" summary="Missão e propósito da empresa.">
        <CmsField label="Título do propósito">
          <input type="text" className={cmsInputClass} value={v.purposeTitle || ''} onChange={(e) => onChange({ ...v, purposeTitle: e.target.value })} />
        </CmsField>
        <CmsField label="Texto do propósito">
          <textarea className={cmsTextareaClass} rows={4} value={v.purposeText || ''} onChange={(e) => onChange({ ...v, purposeText: e.target.value })} />
        </CmsField>
      </CmsFormCard>
    </div>
  )
}

export function ValuesForm({ value, onChange, setHelp }) {
  const v = value || {}
  const items = v.items || []
  const meta = CMS_SECTION_META.values

  function updateItem(index, patch) {
    const next = items.map((item, i) => (i === index ? { ...item, ...patch } : item))
    onChange({ ...v, items: next })
  }

  return (
    <div className="space-y-4">
      <CmsFormCard title="Título da seção" summary="Cabeçalho da lista de valores." help={meta.help} onHelpClick={() => openHelp(setHelp, 'values')}>
        <CmsField label="Título">
          <input type="text" className={cmsInputClass} value={v.title || ''} onChange={(e) => onChange({ ...v, title: e.target.value })} />
        </CmsField>
      </CmsFormCard>

      <CmsFormCard title="Valores" summary={`${items.length} valor(es) cadastrado(s). Edite, reordene ou adicione novos.`}>
        <div className="space-y-3">
          {items.map((item, index) => (
            <ListItemCard
              key={item.id || index}
              index={index}
              title={item.title || `Valor ${index + 1}`}
              canMoveUp={index > 0}
              canMoveDown={index < items.length - 1}
              onMoveUp={() => onChange({ ...v, items: moveListItem(items, index, -1) })}
              onMoveDown={() => onChange({ ...v, items: moveListItem(items, index, 1) })}
              onRemove={() => onChange({ ...v, items: items.filter((_, i) => i !== index) })}
            >
              <CmsField label="Título">
                <input
                  type="text"
                  className={cmsInputClass}
                  value={item.title || ''}
                  onChange={(e) => updateItem(index, { title: e.target.value, id: item.id || slugify(e.target.value) })}
                />
              </CmsField>
              <CmsField label="Descrição">
                <textarea className={cmsTextareaClass} rows={3} value={item.description || ''} onChange={(e) => updateItem(index, { description: e.target.value })} />
              </CmsField>
            </ListItemCard>
          ))}
        </div>
        <AddListItemButton
          label="Adicionar valor"
          onClick={() =>
            onChange({
              ...v,
              items: [...items, { id: `valor-${Date.now()}`, title: '', description: '' }],
            })
          }
        />
      </CmsFormCard>
    </div>
  )
}

export function BenefitsForm({ value, onChange, setHelp }) {
  const v = value || {}
  const items = v.items || []
  const meta = CMS_SECTION_META.benefits

  function updateItem(index, patch) {
    onChange({ ...v, items: items.map((item, i) => (i === index ? { ...item, ...patch } : item)) })
  }

  return (
    <div className="space-y-4">
      <CmsFormCard title="Cabeçalho da página" summary="Introdução da página de Benefícios." help={meta.help} onHelpClick={() => openHelp(setHelp, 'benefits')}>
        <PageHeaderFields value={v} onChange={onChange} />
      </CmsFormCard>

      <CmsFormCard title="Lista de benefícios" summary="Cards exibidos na página e na home.">
        <div className="space-y-3">
          {items.map((item, index) => (
            <ListItemCard
              key={item.id || index}
              index={index}
              title={item.title || `Benefício ${index + 1}`}
              canMoveUp={index > 0}
              canMoveDown={index < items.length - 1}
              onMoveUp={() => onChange({ ...v, items: moveListItem(items, index, -1) })}
              onMoveDown={() => onChange({ ...v, items: moveListItem(items, index, 1) })}
              onRemove={() => onChange({ ...v, items: items.filter((_, i) => i !== index) })}
            >
              <CmsField label="Categoria" hint="Ex.: Saúde & Bem-estar">
                <input type="text" className={cmsInputClass} value={item.category || ''} onChange={(e) => updateItem(index, { category: e.target.value })} />
              </CmsField>
              <CmsField label="Título">
                <input
                  type="text"
                  className={cmsInputClass}
                  value={item.title || ''}
                  onChange={(e) => updateItem(index, { title: e.target.value, id: item.id || slugify(e.target.value) })}
                />
              </CmsField>
              <CmsField label="Descrição">
                <textarea className={cmsTextareaClass} rows={3} value={item.description || ''} onChange={(e) => updateItem(index, { description: e.target.value })} />
              </CmsField>
            </ListItemCard>
          ))}
        </div>
        <AddListItemButton
          label="Adicionar benefício"
          onClick={() => onChange({ ...v, items: [...items, { id: `beneficio-${Date.now()}`, category: '', title: '', description: '' }] })}
        />
      </CmsFormCard>
    </div>
  )
}

export function TimelineForm({ value, onChange, setHelp }) {
  const v = value || {}
  const items = v.items || []
  const meta = CMS_SECTION_META.timeline
  const previewYearsText = (v.previewYears || []).join(', ')

  function updateItem(index, patch) {
    onChange({ ...v, items: items.map((item, i) => (i === index ? { ...item, ...patch } : item)) })
  }

  return (
    <div className="space-y-4">
      <CmsFormCard title="Anos na home" summary="Quais marcos aparecem resumidos na página inicial." help={meta.help} onHelpClick={() => openHelp(setHelp, 'timeline')}>
        <CmsField label="Anos (separados por vírgula)" hint="Ex.: 2010, 2015, 2020, 2023, 2025">
          <input
            type="text"
            className={cmsInputClass}
            value={previewYearsText}
            onChange={(e) => {
              const years = e.target.value
                .split(',')
                .map((y) => parseInt(y.trim(), 10))
                .filter((y) => !Number.isNaN(y))
              onChange({ ...v, previewYears: years })
            }}
          />
        </CmsField>
      </CmsFormCard>

      <CmsFormCard title="Marcos históricos" summary="Linha do tempo completa exibida na home.">
        <div className="space-y-3">
          {items.map((item, index) => (
            <ListItemCard
              key={`${item.year}-${index}`}
              index={index}
              title={item.year ? `${item.year} — ${item.title || 'Sem título'}` : `Marco ${index + 1}`}
              canMoveUp={index > 0}
              canMoveDown={index < items.length - 1}
              onMoveUp={() => onChange({ ...v, items: moveListItem(items, index, -1) })}
              onMoveDown={() => onChange({ ...v, items: moveListItem(items, index, 1) })}
              onRemove={() => onChange({ ...v, items: items.filter((_, i) => i !== index) })}
            >
              <div className="grid sm:grid-cols-3 gap-4">
                <CmsField label="Ano">
                  <input
                    type="number"
                    className={cmsInputClass}
                    value={item.year ?? ''}
                    onChange={(e) => updateItem(index, { year: parseInt(e.target.value, 10) || 0 })}
                  />
                </CmsField>
                <div className="sm:col-span-2">
                  <CmsField label="Título">
                    <input type="text" className={cmsInputClass} value={item.title || ''} onChange={(e) => updateItem(index, { title: e.target.value })} />
                  </CmsField>
                </div>
              </div>
              <CmsField label="Descrição">
                <textarea className={cmsTextareaClass} rows={2} value={item.description || ''} onChange={(e) => updateItem(index, { description: e.target.value })} />
              </CmsField>
            </ListItemCard>
          ))}
        </div>
        <AddListItemButton
          label="Adicionar marco"
          onClick={() => onChange({ ...v, items: [...items, { year: new Date().getFullYear(), title: '', description: '' }] })}
        />
      </CmsFormCard>
    </div>
  )
}

export function MetricsForm({ value, onChange, setHelp }) {
  const v = value || {}
  const items = v.items || []
  const meta = CMS_SECTION_META.metrics

  function updateItem(index, patch) {
    onChange({ ...v, items: items.map((item, i) => (i === index ? { ...item, ...patch } : item)) })
  }

  return (
    <CmsFormCard title="Métricas da home" summary="Números e selos em destaque na página inicial." help={meta.help} onHelpClick={() => openHelp(setHelp, 'metrics')}>
      <div className="space-y-3">
        {items.map((item, index) => {
          const isText = Boolean(item.display)
          return (
            <ListItemCard
              key={index}
              index={index}
              title={item.label || `Métrica ${index + 1}`}
              canMoveUp={index > 0}
              canMoveDown={index < items.length - 1}
              onMoveUp={() => onChange({ ...v, items: moveListItem(items, index, -1) })}
              onMoveDown={() => onChange({ ...v, items: moveListItem(items, index, 1) })}
              onRemove={() => onChange({ ...v, items: items.filter((_, i) => i !== index) })}
            >
              <CmsField label="Tipo de exibição">
                <select
                  className={cmsSelectClass}
                  value={isText ? 'text' : 'number'}
                  onChange={(e) => {
                    if (e.target.value === 'text') {
                      updateItem(index, { display: item.display || 'GPTW', value: undefined, suffix: undefined })
                    } else {
                      updateItem(index, { value: item.value ?? 0, suffix: item.suffix ?? '', display: undefined })
                    }
                  }}
                >
                  <option value="number">Número (ex.: 3500+)</option>
                  <option value="text">Texto fixo (ex.: GPTW)</option>
                </select>
              </CmsField>

              {isText ? (
                <CmsField label="Texto exibido">
                  <input type="text" className={cmsInputClass} value={item.display || ''} onChange={(e) => updateItem(index, { display: e.target.value })} />
                </CmsField>
              ) : (
                <div className="grid sm:grid-cols-2 gap-4">
                  <CmsField label="Valor">
                    <input
                      type="number"
                      className={cmsInputClass}
                      value={item.value ?? ''}
                      onChange={(e) => updateItem(index, { value: parseInt(e.target.value, 10) || 0 })}
                    />
                  </CmsField>
                  <CmsField label="Sufixo" hint="Ex.: + ou %">
                    <input type="text" className={cmsInputClass} value={item.suffix || ''} onChange={(e) => updateItem(index, { suffix: e.target.value })} />
                  </CmsField>
                </div>
              )}

              <CmsField label="Rótulo">
                <input type="text" className={cmsInputClass} value={item.label || ''} onChange={(e) => updateItem(index, { label: e.target.value })} />
              </CmsField>
              <CmsField label="Descrição">
                <input type="text" className={cmsInputClass} value={item.description || ''} onChange={(e) => updateItem(index, { description: e.target.value })} />
              </CmsField>
            </ListItemCard>
          )
        })}
      </div>
      <AddListItemButton
        label="Adicionar métrica"
        onClick={() => onChange({ ...v, items: [...items, { value: 0, suffix: '+', label: '', description: '' }] })}
      />
    </CmsFormCard>
  )
}

export function TestimonialsForm({ value, onChange, setHelp }) {
  const v = value || {}
  const items = v.items || []
  const meta = CMS_SECTION_META.testimonials

  function updateItem(index, patch) {
    onChange({ ...v, items: items.map((item, i) => (i === index ? { ...item, ...patch } : item)) })
  }

  return (
    <CmsFormCard title="Depoimentos" summary="Carrossel de depoimentos na página inicial." help={meta.help} onHelpClick={() => openHelp(setHelp, 'testimonials')}>
      <div className="space-y-3">
        {items.map((item, index) => (
          <ListItemCard
            key={item.id || index}
            index={index}
            title={item.name || `Depoimento ${index + 1}`}
            canMoveUp={index > 0}
            canMoveDown={index < items.length - 1}
            onMoveUp={() => onChange({ ...v, items: moveListItem(items, index, -1) })}
            onMoveDown={() => onChange({ ...v, items: moveListItem(items, index, 1) })}
            onRemove={() => onChange({ ...v, items: items.filter((_, i) => i !== index) })}
          >
            <CmsField label="Depoimento (citação)">
              <textarea className={cmsTextareaClass} rows={3} value={item.quote || ''} onChange={(e) => updateItem(index, { quote: e.target.value })} />
            </CmsField>
            <div className="grid sm:grid-cols-3 gap-4">
              <CmsField label="Nome">
                <input type="text" className={cmsInputClass} value={item.name || ''} onChange={(e) => updateItem(index, { name: e.target.value })} />
              </CmsField>
              <CmsField label="Cargo">
                <input type="text" className={cmsInputClass} value={item.role || ''} onChange={(e) => updateItem(index, { role: e.target.value })} />
              </CmsField>
              <CmsField label="Tempo na empresa">
                <input type="text" className={cmsInputClass} value={item.tenure || ''} onChange={(e) => updateItem(index, { tenure: e.target.value })} placeholder="Ex.: 5 anos na FG" />
              </CmsField>
            </div>
          </ListItemCard>
        ))}
      </div>
      <AddListItemButton
        label="Adicionar depoimento"
        onClick={() => onChange({ ...v, items: [...items, { id: Date.now(), quote: '', name: '', role: '', tenure: '' }] })}
      />
    </CmsFormCard>
  )
}

export function AreasForm({ value, onChange, setHelp }) {
  const v = value || {}
  const items = v.items || []
  const meta = CMS_SECTION_META.areas

  function updateItem(index, patch) {
    onChange({ ...v, items: items.map((item, i) => (i === index ? { ...item, ...patch } : item)) })
  }

  return (
    <div className="space-y-4">
      <CmsFormCard title="Cabeçalho da página" summary="Introdução da página Áreas de Atuação." help={meta.help} onHelpClick={() => openHelp(setHelp, 'areas')}>
        <PageHeaderFields value={v} onChange={onChange} />
      </CmsFormCard>

      <CmsFormCard title="Áreas" summary="Também usadas no formulário do Banco de Talentos.">
        <div className="space-y-3">
          {items.map((item, index) => (
            <ListItemCard
              key={item.id || index}
              index={index}
              title={item.title || `Área ${index + 1}`}
              canMoveUp={index > 0}
              canMoveDown={index < items.length - 1}
              onMoveUp={() => onChange({ ...v, items: moveListItem(items, index, -1) })}
              onMoveDown={() => onChange({ ...v, items: moveListItem(items, index, 1) })}
              onRemove={() => onChange({ ...v, items: items.filter((_, i) => i !== index) })}
            >
              <CmsField label="Nome da área">
                <input
                  type="text"
                  className={cmsInputClass}
                  value={item.title || ''}
                  onChange={(e) => updateItem(index, { title: e.target.value, id: item.id || slugify(e.target.value) })}
                />
              </CmsField>
              <CmsField label="Descrição">
                <textarea className={cmsTextareaClass} rows={2} value={item.description || ''} onChange={(e) => updateItem(index, { description: e.target.value })} />
              </CmsField>
            </ListItemCard>
          ))}
        </div>
        <AddListItemButton
          label="Adicionar área"
          onClick={() => onChange({ ...v, items: [...items, { id: `area-${Date.now()}`, title: '', description: '' }] })}
        />
      </CmsFormCard>
    </div>
  )
}

export function ProcessForm({ value, onChange, setHelp }) {
  const v = value || {}
  const steps = v.steps || []
  const meta = CMS_SECTION_META.process

  function updateStep(index, patch) {
    onChange({ ...v, steps: steps.map((item, i) => (i === index ? { ...item, ...patch } : item)) })
  }

  return (
    <div className="space-y-4">
      <CmsFormCard title="Cabeçalho da página" summary="Introdução da página Processo Seletivo." help={meta.help} onHelpClick={() => openHelp(setHelp, 'process')}>
        <PageHeaderFields value={v} onChange={onChange} />
      </CmsFormCard>

      <CmsFormCard title="Etapas do processo" summary="Passo a passo que o candidato seguirá.">
        <div className="space-y-3">
          {steps.map((step, index) => (
            <ListItemCard
              key={index}
              index={index}
              title={`Etapa ${step.step || index + 1}: ${step.title || 'Sem título'}`}
              canMoveUp={index > 0}
              canMoveDown={index < steps.length - 1}
              onMoveUp={() => onChange({ ...v, steps: moveListItem(steps, index, -1).map((s, i) => ({ ...s, step: i + 1 })) })}
              onMoveDown={() => onChange({ ...v, steps: moveListItem(steps, index, 1).map((s, i) => ({ ...s, step: i + 1 })) })}
              onRemove={() => onChange({ ...v, steps: steps.filter((_, i) => i !== index).map((s, i) => ({ ...s, step: i + 1 })) })}
            >
              <CmsField label="Título da etapa">
                <input type="text" className={cmsInputClass} value={step.title || ''} onChange={(e) => updateStep(index, { title: e.target.value })} />
              </CmsField>
              <CmsField label="Descrição">
                <textarea className={cmsTextareaClass} rows={3} value={step.description || ''} onChange={(e) => updateStep(index, { description: e.target.value })} />
              </CmsField>
            </ListItemCard>
          ))}
        </div>
        <AddListItemButton
          label="Adicionar etapa"
          onClick={() => onChange({ ...v, steps: [...steps, { step: steps.length + 1, title: '', description: '' }] })}
        />
      </CmsFormCard>
    </div>
  )
}

export function FaqForm({ value, onChange, setHelp }) {
  const v = value || {}
  const items = v.items || []
  const meta = CMS_SECTION_META.faq

  function updateItem(index, patch) {
    onChange({ ...v, items: items.map((item, i) => (i === index ? { ...item, ...patch } : item)) })
  }

  return (
    <CmsFormCard title="Perguntas frequentes" summary="FAQ na página Processo Seletivo." help={meta.help} onHelpClick={() => openHelp(setHelp, 'faq')}>
      <div className="space-y-3">
        {items.map((item, index) => (
          <ListItemCard
            key={index}
            index={index}
            title={item.question || `Pergunta ${index + 1}`}
            canMoveUp={index > 0}
            canMoveDown={index < items.length - 1}
            onMoveUp={() => onChange({ ...v, items: moveListItem(items, index, -1) })}
            onMoveDown={() => onChange({ ...v, items: moveListItem(items, index, 1) })}
            onRemove={() => onChange({ ...v, items: items.filter((_, i) => i !== index) })}
          >
            <CmsField label="Pergunta">
              <input type="text" className={cmsInputClass} value={item.question || ''} onChange={(e) => updateItem(index, { question: e.target.value })} />
            </CmsField>
            <CmsField label="Resposta">
              <textarea className={cmsTextareaClass} rows={3} value={item.answer || ''} onChange={(e) => updateItem(index, { answer: e.target.value })} />
            </CmsField>
          </ListItemCard>
        ))}
      </div>
      <AddListItemButton
        label="Adicionar pergunta"
        onClick={() => onChange({ ...v, items: [...items, { question: '', answer: '' }] })}
      />
    </CmsFormCard>
  )
}

export function ClientsForm({ value, onChange, setHelp }) {
  const v = value || {}
  const items = v.items || []
  const meta = CMS_SECTION_META.clients

  function updateItem(index, patch) {
    onChange({ ...v, items: items.map((item, i) => (i === index ? { ...item, ...patch } : item)) })
  }

  return (
    <div className="space-y-4">
      <CmsFormCard title="Seção de clientes" summary="Só aparece na home se houver clientes cadastrados." help={meta.help} onHelpClick={() => openHelp(setHelp, 'clients')}>
        <CmsField label="Título da seção">
          <input type="text" className={cmsInputClass} value={v.title || ''} onChange={(e) => onChange({ ...v, title: e.target.value })} />
        </CmsField>
      </CmsFormCard>

      <CmsFormCard title="Clientes" summary="Nome e logo de cada empresa parceira.">
        <div className="space-y-3">
          {items.map((item, index) => (
            <ListItemCard
              key={item.id || index}
              index={index}
              title={item.name || `Cliente ${index + 1}`}
              canMoveUp={index > 0}
              canMoveDown={index < items.length - 1}
              onMoveUp={() => onChange({ ...v, items: moveListItem(items, index, -1) })}
              onMoveDown={() => onChange({ ...v, items: moveListItem(items, index, 1) })}
              onRemove={() => onChange({ ...v, items: items.filter((_, i) => i !== index) })}
            >
              <CmsField label="Nome da empresa">
                <input
                  type="text"
                  className={cmsInputClass}
                  value={item.name || ''}
                  onChange={(e) => updateItem(index, { name: e.target.value, id: item.id || slugify(e.target.value) })}
                />
              </CmsField>
              <CmsField label="URL do logo" hint="Opcional — link público da imagem">
                <input type="text" className={cmsInputClass} value={item.logoUrl || ''} onChange={(e) => updateItem(index, { logoUrl: e.target.value })} placeholder="https://..." />
              </CmsField>
            </ListItemCard>
          ))}
        </div>
        <AddListItemButton
          label="Adicionar cliente"
          onClick={() => onChange({ ...v, items: [...items, { id: `cliente-${Date.now()}`, name: '', logoUrl: '' }] })}
        />
      </CmsFormCard>
    </div>
  )
}

const FORM_MAP = {
  hero: HeroForm,
  seo: SeoForm,
  footer: FooterForm,
  history: HistoryForm,
  mission: MissionForm,
  values: ValuesForm,
  benefits: BenefitsForm,
  timeline: TimelineForm,
  metrics: MetricsForm,
  testimonials: TestimonialsForm,
  areas: AreasForm,
  process: ProcessForm,
  faq: FaqForm,
  clients: ClientsForm,
}

export function CmsSectionForm({ slug, value, onChange, setHelp }) {
  const Form = FORM_MAP[slug]
  if (!Form) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        Formulário não disponível para esta seção. Entre em contato com o suporte técnico.
      </div>
    )
  }
  return <Form value={value} onChange={onChange} setHelp={setHelp} />
}
