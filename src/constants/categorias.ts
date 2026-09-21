export interface InfoCategoriaEtapa {
  id: string;
  nome: string;
  numero: string;
  grupo?: string;
  corTexto: string;
  corBg: string;
  corBorda: string;
  corBadge: string;
  corHex: string;
  corBarra: string;
  descricao?: string;
}

export const CATEGORIAS_ETAPAS: InfoCategoriaEtapa[] = [
  {
    id: 'Serviços preliminares',
    nome: 'Serviços preliminares',
    numero: '1',
    corTexto: 'text-amber-900',
    corBg: 'bg-amber-50',
    corBorda: 'border-amber-200',
    corBadge: 'bg-amber-100 text-amber-800 border-amber-300',
    corHex: '#d97706',
    corBarra: 'bg-amber-500',
    descricao: 'Canteiro, tapumes, locação de obra e sondagem'
  },
  {
    id: 'Demolição',
    nome: 'Demolição',
    numero: '2',
    corTexto: 'text-orange-900',
    corBg: 'bg-orange-50',
    corBorda: 'border-orange-200',
    corBadge: 'bg-orange-100 text-orange-800 border-orange-300',
    corHex: '#ea580c',
    corBarra: 'bg-orange-500',
    descricao: 'Demolições manuais e mecânicas, bota-fora'
  },
  {
    id: 'Infraestrutura',
    nome: 'Infraestrutura',
    numero: '3',
    corTexto: 'text-stone-900',
    corBg: 'bg-stone-100',
    corBorda: 'border-stone-300',
    corBadge: 'bg-stone-200 text-stone-800 border-stone-300',
    corHex: '#78716c',
    corBarra: 'bg-stone-500',
    descricao: 'Fundações, estacas, sapatas, baldrames e terraplanagem'
  },
  {
    id: 'Superestrutura',
    nome: 'Superestrutura',
    numero: '4',
    corTexto: 'text-slate-900',
    corBg: 'bg-slate-100',
    corBorda: 'border-slate-300',
    corBadge: 'bg-slate-200 text-slate-800 border-slate-300',
    corHex: '#64748b',
    corBarra: 'bg-slate-500',
    descricao: 'Pilares, vigas, lajes, formas e armações estruturais'
  },
  {
    id: 'Alvenaria',
    nome: 'Alvenaria',
    numero: '5',
    corTexto: 'text-red-900',
    corBg: 'bg-red-50',
    corBorda: 'border-red-200',
    corBadge: 'bg-red-100 text-red-800 border-red-300',
    corHex: '#e11d48',
    corBarra: 'bg-red-500',
    descricao: 'Elevação de alvenaria estrutural e de vedação, vergas'
  },
  {
    id: 'Cobertura',
    nome: 'Cobertura',
    numero: '6',
    corTexto: 'text-yellow-950',
    corBg: 'bg-yellow-50',
    corBorda: 'border-yellow-200',
    corBadge: 'bg-yellow-100 text-yellow-900 border-yellow-300',
    corHex: '#ca8a04',
    corBarra: 'bg-yellow-500',
    descricao: 'Estrutura do telhado, telhas, calhas, rufos e impermeabilização'
  },
  {
    id: 'Instalações',
    nome: 'Instalações (Geral)',
    numero: '7',
    grupo: 'Instalações',
    corTexto: 'text-blue-900',
    corBg: 'bg-blue-50',
    corBorda: 'border-blue-200',
    corBadge: 'bg-blue-100 text-blue-800 border-blue-300',
    corHex: '#2563eb',
    corBarra: 'bg-blue-500',
    descricao: 'Sistemas e redes técnicas gerais da edificação'
  },
  {
    id: 'Instalações elétricas',
    nome: 'Instalações elétricas',
    numero: '7.1',
    grupo: 'Instalações',
    corTexto: 'text-amber-900',
    corBg: 'bg-amber-50/80',
    corBorda: 'border-amber-300',
    corBadge: 'bg-amber-100 text-amber-900 border-amber-300',
    corHex: '#f59e0b',
    corBarra: 'bg-amber-400',
    descricao: 'Eletrodutos, fiação, quadros de distribuição, tomadas e iluminação'
  },
  {
    id: 'Instalações hidráulicas',
    nome: 'Instalações hidráulicas',
    numero: '7.2',
    grupo: 'Instalações',
    corTexto: 'text-cyan-900',
    corBg: 'bg-cyan-50',
    corBorda: 'border-cyan-200',
    corBadge: 'bg-cyan-100 text-cyan-800 border-cyan-300',
    corHex: '#0891b2',
    corBarra: 'bg-cyan-500',
    descricao: 'Tubulações de água fria e quente, barrilete e caixas d\'água'
  },
  {
    id: 'Instalações sanitárias',
    nome: 'Instalações sanitárias',
    numero: '7.3',
    grupo: 'Instalações',
    corTexto: 'text-teal-900',
    corBg: 'bg-teal-50',
    corBorda: 'border-teal-200',
    corBadge: 'bg-teal-100 text-teal-800 border-teal-300',
    corHex: '#0d9488',
    corBarra: 'bg-teal-500',
    descricao: 'Redes de esgoto, ventilação, caixas de gordura e fossas'
  },
  {
    id: 'Instalações complementares',
    nome: 'Instalações complementares',
    numero: '7.4',
    grupo: 'Instalações',
    corTexto: 'text-sky-900',
    corBg: 'bg-sky-50',
    corBorda: 'border-sky-200',
    corBadge: 'bg-sky-100 text-sky-800 border-sky-300',
    corHex: '#0284c7',
    corBarra: 'bg-sky-500',
    descricao: 'Ar condicionado, CFTV, interfonia, cabeamento e combate a incêndio'
  },
  {
    id: 'Revestimentos',
    nome: 'Revestimentos',
    numero: '8',
    corTexto: 'text-emerald-900',
    corBg: 'bg-emerald-50',
    corBorda: 'border-emerald-200',
    corBadge: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    corHex: '#059669',
    corBarra: 'bg-emerald-500',
    descricao: 'Chapisco, emboço, reboco, azulejos e pastilhas'
  },
  {
    id: 'Pintura',
    nome: 'Pintura',
    numero: '9',
    corTexto: 'text-violet-900',
    corBg: 'bg-violet-50',
    corBorda: 'border-violet-200',
    corBadge: 'bg-violet-100 text-violet-800 border-violet-300',
    corHex: '#7c3aed',
    corBarra: 'bg-violet-500',
    descricao: 'Lixamento, massa corrida, selador, tintas e vernizes'
  },
  {
    id: 'Forro',
    nome: 'Forro',
    numero: '10',
    corTexto: 'text-indigo-900',
    corBg: 'bg-indigo-50',
    corBorda: 'border-indigo-200',
    corBadge: 'bg-indigo-100 text-indigo-800 border-indigo-300',
    corHex: '#4f46e5',
    corBarra: 'bg-indigo-500',
    descricao: 'Forro de gesso drywall, madeira, PVC ou mineral'
  },
  {
    id: 'Pisos',
    nome: 'Pisos',
    numero: '11',
    corTexto: 'text-fuchsia-900',
    corBg: 'bg-fuchsia-50',
    corBorda: 'border-fuchsia-200',
    corBadge: 'bg-fuchsia-100 text-fuchsia-800 border-fuchsia-300',
    corHex: '#c026d3',
    corBarra: 'bg-fuchsia-500',
    descricao: 'Contrapiso, porcelanato, cerâmicas, laminados e rodapés'
  },
  {
    id: 'Limpeza',
    nome: 'Limpeza',
    numero: '12',
    corTexto: 'text-green-900',
    corBg: 'bg-green-50',
    corBorda: 'border-green-200',
    corBadge: 'bg-green-100 text-green-800 border-green-300',
    corHex: '#16a34a',
    corBarra: 'bg-green-500',
    descricao: 'Limpeza pós-obra, remoção de resíduos e entrega final'
  }
];

export function getInfoCategoria(categoriaOuId?: string): InfoCategoriaEtapa {
  if (!categoriaOuId) {
    return {
      id: 'Outros',
      nome: 'Outros',
      numero: '—',
      corTexto: 'text-slate-700',
      corBg: 'bg-slate-100',
      corBorda: 'border-slate-200',
      corBadge: 'bg-slate-100 text-slate-700 border-slate-300',
      corHex: '#94a3b8',
      corBarra: 'bg-slate-400',
      descricao: 'Etapa sem categoria definida'
    };
  }

  const normalizado = categoriaOuId.toLowerCase().trim();

  // Busca exata ou por id
  const encontrada = CATEGORIAS_ETAPAS.find(c => 
    c.id.toLowerCase() === normalizado || 
    c.nome.toLowerCase() === normalizado ||
    c.numero === normalizado
  );
  if (encontrada) return encontrada;

  // Busca parcial
  const parcial = CATEGORIAS_ETAPAS.find(c => 
    normalizado.includes(c.id.toLowerCase()) || 
    c.id.toLowerCase().includes(normalizado)
  );
  if (parcial) return parcial;

  // Compatibilidade com possíveis variações como "Infraestutura"
  if (normalizado.includes('infra')) {
    return CATEGORIAS_ETAPAS.find(c => c.id === 'Infraestrutura')!;
  }
  if (normalizado.includes('super')) {
    return CATEGORIAS_ETAPAS.find(c => c.id === 'Superestrutura')!;
  }
  if (normalizado.includes('hidraul')) {
    return CATEGORIAS_ETAPAS.find(c => c.id === 'Instalações hidráulicas')!;
  }
  if (normalizado.includes('eletric')) {
    return CATEGORIAS_ETAPAS.find(c => c.id === 'Instalações elétricas')!;
  }
  if (normalizado.includes('sanitar')) {
    return CATEGORIAS_ETAPAS.find(c => c.id === 'Instalações sanitárias')!;
  }

  return {
    id: categoriaOuId,
    nome: categoriaOuId,
    numero: '•',
    corTexto: 'text-slate-700',
    corBg: 'bg-slate-100',
    corBorda: 'border-slate-200',
    corBadge: 'bg-slate-100 text-slate-700 border-slate-300',
    corHex: '#64748b',
    corBarra: 'bg-slate-400'
  };
}

export function sugerirCategoriaPorTitulo(titulo: string): string {
  const t = (titulo || '').toLowerCase();
  if (t.includes('demoli') || t.includes('bota-fora') || t.includes('quebra-quebra') || t.includes('remoção')) return 'Demolição';
  if (t.includes('fundação') || t.includes('fundacao') || t.includes('estaca') || t.includes('sapata') || t.includes('terraplan') || t.includes('escava') || t.includes('baldrame') || t.includes('infra')) return 'Infraestrutura';
  if (t.includes('superestrutura') || t.includes('pilar') || t.includes('viga') || t.includes('laje') || t.includes('forma') || t.includes('escoramento')) return 'Superestrutura';
  if (t.includes('alvenaria') || t.includes('bloco') || t.includes('tijolo') || t.includes('muro') || t.includes('fiada') || t.includes('graute')) return 'Alvenaria';
  if (t.includes('cobertura') || t.includes('telhado') || t.includes('telha') || t.includes('calha') || t.includes('rufo') || t.includes('impermeabil')) return 'Cobertura';
  if (t.includes('elétric') || t.includes('eletric') || t.includes('fiação') || t.includes('quadro de força') || t.includes('tomada') || t.includes('ilumina')) return 'Instalações elétricas';
  if (t.includes('hidrául') || t.includes('hidraul') || t.includes('água fria') || t.includes('água quente') || t.includes('encanamento') || t.includes('barrilete')) return 'Instalações hidráulicas';
  if (t.includes('sanitár') || t.includes('sanitar') || t.includes('esgoto') || t.includes('ralo') || t.includes('caixa de gordura') || t.includes('fossa')) return 'Instalações sanitárias';
  if (t.includes('ar condicionado') || t.includes('cftv') || t.includes('alarme') || t.includes('gás') || t.includes('interfone') || t.includes('automação')) return 'Instalações complementares';
  if (t.includes('instalaç') || t.includes('instalac')) return 'Instalações';
  if (t.includes('revest') || t.includes('reboco') || t.includes('emboço') || t.includes('chapisco') || t.includes('azulejo') || t.includes('pastilha') || t.includes('gesso liso')) return 'Revestimentos';
  if (t.includes('pintura') || t.includes('tinta') || t.includes('massa corrida') || t.includes('selador') || t.includes('verniz') || t.includes('emassamento')) return 'Pintura';
  if (t.includes('forro') || t.includes('drywall') || t.includes('gesso acartonado') || t.includes('sanca')) return 'Forro';
  if (t.includes('piso') || t.includes('porcelanato') || t.includes('cerâmica') || t.includes('contrapiso') || t.includes('rodapé') || t.includes('vinílico') || t.includes('laminado')) return 'Pisos';
  if (t.includes('limpeza') || t.includes('faxina') || t.includes('entrega da obra') || t.includes('lavagem')) return 'Limpeza';
  if (t.includes('preliminar') || t.includes('canteiro') || t.includes('tapume') || t.includes('locação') || t.includes('gabarito') || t.includes('sondagem') || t.includes('provisóri')) return 'Serviços preliminares';
  return 'Serviços preliminares';
}
