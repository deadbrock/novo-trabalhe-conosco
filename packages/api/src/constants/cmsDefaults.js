/** Conteúdo padrão publicado — espelha mocks/constants do website */
export const CMS_DEFAULT_PAYLOADS = {
  hero: {
    badge: 'Carreiras · FG Services',
    title: 'Construa sua carreira em uma empresa que valoriza excelência',
    titleHighlight: 'valoriza excelência',
    description:
      'A FG Services é referência nacional em terceirização de serviços, com presença em 15 estados e mais de 3.500 colaboradores. Certificada GPTW, unimos cuidado com pessoas, rigor operacional e crescimento sustentável. Descubra nossa cultura, nossos benefícios e o ambiente onde profissionais de alto calibre crescem de verdade.',
    primaryCta: { label: 'Conheça nossa cultura', href: '/nossa-cultura' },
    secondaryCta: { label: 'Ver vagas abertas', href: '/vagas' },
    videoSrc: '/fg.mp4',
    videoLabel: 'Vídeo institucional FG Services',
  },
  seo: {
    siteName: 'FG Services Carreiras',
    defaultTitle: 'FG Services Carreiras',
    defaultDescription:
      'Construa sua carreira na FG Services — excelência em terceirização, cultura GPTW e oportunidades em todo o Brasil.',
    defaultKeywords: 'FG Services, carreiras, vagas, terceirização, emprego',
  },
  footer: {
    tagline: 'Excelência em terceirização. Pessoas que fazem a diferença.',
    legalName: 'FG Services Ltda.',
    cnpj: '00.000.000/0001-00',
    email: 'carreiras@fgservices.com.br',
    phone: '+55 (81) 3000-0000',
    headquarters: 'Igarassu, PE',
    privacyLabel: 'Política de Privacidade',
    privacyHref: '/',
    termsLabel: 'Termos de Uso',
    termsHref: '/',
  },
  history: {
    intro: {
      title: 'O Início',
      text: 'A FG Services nasceu em 2010 como uma pequena loja de materiais de limpeza em Igarassu/PE. Dois anos depois, tornou-se distribuidora e, em 2015, deu o grande passo rumo à terceirização de serviços, conquistando seus primeiros contratos no setor de atacado. Desde então, a empresa viveu um crescimento constante e sustentável, expandindo suas operações para diferentes estados e segmentos.',
    },
    growth: {
      title: 'Crescimento e Conquistas',
      text: 'Durante a pandemia de 2020, a FG manteve sua essência de cuidado e compromisso, garantindo todos os empregos e crescendo mais de 30%. Em 2023, conquistou o selo GPTW (Great Place to Work), certificação internacional que reconhece a empresa como um excelente lugar para trabalhar — marca que mantém até hoje. Em 2024, alcançamos mais de 3.500 colaboradores espalhados em 15 estados brasileiros, e em 2025 inauguramos nossa nova sede administrativa, consolidando nossa presença como referência nacional em terceirização.',
    },
    pageHeader: {
      badge: 'Nossa História',
      title: 'Uma trajetória de crescimento e propósito',
      description: 'De uma loja local a referência nacional em terceirização — conheça os marcos que moldaram a FG Services.',
    },
  },
  mission: {
    purposeTitle: 'Nosso propósito',
    purposeText:
      'Elevar o padrão de serviços corporativos no Brasil, criando valor para clientes e oportunidades significativas de crescimento para nossos colaboradores.',
    pageHeader: {
      badge: 'Nossa Cultura',
      title: 'Cultura vivida, não apenas declarada',
      description:
        'Acreditamos que ambientes de alta performance são construídos com confiança, transparência e investimento real nas pessoas.',
    },
  },
  values: {
    title: 'Nossos valores',
    items: [
      { id: 'excelencia', title: 'Excelência', description: 'Buscamos o mais alto padrão em cada entrega, com rigor técnico e atenção aos detalhes.' },
      { id: 'integridade', title: 'Integridade', description: 'Agimos com transparência, ética e responsabilidade em todas as relações.' },
      { id: 'inovacao', title: 'Inovação', description: 'Questionamos o status quo e evoluímos continuamente nossos processos e soluções.' },
      { id: 'pessoas', title: 'Pessoas em primeiro lugar', description: 'Investimos no desenvolvimento, bem-estar e crescimento de cada colaborador.' },
    ],
  },
  benefits: {
    pageHeader: {
      badge: 'Benefícios',
      title: 'Pacote completo para sua jornada',
      description: 'Cuidamos das pessoas com benefícios competitivos e programas de desenvolvimento contínuo.',
    },
    items: [
      { id: 'saude', category: 'Saúde & Bem-estar', title: 'Plano de saúde (EXEMPLO)', description: 'Exemplo de descrição de um benefício.' },
      { id: 'reconhecimento', category: 'Reconhecimento', title: 'Programa de meritocracia', description: 'Avaliações estruturadas, feedback contínuo e plano de carreira transparente.' },
      { id: 'financeiro', category: 'Financeiro', title: 'Benefícios flexíveis', description: 'Vale-refeição, vale-transporte, seguro de vida e previdência privada.' },
    ],
  },
  timeline: {
    items: [
      { year: 2010, title: 'Fundação', description: 'Fundação como loja de materiais de limpeza em Igarassu/PE.' },
      { year: 2012, title: 'Distribuição', description: 'Início da distribuição de materiais de limpeza.' },
      { year: 2015, title: 'Terceirização', description: 'Virada de chave: primeiros contratos de terceirização no setor de atacado.' },
      { year: 2020, title: 'Pandemia', description: 'Manutenção de todos os empregos e crescimento de 30% durante a pandemia.' },
      { year: 2022, title: '1.500 colaboradores', description: 'Alcançamos a marca de 1.500 colaboradores em nossa operação.' },
      { year: 2023, title: 'Selo GPTW', description: 'Conquista do selo GPTW (Great Place to Work) — certificação mantida até hoje.' },
      { year: 2024, title: 'Expansão nacional', description: 'Presença em 15 estados e marca de 3.500 colaboradores.' },
      { year: 2025, title: 'Nova sede', description: 'Inauguração da nova sede administrativa e consolidação nacional.' },
    ],
    previewYears: [2010, 2015, 2020, 2023, 2025],
  },
  metrics: {
    items: [
      { value: 3500, suffix: '+', label: 'Colaboradores', description: 'Profissionais espalhados pelo Brasil' },
      { value: 15, suffix: '', label: 'Estados', description: 'Atuação em 15 estados brasileiros' },
      { display: 'GPTW', label: 'Great Place to Work', description: 'Certificação internacional desde 2023' },
      { value: 30, suffix: '%', label: 'Crescimento', description: 'Crescimento durante a pandemia de 2020' },
    ],
  },
  testimonials: {
    items: [
      { id: 1, quote: 'Exemplo de depoimento.', name: 'Exemplo', role: 'Coordenadora de Operações', tenure: '5 anos na FG' },
      { id: 2, quote: 'Exemplo de depoimento.', name: 'Exemplo', role: 'Exemplo', tenure: '3 anos na FG' },
      { id: 3, quote: 'Exemplo de depoimento.', name: 'Exemplo', role: 'Coordenador de DP', tenure: '7 anos na FG' },
    ],
  },
  areas: {
    pageHeader: {
      badge: 'Áreas de Atuação',
      title: 'Oportunidades em diversas frentes',
      description: 'Encontre a área que combina com seu perfil e construa sua trajetória na FG Services.',
    },
    items: [
      { id: 'operacoes', title: 'Operações', description: 'Gestão de facilities, logística e processos operacionais.' },
      { id: 'comercial', title: 'Comercial', description: 'Relacionamento com clientes, novos negócios e expansão de mercado.' },
      { id: 'gente-gestao', title: 'Gente & Gestão', description: 'Atração de talentos, desenvolvimento organizacional e cultura.' },
      { id: 'tecnologia', title: 'Tecnologia', description: 'Desenvolvimento, infraestrutura e inovação digital.' },
      { id: 'facilities', title: 'Facilities', description: 'Manutenção predial, serviços gerais e suporte operacional.' },
    ],
  },
  process: {
    pageHeader: {
      badge: 'Processo Seletivo',
      title: 'Um processo desenhado para respeitar você',
      description: 'Clareza em cada etapa, comunicação constante e avaliação justa de competências e fit cultural.',
    },
    steps: [
      { step: 1, title: 'Inscrição', description: 'Envie seu currículo pela plataforma ou banco de talentos. Análise em até 5 dias úteis.' },
      { step: 2, title: 'Triagem', description: 'Nossa equipe de Gente & Gestão avalia perfil, experiência e aderência cultural.' },
      { step: 3, title: 'Entrevistas', description: 'Conversas com RH e gestor da área. Processo estruturado e feedback em cada etapa.' },
      { step: 4, title: 'Proposta', description: 'Apresentação de proposta formal, negociação transparente e onboarding planejado.' },
    ],
  },
  faq: {
    items: [
      { question: 'Quanto tempo leva o processo seletivo?', answer: 'Em média, de 2 a 4 semanas, dependendo da senioridade e número de etapas da vaga.' },
      { question: 'Receberei feedback se não for selecionado?', answer: 'Sim. Acreditamos em transparência e enviamos retorno construtivo sempre que possível.' },
      { question: 'Posso me candidatar a mais de uma vaga?', answer: 'Sim, desde que seu perfil seja compatível. Recomendamos priorizar as mais alinhadas.' },
    ],
  },
  clients: {
    title: 'Empresas que confiam na FG Services',
    items: [],
  },
}

export const CMS_SECTION_SLUGS = Object.keys(CMS_DEFAULT_PAYLOADS)
