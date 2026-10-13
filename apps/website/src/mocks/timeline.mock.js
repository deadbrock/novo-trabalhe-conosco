export const timeline = [
  {
    year: 2010,
    title: 'Fundação',
    description: 'Fundação como loja de materiais de limpeza em Igarassu/PE.',
  },
  {
    year: 2012,
    title: 'Distribuição',
    description: 'Início da distribuição de materiais de limpeza.',
  },
  {
    year: 2015,
    title: 'Terceirização',
    description: 'Virada de chave: primeiros contratos de terceirização no setor de atacado.',
  },
  {
    year: 2020,
    title: 'Pandemia',
    description: 'Manutenção de todos os empregos e crescimento de 30% durante a pandemia.',
  },
  {
    year: 2022,
    title: '1.500 colaboradores',
    description: 'Alcançamos a marca de 1.500 colaboradores em nossa operação.',
  },
  {
    year: 2023,
    title: 'Selo GPTW',
    description: 'Conquista do selo GPTW (Great Place to Work) — certificação mantida até hoje.',
  },
  {
    year: 2024,
    title: 'Expansão nacional',
    description: 'Presença em 15 estados e marca de 3.500 colaboradores.',
  },
  {
    year: 2025,
    title: 'Nova sede',
    description: 'Inauguração da nova sede administrativa e consolidação no Nordeste.',
  },
]

export const timelinePreview = timeline.filter((item) =>
  [2010, 2015, 2020, 2023, 2025].includes(item.year),
)
