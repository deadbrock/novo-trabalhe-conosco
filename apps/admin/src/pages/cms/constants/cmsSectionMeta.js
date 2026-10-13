/** Textos de ajuda e resumos para cada seção do CMS */
export const CMS_SECTION_META = {
  hero: {
    summary: 'Banner principal no topo da página inicial — título, descrição, botões e vídeo.',
    where: 'Página inicial (topo)',
    help: {
      title: 'Como editar o Hero',
      intro: 'Esta seção é a primeira coisa que o visitante vê ao entrar no portal de carreiras.',
      steps: [
        'Preencha o título e a frase em destaque (parte colorida do título).',
        'Escreva a descrição que aparece abaixo do título.',
        'Configure os dois botões: texto do botão e para onde ele leva (ex.: /vagas).',
        'Informe o caminho do vídeo institucional e o texto de acessibilidade do vídeo.',
        'Clique em **Publicar no portal** para as alterações aparecerem no site.',
      ],
      tips: [
        'Use frases curtas e objetivas no título.',
        'Os links dos botões devem começar com / (ex.: /nossa-cultura, /vagas).',
        'O vídeo deve estar disponível na pasta pública do site (ex.: /fg.mp4).',
      ],
    },
  },
  seo: {
    summary: 'Títulos e descrições que aparecem no Google e ao compartilhar o site.',
    where: 'Todas as páginas do portal',
    help: {
      title: 'Como editar SEO',
      intro: 'Estas informações ajudam o site a aparecer melhor nos buscadores e nas redes sociais.',
      steps: [
        'Defina o nome do site (aparece no título das abas do navegador).',
        'Escreva a descrição padrão — resumo do portal em até 160 caracteres.',
        'Liste palavras-chave separadas por vírgula (opcional).',
        'Publique para aplicar em todo o portal.',
      ],
      tips: [
        'Evite textos muito longos na descrição.',
        'Use palavras que candidatos buscariam: carreiras, vagas, emprego.',
      ],
    },
  },
  footer: {
    summary: 'Rodapé do site com contatos, CNPJ e links legais.',
    where: 'Rodapé de todas as páginas',
    help: {
      title: 'Como editar o Rodapé',
      intro: 'Informações de contato e links que aparecem no final de cada página.',
      steps: [
        'Atualize slogan, razão social, CNPJ, e-mail, telefone e sede.',
        'Configure os textos e links de Política de Privacidade e Termos de Uso.',
        'Publique para atualizar o rodapé em todo o portal.',
      ],
      tips: ['Confira se e-mail e telefone estão corretos antes de publicar.'],
    },
  },
  history: {
    summary: 'Página e blocos sobre a história da empresa.',
    where: 'Página Nossa História + trechos na home',
    help: {
      title: 'Como editar Nossa História',
      intro: 'Conte a trajetória da FG Services em blocos de texto organizados.',
      steps: [
        'Edite o cabeçalho da página (etiqueta, título e descrição).',
        'Preencha os blocos "O Início" e "Crescimento e Conquistas" com título e texto.',
        'Publique para atualizar a página /nossa-historia.',
      ],
      tips: ['Use parágrafos claros; evite blocos de texto muito extensos.'],
    },
  },
  mission: {
    summary: 'Propósito e cabeçalho da página de cultura.',
    where: 'Página Nossa Cultura',
    help: {
      title: 'Como editar Missão e Cultura',
      intro: 'Apresente o propósito da empresa e o cabeçalho da página de cultura.',
      steps: [
        'Configure o cabeçalho da página de cultura.',
        'Escreva o título e texto do propósito da empresa.',
        'Publique para refletir em /nossa-cultura.',
      ],
      tips: ['O propósito deve ser inspirador e alinhado à identidade da FG.'],
    },
  },
  values: {
    summary: 'Lista de valores corporativos exibidos na cultura.',
    where: 'Página Nossa Cultura',
    help: {
      title: 'Como editar Valores',
      intro: 'Cada valor é um card com título e descrição.',
      steps: [
        'Edite o título da seção de valores.',
        'Para cada valor, preencha título e descrição.',
        'Use "Adicionar valor" para incluir novos; "Remover" para excluir.',
        'Publique para atualizar a página de cultura.',
      ],
      tips: ['Mantenha descrições objetivas (2–3 linhas).'],
    },
  },
  benefits: {
    summary: 'Lista de benefícios oferecidos aos colaboradores.',
    where: 'Página Benefícios + preview na home',
    help: {
      title: 'Como editar Benefícios',
      intro: 'Organize benefícios por categoria para candidatos conhecerem o pacote.',
      steps: [
        'Configure o cabeçalho da página de benefícios.',
        'Para cada benefício: categoria, título e descrição.',
        'Adicione ou remova benefícios conforme necessário.',
        'Publique para atualizar /beneficios e a home.',
      ],
      tips: ['Agrupe por categorias como Saúde, Desenvolvimento, Financeiro.'],
    },
  },
  timeline: {
    summary: 'Linha do tempo com marcos históricos da empresa.',
    where: 'Página inicial (timeline)',
    help: {
      title: 'Como editar Timeline',
      intro: 'Marcos importantes da história da FG em ordem cronológica.',
      steps: [
        'Para cada marco: ano, título curto e descrição.',
        'Em "Anos na home", informe quais anos aparecem resumidos na página inicial (separados por vírgula).',
        'Publique para atualizar a timeline na home.',
      ],
      tips: ['Exemplo de anos na home: 2010, 2015, 2020, 2023, 2025'],
    },
  },
  metrics: {
    summary: 'Números de destaque na página inicial (colaboradores, estados, etc.).',
    where: 'Página inicial (métricas)',
    help: {
      title: 'Como editar Métricas',
      intro: 'Cards numéricos ou textuais que destacam conquistas da empresa.',
      steps: [
        'Escolha o tipo: número (ex.: 3500+) ou texto fixo (ex.: GPTW).',
        'Preencha rótulo e descrição curta abaixo.',
        'Publique para atualizar os cards na home.',
      ],
      tips: [
        'Para números, use "Valor" e "Sufixo" (ex.: 3500 e +).',
        'Para selos ou textos especiais, use o modo "Texto fixo".',
      ],
    },
  },
  testimonials: {
    summary: 'Depoimentos de colaboradores em carrossel.',
    where: 'Página inicial (depoimentos)',
    help: {
      title: 'Como editar Depoimentos',
      intro: 'Histórias reais de quem trabalha na FG Services.',
      steps: [
        'Para cada depoimento: citação, nome, cargo e tempo de empresa.',
        'Adicione ou remova depoimentos conforme disponibilidade.',
        'Publique para atualizar o carrossel na home.',
      ],
      tips: ['Peça autorização antes de publicar nomes reais.'],
    },
  },
  areas: {
    summary: 'Áreas de atuação e opções no banco de talentos.',
    where: 'Página Áreas + Banco de Talentos + home',
    help: {
      title: 'Como editar Áreas de Atuação',
      intro: 'Define as áreas disponíveis para candidatos e visitantes.',
      steps: [
        'Configure o cabeçalho da página de áreas.',
        'Para cada área: nome e descrição.',
        'As mesmas áreas aparecem no formulário do Banco de Talentos.',
        'Publique para atualizar /areas e o banco de talentos.',
      ],
      tips: ['Mantenha nomes consistentes com as vagas publicadas.'],
    },
  },
  process: {
    summary: 'Etapas do processo seletivo e FAQ.',
    where: 'Página Processo Seletivo + preview na home',
    help: {
      title: 'Como editar Processo Seletivo',
      intro: 'Explique as etapas que o candidato passará.',
      steps: [
        'Configure o cabeçalho da página.',
        'Para cada etapa: número, título e descrição.',
        'Publique para atualizar /processo-seletivo e a home.',
      ],
      tips: ['Seja claro sobre prazos e o que esperar em cada etapa.'],
    },
  },
  faq: {
    summary: 'Perguntas frequentes sobre recrutamento.',
    where: 'Página Processo Seletivo (FAQ)',
    help: {
      title: 'Como editar FAQ',
      intro: 'Respostas às dúvidas mais comuns dos candidatos.',
      steps: [
        'Para cada item: pergunta e resposta.',
        'Adicione novas perguntas conforme surgirem dúvidas recorrentes.',
        'Publique para atualizar a seção FAQ em /processo-seletivo.',
      ],
      tips: ['Use linguagem simples e direta nas respostas.'],
    },
  },
  clients: {
    summary: 'Logos ou nomes de clientes parceiros.',
    where: 'Página inicial (clientes)',
    help: {
      title: 'Como editar Clientes',
      intro: 'Empresas que confiam na FG Services. A seção só aparece se houver clientes cadastrados.',
      steps: [
        'Defina o título da seção.',
        'Para cada cliente: nome e URL do logo (opcional).',
        'Publique para exibir na home.',
      ],
      tips: [
        'Se não informar logo, apenas o nome será exibido.',
        'Imagens devem estar hospedadas no site ou em URL pública.',
      ],
    },
  },
}

export const CMS_PUBLISH_HELP = {
  title: 'Como publicar alterações',
  intro: 'Suas edições só aparecem no portal depois de publicar.',
  steps: [
    'Edite os campos desejados nos cards abaixo.',
    'Opcional: clique em **Salvar rascunho** para guardar sem publicar.',
    'Quando estiver pronto, clique em **Publicar no portal**.',
    'Aguarde alguns segundos e atualize o site de carreiras para ver as mudanças.',
  ],
  tips: [
    'Rascunho fica salvo apenas no admin — visitantes não veem.',
    'Publicar substitui a versão anterior visível no portal.',
  ],
}
