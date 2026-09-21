import React, { useState, useMemo, useEffect, useRef } from 'react';
import { AppState, generateId } from '../store';
import { Tarefa, SubTarefa, TarefaStatus } from '../types';
import {
  CheckCircle2,
  Circle,
  Clock,
  Pencil,
  Trash2,
  Plus,
  X,
  CheckSquare,
  Square,
  ListChecks,
  AlertTriangle,
  CalendarCheck,
  Receipt,
  ChevronDown,
  ChevronUp,
  ChevronsDownUp,
  ChevronsUpDown,
  Camera,
  Wallet,
  Undo2,
  Play,
  Calendar,
  BellRing,
  CalendarClock,
  Check,
  Tag,
  Filter,
  Search,
  Sparkles,
  Layers,
  Coins,
  AlertCircle
} from 'lucide-react';
import { ImageUploader } from './ImageUploader';
import { ModalConfirmacaoCiente } from './ModalConfirmacaoCiente';
import { calcularDuracaoDias, formatarDataBR, obterAlertaInicio, InfoAlertaInicio } from '../utils';
import { extrairItensDespesa, calcularResumoOrcamentoTarefa, somarOrcamentoSubtarefas, validarOrcamentoTarefaSubtarefas } from '../utils/orcamento';
import { CATEGORIAS_ETAPAS, getInfoCategoria, sugerirCategoriaPorTitulo } from '../constants/categorias';

interface CronogramaProps {
  state: AppState;
  filtroInicial?: string;
  onUpdateTarefa: (id: string, updates: Partial<Tarefa>) => void;
  onAddTarefa: (tarefa: Tarefa) => void;
  onDeleteTarefa: (id: string) => void;
  onConfirmarInicioTarefa?: (id: string, dataInicioReal?: string) => void;
  onDesfazerInicioTarefa?: (id: string) => void;
  onConfirmarInicioSubtarefa?: (tarefaId: string, subtarefaId: string, dataInicioReal?: string) => void;
  onDesfazerInicioSubtarefa?: (tarefaId: string, subtarefaId: string) => void;
}

interface ModalConfirmacaoData {
  isOpen: boolean;
  titulo: string;
  subtitulo?: string;
  descricao: React.ReactNode;
  labelBotao: string;
  tipo?: 'danger' | 'warning';
  icone?: 'trash' | 'undo' | 'alert';
  onConfirm: () => void;
}

interface SubtarefaDraft {
  id: string;
  titulo: string;
  categoria?: string;
  dataInicioPrevista: string;
  dataFimPrevista: string;
  duracaoDias: number;
  orcamentoPrevisto?: number;
}

export function Cronograma({
  state,
  filtroInicial,
  onUpdateTarefa,
  onAddTarefa,
  onDeleteTarefa,
  onConfirmarInicioTarefa,
  onDesfazerInicioTarefa,
  onConfirmarInicioSubtarefa,
  onDesfazerInicioSubtarefa
}: CronogramaProps) {
  const [showNovaTarefa, setShowNovaTarefa] = useState(false);

  // Filtro de Categorias (Lista Suspensa Multi-Seleção)
  const [categoriasFiltro, setCategoriasFiltro] = useState<string[]>(() => {
    return filtroInicial && filtroInicial !== 'TODAS' ? [filtroInicial] : [];
  });
  const [dropdownCategoriasAberto, setDropdownCategoriasAberto] = useState(false);
  const [buscaCategoriaDropdown, setBuscaCategoriaDropdown] = useState('');
  const dropdownCategoriasRef = useRef<HTMLDivElement>(null);

  // Filtros de Pesquisa, Status e Subtarefas
  const [buscaFiltro, setBuscaFiltro] = useState<string>('');
  const [filtroStatus, setFiltroStatus] = useState<'TODOS' | 'PENDENTE' | 'EM_ANDAMENTO' | 'CONCLUIDA' | 'ATRASADA'>('TODOS');
  const [filtroSubtarefas, setFiltroSubtarefas] = useState<'TODAS' | 'COM_SUBS' | 'SEM_SUBS' | 'SUBS_CONCLUIDAS' | 'SUBS_PENDENTES'>('TODAS');

  // Sincronizar quando filtroInicial mudar externamente (ex: vindo do Dashboard)
  useEffect(() => {
    if (filtroInicial) {
      if (filtroInicial === 'TODAS') {
        setCategoriasFiltro([]);
      } else {
        setCategoriasFiltro([filtroInicial]);
      }
    }
  }, [filtroInicial]);

  // Fechar dropdown de categorias ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownCategoriasRef.current && !dropdownCategoriasRef.current.contains(event.target as Node)) {
        setDropdownCategoriasAberto(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const [tarefaSelecionadaCheckin, setTarefaSelecionadaCheckin] = useState<string | null>(null);
  const [fotoCheckin, setFotoCheckin] = useState('');
  const [dataCheckin, setDataCheckin] = useState(new Date().toISOString().split('T')[0]);

  // Estados para confirmação de início de tarefa
  const [modalIniciarTarefa, setModalIniciarTarefa] = useState<{
    tarefa: Tarefa;
    dataInicioReal: string;
  } | null>(null);

  // Estados para edição
  const [tarefaEmEdicao, setTarefaEmEdicao] = useState<Tarefa | null>(null);
  const [modalConfirmacao, setModalConfirmacao] = useState<ModalConfirmacaoData | null>(null);

  // Estados para check de subtarefa com foto
  const [subtarefaParaCheckin, setSubtarefaParaCheckin] = useState<{
    tarefa: Tarefa;
    subtarefa: SubTarefa;
    dataConclusao: string;
    foto: string;
  } | null>(null);

  // Estados para edição individual de subtarefa (com fotos)
  const [subtarefaEmEdicao, setSubtarefaEmEdicao] = useState<{
    tarefa: Tarefa;
    subtarefa: SubTarefa;
    titulo: string;
    categoria?: string;
    orcamentoPrevisto?: number;
    concluida: boolean;
    dataConclusao?: string;
    fotosExecucao: string[];
  } | null>(null);

  // Estado para visualização ampliada de foto (lightbox)
  const [fotoVisualizacao, setFotoVisualizacao] = useState<{
    url: string;
    titulo?: string;
  } | null>(null);

  // Estados para input rápido de sub-tarefa por tarefa
  const [novaSubtarefaPorId, setNovaSubtarefaPorId] = useState<{ [tarefaId: string]: string }>({});

  // Estado para expandir detalhamento de despesas por tarefa
  const [despesasExpandidas, setDespesasExpandidas] = useState<{ [tarefaId: string]: boolean }>({});

  const toggleDespesasTarefa = (tarefaId: string) => {
    setDespesasExpandidas(prev => ({ ...prev, [tarefaId]: !prev[tarefaId] }));
  };

  // Estado para colapsar/expandir tarefas para visualização compacta
  const [tarefasColapsadas, setTarefasColapsadas] = useState<{ [tarefaId: string]: boolean }>({});
  const [todasColapsadas, setTodasColapsadas] = useState(true);

  const isTarefaColapsada = (tarefaId: string) => {
    if (tarefasColapsadas[tarefaId] !== undefined) {
      return tarefasColapsadas[tarefaId];
    }
    return todasColapsadas;
  };

  const toggleColapsarTarefa = (tarefaId: string) => {
    setTarefasColapsadas(prev => {
      const atual = prev[tarefaId] !== undefined ? prev[tarefaId] : todasColapsadas;
      return { ...prev, [tarefaId]: !atual };
    });
  };

  const handleColapsarTodas = () => {
    setTodasColapsadas(true);
    const novo: { [id: string]: boolean } = {};
    tarefas.forEach(t => { novo[t.id] = true; });
    setTarefasColapsadas(novo);
  };

  const handleExpandirTodas = () => {
    setTodasColapsadas(false);
    const novo: { [id: string]: boolean } = {};
    tarefas.forEach(t => { novo[t.id] = false; });
    setTarefasColapsadas(novo);
  };

  const obraId = state.obraAtivaId;
  if (!obraId) return null;

  const tarefas = [...state.tarefas.filter(t => t.obraId === obraId)].sort((a, b) =>
    new Date(a.dataFimPrevista).getTime() - new Date(b.dataFimPrevista).getTime()
  );

  const comprasDaObra = state.compras.filter(c => c.obraId === obraId);
  const itensCalculadosDaObra = useMemo(() => extrairItensDespesa(comprasDaObra), [comprasDaObra]);

  // Nova Tarefa State
  const hojeStr = new Date().toISOString().split('T')[0];
  const fimSugeridoStr = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];

  const [titulo, setTitulo] = useState('');
  const [categoriaNova, setCategoriaNova] = useState<string>('Serviços preliminares');
  const [categoriaEditadaManualmente, setCategoriaEditadaManualmente] = useState(false);
  const [dataInicioNova, setDataInicioNova] = useState(hojeStr);
  const [dataFimNova, setDataFimNova] = useState(fimSugeridoStr);
  const [orcamentoPrevistoNova, setOrcamentoPrevistoNova] = useState('');
  const [subtarefasNova, setSubtarefasNova] = useState<SubtarefaDraft[]>([]);
  const [inputSubtarefaNova, setInputSubtarefaNova] = useState('');
  const [subCategoriaNova, setSubCategoriaNova] = useState<string>('');
  const [subOrcamentoNova, setSubOrcamentoNova] = useState('');
  const [subDataInicioNova, setSubDataInicioNova] = useState(hojeStr);
  const [subDataFimNova, setSubDataFimNova] = useState(fimSugeridoStr);

  // Duração calculada em tempo real para a nova tarefa
  const duracaoCalculadaNova = calcularDuracaoDias(dataInicioNova, dataFimNova);

  // Mapa de resumos de orçamento por tarefa
  const orcamentosTarefasMap = useMemo(() => {
    const map = new Map<string, ReturnType<typeof calcularResumoOrcamentoTarefa>>();
    tarefas.forEach(t => {
      map.set(t.id, calcularResumoOrcamentoTarefa(t, itensCalculadosDaObra));
    });
    return map;
  }, [tarefas, itensCalculadosDaObra]);

  // Contagem de tarefas por categoria para o filtro
  const contagemPorCategoria = useMemo(() => {
    const counts: { [cat: string]: number } = {};
    tarefas.forEach(t => {
      const cat = t.categoria || sugerirCategoriaPorTitulo(t.titulo);
      counts[cat] = (counts[cat] || 0) + 1;
      // Se for subcategoria de Instalações, contabilizar também no grupo geral 7. Instalações
      if (cat.startsWith('Instalações') && cat !== 'Instalações') {
        counts['Instalações'] = (counts['Instalações'] || 0) + 1;
      }
    });
    return counts;
  }, [tarefas]);

  // Contagem de status para filtros rápidos
  const contagemStatus = useMemo(() => {
    const hoje = new Date().toISOString().split('T')[0];
    let concluidas = 0;
    let emAndamento = 0;
    let pendentes = 0;
    let atrasadas = 0;
    let comSubs = 0;
    let semSubs = 0;

    tarefas.forEach(t => {
      const isConcluida = t.status === 'CONCLUIDA';
      const isAtrasada = !isConcluida && (t.status === 'ATRASADA' || (t.dataFimPrevista && t.dataFimPrevista < hoje));
      if (isConcluida) {
        concluidas++;
      } else if (isAtrasada) {
        atrasadas++;
        if (t.iniciada) emAndamento++;
        else pendentes++;
      } else if (t.iniciada) {
        emAndamento++;
      } else {
        pendentes++;
      }

      if ((t.subtarefas?.length || 0) > 0) {
        comSubs++;
      } else {
        semSubs++;
      }
    });

    return { concluidas, emAndamento, pendentes, atrasadas, comSubs, semSubs };
  }, [tarefas]);

  // Categorias filtradas na busca interna da lista suspensa
  const categoriasFiltradasNoDropdown = useMemo(() => {
    if (!buscaCategoriaDropdown.trim()) return CATEGORIAS_ETAPAS;
    const q = buscaCategoriaDropdown.toLowerCase().trim();
    return CATEGORIAS_ETAPAS.filter(c =>
      c.nome.toLowerCase().includes(q) ||
      c.numero.includes(q) ||
      (c.descricao && c.descricao.toLowerCase().includes(q))
    );
  }, [buscaCategoriaDropdown]);

  // Lista filtrada de tarefas com busca por nome, subtarefas, status e múltiplas categorias
  const tarefasFiltradas = useMemo(() => {
    const hoje = new Date().toISOString().split('T')[0];
    const q = buscaFiltro.toLowerCase().trim();

    return tarefas.filter(t => {
      const catTarefa = t.categoria || sugerirCategoriaPorTitulo(t.titulo);
      const isConcluida = t.status === 'CONCLUIDA';
      const isAtrasada = !isConcluida && (t.status === 'ATRASADA' || (t.dataFimPrevista && t.dataFimPrevista < hoje));
      const isIniciada = t.iniciada && !isConcluida;
      const isPendente = !t.iniciada && !isConcluida;
      const totalSubs = t.subtarefas?.length || 0;
      const concluidasSubs = t.subtarefas?.filter(s => s.concluida).length || 0;
      const subsTodasConcluidas = totalSubs > 0 && concluidasSubs === totalSubs;
      const subsTemPendentes = totalSubs > 0 && concluidasSubs < totalSubs;

      // 1. Filtro por Categorias (Lista Suspensa Multi-Seleção)
      if (categoriasFiltro.length > 0) {
        const matchTarefa = categoriasFiltro.some(catSel =>
          catSel === 'Instalações' ? catTarefa.startsWith('Instalações') : catTarefa === catSel
        );
        const matchSub = (t.subtarefas || []).some(st => {
          const catSub = st.categoria || catTarefa;
          return categoriasFiltro.some(catSel =>
            catSel === 'Instalações' ? catSub.startsWith('Instalações') : catSub === catSel
          );
        });
        if (!matchTarefa && !matchSub) return false;
      }

      // 2. Filtro por Status de Conclusão
      if (filtroStatus === 'CONCLUIDA' && !isConcluida) return false;
      if (filtroStatus === 'EM_ANDAMENTO' && !isIniciada) return false;
      if (filtroStatus === 'PENDENTE' && !isPendente) return false;
      if (filtroStatus === 'ATRASADA' && !isAtrasada) return false;

      // 3. Filtro por Subtarefas
      if (filtroSubtarefas === 'COM_SUBS' && totalSubs === 0) return false;
      if (filtroSubtarefas === 'SEM_SUBS' && totalSubs > 0) return false;
      if (filtroSubtarefas === 'SUBS_CONCLUIDAS' && !subsTodasConcluidas) return false;
      if (filtroSubtarefas === 'SUBS_PENDENTES' && !subsTemPendentes) return false;

      // 4. Busca Textual Rápida (Nome, Subtarefas ou Palavras-chave de Status)
      if (q) {
        const infoCat = getInfoCategoria(catTarefa);
        const matchNome = t.titulo.toLowerCase().includes(q);
        const matchCat = catTarefa.toLowerCase().includes(q) || infoCat.nome.toLowerCase().includes(q);
        const matchSubs = (t.subtarefas || []).some(st => st.titulo.toLowerCase().includes(q));

        // Reconhecer termos comuns de status digitados na barra de pesquisa
        const matchStatusTexto =
          ((q.includes('concl') || q === 'feita' || q === 'pronta') && isConcluida) ||
          ((q.includes('pend') || q === 'a fazer' || q === 'nao iniciada' || q === 'não iniciada') && isPendente) ||
          ((q.includes('anda') || q.includes('inic') || q === 'em progresso') && isIniciada) ||
          ((q.includes('atra') || q === 'vencida') && isAtrasada) ||
          ((q.includes('subtarefa') || q.includes('sub-tarefa') || q === 'subs') && totalSubs > 0);

        if (!matchNome && !matchCat && !matchSubs && !matchStatusTexto) return false;
      }

      return true;
    });
  }, [tarefas, categoriasFiltro, filtroStatus, filtroSubtarefas, buscaFiltro]);

  const handleAdicionarSubtarefaNova = () => {
    if (!inputSubtarefaNova.trim()) return;
    const duracaoSub = calcularDuracaoDias(subDataInicioNova, subDataFimNova);
    const catSub = subCategoriaNova || categoriaNova || sugerirCategoriaPorTitulo(inputSubtarefaNova.trim());
    const orcSub = parseFloat(subOrcamentoNova) > 0 ? parseFloat(subOrcamentoNova) : undefined;
    const novaSubItem: SubTarefa = {
      id: generateId(),
      titulo: inputSubtarefaNova.trim(),
      categoria: catSub,
      dataInicioPrevista: subDataInicioNova,
      dataFimPrevista: subDataFimNova,
      duracaoDias: duracaoSub,
      concluida: false,
      iniciada: false,
      orcamentoPrevisto: orcSub
    };

    const novasSubtarefas = [...subtarefasNova, novaSubItem];
    setSubtarefasNova(novasSubtarefas);

    // Se o orçamento da etapa for menor que o somatório das subtarefas com o novo item, ajusta automaticamente
    if (orcSub && orcSub > 0) {
      const somaAtual = somarOrcamentoSubtarefas(novasSubtarefas);
      const orcAtual = parseFloat(orcamentoPrevistoNova) || 0;
      if (orcAtual < somaAtual) {
        setOrcamentoPrevistoNova(somaAtual.toFixed(2));
      }
    }

    setInputSubtarefaNova('');
    setSubOrcamentoNova('');
  };

  const handleRemoverSubtarefaNova = (index: number) => {
    setSubtarefasNova(prev => prev.filter((_, i) => i !== index));
  };

  const handleNovaTarefa = (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim()) return;

    const duracaoFinal = calcularDuracaoDias(dataInicioNova, dataFimNova);
    const categoriaFinal = categoriaNova || sugerirCategoriaPorTitulo(titulo.trim());
    const orcTarefa = parseFloat(orcamentoPrevistoNova) > 0 ? parseFloat(orcamentoPrevistoNova) : undefined;

    const subTarefasObj: SubTarefa[] = subtarefasNova.map(sub => ({
      id: sub.id || generateId(),
      titulo: sub.titulo,
      categoria: sub.categoria || categoriaFinal,
      dataInicioPrevista: sub.dataInicioPrevista || dataInicioNova,
      dataFimPrevista: sub.dataFimPrevista || dataFimNova,
      duracaoDias: sub.duracaoDias || duracaoFinal,
      concluida: false,
      iniciada: false,
      orcamentoPrevisto: sub.orcamentoPrevisto
    }));

    // O orçamento previsto da tarefa não pode ser menor que o somatório dos orçamentos das suas subtarefas
    const somaSubsNova = somarOrcamentoSubtarefas(subTarefasObj);
    let orcTarefaFinal = orcTarefa;
    if (somaSubsNova > 0 && (orcTarefa === undefined || orcTarefa < somaSubsNova)) {
      orcTarefaFinal = somaSubsNova;
    }

    onAddTarefa({
      id: generateId(),
      obraId,
      titulo: titulo.trim(),
      categoria: categoriaFinal,
      dataInicioPrevista: dataInicioNova,
      dataFimPrevista: dataFimNova,
      duracaoDias: duracaoFinal,
      status: 'PENDENTE',
      iniciada: false,
      fotosExecucao: [],
      orcamentoPrevisto: orcTarefaFinal,
      subtarefas: subTarefasObj
    });

    setShowNovaTarefa(false);
    setTitulo('');
    setCategoriaNova('Serviços preliminares');
    setCategoriaEditadaManualmente(false);
    setDataInicioNova(hojeStr);
    setDataFimNova(fimSugeridoStr);
    setOrcamentoPrevistoNova('');
    setSubtarefasNova([]);
    setInputSubtarefaNova('');
    setSubCategoriaNova('');
    setSubOrcamentoNova('');
    setSubDataInicioNova(hojeStr);
    setSubDataFimNova(fimSugeridoStr);
  };

  // Funções de confirmação de início de tarefa
  const abrirConfirmarInicioTarefa = (tarefa: Tarefa) => {
    const hoje = new Date().toISOString().split('T')[0];
    setModalIniciarTarefa({
      tarefa,
      dataInicioReal: tarefa.dataInicioPrevista <= hoje ? hoje : tarefa.dataInicioPrevista
    });
  };

  const executarConfirmarInicio = () => {
    if (!modalIniciarTarefa) return;
    const { tarefa, dataInicioReal } = modalIniciarTarefa;
    if (onConfirmarInicioTarefa) {
      onConfirmarInicioTarefa(tarefa.id, dataInicioReal);
    } else {
      onUpdateTarefa(tarefa.id, {
        iniciada: true,
        dataInicioReal: dataInicioReal
      });
    }
    setModalIniciarTarefa(null);
  };

  const solicitarDesfazerInicio = (tarefa: Tarefa) => {
    setModalConfirmacao({
      isOpen: true,
      titulo: 'Desfazer Início da Tarefa?',
      subtitulo: `Etapa: "${tarefa.titulo}"`,
      descricao: (
        <div className="space-y-1.5 text-left">
          <p>Você está prestes a reverter o status de início da etapa <strong>"{tarefa.titulo}"</strong>.</p>
          <p className="text-amber-800 font-medium">
            Ela voltará a constar como "Aguardando Início" e o registro de início real será removido.
          </p>
        </div>
      ),
      labelBotao: 'Desfazer Início',
      tipo: 'warning',
      icone: 'undo',
      onConfirm: () => {
        if (onDesfazerInicioTarefa) {
          onDesfazerInicioTarefa(tarefa.id);
        } else {
          onUpdateTarefa(tarefa.id, {
            iniciada: false,
            dataInicioReal: undefined
          });
        }
        setModalConfirmacao(null);
      }
    });
  };

  const handleCheckin = (id: string) => {
    try {
      const tarefa = tarefas.find(t => t.id === id);
      if (!tarefa) return;

      const fotosAtuais = Array.isArray(tarefa.fotosExecucao) ? tarefa.fotosExecucao : [];
      const fotos = (fotoCheckin && typeof fotoCheckin === 'string' && fotoCheckin.trim())
        ? [...fotosAtuais, fotoCheckin]
        : fotosAtuais;
      const finalDataCheck = dataCheckin || new Date().toISOString().split('T')[0];

      // Marcar também todas as sub-tarefas como concluídas ao fazer check-in da tarefa
      const subtarefasAtualizadas = (tarefa.subtarefas || []).map(st => ({
        ...st,
        concluida: true,
        iniciada: true,
        dataInicioReal: st.dataInicioReal || st.dataInicioPrevista || finalDataCheck,
        dataConclusao: st.dataConclusao || finalDataCheck,
        fotosExecucao: Array.isArray(st.fotosExecucao) ? st.fotosExecucao : []
      }));

      onUpdateTarefa(id, {
        status: 'CONCLUIDA',
        iniciada: true,
        dataInicioReal: tarefa.dataInicioReal || tarefa.dataInicioPrevista || finalDataCheck,
        dataConclusao: finalDataCheck,
        fotosExecucao: fotos,
        subtarefas: subtarefasAtualizadas
      });
      setTarefaSelecionadaCheckin(null);
      setFotoCheckin('');
      setDataCheckin(new Date().toISOString().split('T')[0]);
    } catch (err) {
      console.error("Erro ao realizar check-in da tarefa:", err);
      alert("Ocorreu um erro ao finalizar a etapa com foto. Por favor, tente novamente.");
    }
  };

  // Concluir subtarefa individual com registro de data do check e foto opcional
  const handleConcluirSubtarefa = (tarefa: Tarefa, subId: string, dataConclusao?: string, foto?: string) => {
    try {
      const tarefaAtual = tarefas.find(t => t.id === tarefa.id) || tarefa;
      const subtarefas = tarefaAtual.subtarefas || [];
      const hojeStr = new Date().toISOString().split('T')[0];
      const dataFinal = dataConclusao || hojeStr;

      const atualizadas = subtarefas.map(st => {
        if (st.id === subId) {
          const fotosAtuais = Array.isArray(st.fotosExecucao) ? st.fotosExecucao : [];
          const novasFotos = (foto && typeof foto === 'string' && foto.trim())
            ? [...fotosAtuais, foto]
            : fotosAtuais;
          return {
            ...st,
            concluida: true,
            iniciada: true,
            dataInicioReal: st.dataInicioReal || st.dataInicioPrevista || dataFinal,
            dataConclusao: dataFinal,
            fotosExecucao: novasFotos
          };
        }
        return {
          ...st,
          fotosExecucao: Array.isArray(st.fotosExecucao) ? st.fotosExecucao : []
        };
      });

      const updates: Partial<Tarefa> = {
        subtarefas: atualizadas,
        iniciada: true,
        dataInicioReal: tarefaAtual.dataInicioReal || tarefaAtual.dataInicioPrevista || dataFinal
      };

      // Se todas as sub-tarefas forem concluídas, marcar a tarefa principal também
      if (atualizadas.length > 0 && atualizadas.every(s => s.concluida) && tarefaAtual.status !== 'CONCLUIDA') {
        updates.status = 'CONCLUIDA';
        updates.dataConclusao = dataFinal;
      }

      onUpdateTarefa(tarefaAtual.id, updates);

      // Se estiver aberta no modal de edição da tarefa, atualizar o estado local
      if (tarefaEmEdicao && tarefaEmEdicao.id === tarefaAtual.id) {
        setTarefaEmEdicao({ ...tarefaEmEdicao, ...updates });
      }

      setSubtarefaParaCheckin(null);
    } catch (err) {
      console.error("Erro ao concluir subtarefa:", err);
      alert("Ocorreu um erro ao registrar a conclusão da subtarefa.");
    }
  };

  // Salvar alterações de uma subtarefa (título, categoria, status, data de conclusão e fotos)
  const handleSalvarEdicaoSubtarefa = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subtarefaEmEdicao) return;

    try {
      const { tarefa, subtarefa, titulo, categoria, orcamentoPrevisto, concluida, dataConclusao, fotosExecucao } = subtarefaEmEdicao;
      const tarefaAtual = tarefas.find(t => t.id === tarefa.id) || tarefa;
      const hojeStr = new Date().toISOString().split('T')[0];
      const subtarefas = tarefaAtual.subtarefas || [];

      const atualizadas = subtarefas.map(st => {
        if (st.id === subtarefa.id) {
          return {
            ...st,
            titulo: titulo.trim() || st.titulo,
            categoria: categoria || st.categoria || tarefaAtual.categoria || sugerirCategoriaPorTitulo(titulo),
            orcamentoPrevisto,
            concluida,
            iniciada: concluida ? true : st.iniciada,
            dataInicioReal: concluida ? (st.dataInicioReal || st.dataInicioPrevista || hojeStr) : st.dataInicioReal,
            dataConclusao: concluida ? (dataConclusao || st.dataConclusao || hojeStr) : undefined,
            fotosExecucao: Array.isArray(fotosExecucao) ? fotosExecucao : []
          };
        }
        return {
          ...st,
          fotosExecucao: Array.isArray(st.fotosExecucao) ? st.fotosExecucao : []
        };
      });

      const updates: Partial<Tarefa> = { subtarefas: atualizadas };

      // O orçamento previsto da tarefa não pode ser menor que o somatório dos orçamentos das suas subtarefas
      const somaOrcSubtarefas = somarOrcamentoSubtarefas(atualizadas);
      if (somaOrcSubtarefas > (tarefaAtual.orcamentoPrevisto || 0)) {
        updates.orcamentoPrevisto = somaOrcSubtarefas;
      }

      if (concluida && atualizadas.length > 0 && atualizadas.every(s => s.concluida) && tarefaAtual.status !== 'CONCLUIDA') {
        updates.status = 'CONCLUIDA';
        updates.dataConclusao = dataConclusao || hojeStr;
      }

      onUpdateTarefa(tarefaAtual.id, updates);

      if (tarefaEmEdicao && tarefaEmEdicao.id === tarefaAtual.id) {
        setTarefaEmEdicao({ ...tarefaEmEdicao, ...updates });
      }

      setSubtarefaEmEdicao(null);
    } catch (err) {
      console.error("Erro ao salvar edição da subtarefa:", err);
      alert("Ocorreu um erro ao salvar as alterações da subtarefa.");
    }
  };

  // Solicitar confirmação com "estou ciente" para desfazer check de subtarefa
  const solicitarDesfazerCheckSubtarefa = (tarefa: Tarefa, sub: SubTarefa) => {
    setModalConfirmacao({
      isOpen: true,
      titulo: 'Desfazer Conclusão da Sub-tarefa?',
      subtitulo: `Sub-tarefa: "${sub.titulo}" (Etapa: "${tarefa.titulo}")`,
      descricao: (
        <div className="space-y-1.5 text-left">
          <p>Você está prestes a desfazer o check da sub-tarefa <strong>"{sub.titulo}"</strong>.</p>
          <p className="text-amber-800 font-medium">
            Ela voltará para o status <strong>Pendente</strong>, a data de conclusão será removida e o progresso da etapa <strong>"{tarefa.titulo}"</strong> será recalculado.
          </p>
        </div>
      ),
      labelBotao: 'Desfazer Check',
      tipo: 'warning',
      icone: 'undo',
      onConfirm: () => {
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);

        const atualizadas = (tarefa.subtarefas || []).map(st =>
          st.id === sub.id ? { ...st, concluida: false, dataConclusao: undefined } : st
        );

        const updates: Partial<Tarefa> = { subtarefas: atualizadas };

        // Se a etapa principal estava concluída, reavaliar status
        if (tarefa.status === 'CONCLUIDA') {
          const dataFim = new Date(tarefa.dataFimPrevista + 'T00:00:00');
          updates.status = dataFim < hoje ? 'ATRASADA' : 'PENDENTE';
          updates.dataConclusao = undefined;
        }

        onUpdateTarefa(tarefa.id, updates);
        if (tarefaEmEdicao && tarefaEmEdicao.id === tarefa.id) {
          setTarefaEmEdicao({ ...tarefaEmEdicao, ...updates });
        }
        setModalConfirmacao(null);
      }
    });
  };

  // Solicitar confirmação com "estou ciente" para desfazer check da tarefa inteira
  const solicitarDesfazerCheckTarefa = (tarefa: Tarefa) => {
    setModalConfirmacao({
      isOpen: true,
      titulo: 'Desfazer Conclusão da Etapa?',
      subtitulo: `Etapa: "${tarefa.titulo}"`,
      descricao: (
        <div className="space-y-1.5 text-left">
          <p>Deseja desfazer a conclusão da etapa <strong>"{tarefa.titulo}"</strong>?</p>
          <p className="text-amber-800 font-medium">
            A etapa retornará para <strong>Pendente / Em Andamento</strong> e a data de realização será limpa no cronograma.
          </p>
        </div>
      ),
      labelBotao: 'Desfazer Conclusão',
      tipo: 'warning',
      icone: 'undo',
      onConfirm: () => {
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);
        const dataFim = new Date(tarefa.dataFimPrevista + 'T00:00:00');

        onUpdateTarefa(tarefa.id, {
          status: dataFim < hoje ? 'ATRASADA' : 'PENDENTE',
          dataConclusao: undefined
        });
        setModalConfirmacao(null);
      }
    });
  };

  // Solicitar confirmação com "estou ciente" para apagar subtarefa
  const solicitarExclusaoSubtarefa = (tarefa: Tarefa, sub: SubTarefa) => {
    setModalConfirmacao({
      isOpen: true,
      titulo: 'Excluir Sub-tarefa?',
      subtitulo: `Sub-tarefa: "${sub.titulo}" (Etapa: "${tarefa.titulo}")`,
      descricao: (
        <div className="space-y-1.5 text-left">
          <p>Tem certeza de que deseja apagar a sub-tarefa <strong>"{sub.titulo}"</strong> da etapa <strong>"{tarefa.titulo}"</strong>?</p>
          {sub.concluida && (
            <p className="text-amber-700 font-medium">
              Aviso: Esta sub-tarefa já estava marcada como concluída. Os registros desta execução serão removidos.
            </p>
          )}
        </div>
      ),
      labelBotao: 'Sim, Excluir Sub-tarefa',
      tipo: 'danger',
      icone: 'trash',
      onConfirm: () => {
        const atualizadas = (tarefa.subtarefas || []).filter(st => st.id !== sub.id);
        onUpdateTarefa(tarefa.id, { subtarefas: atualizadas });
        if (tarefaEmEdicao && tarefaEmEdicao.id === tarefa.id) {
          setTarefaEmEdicao({ ...tarefaEmEdicao, subtarefas: atualizadas });
        }
        setModalConfirmacao(null);
      }
    });
  };

  // Solicitar confirmação com "estou ciente" para apagar tarefa completa
  const solicitarExclusaoTarefa = (tarefa: Tarefa) => {
    const totalSubs = tarefa.subtarefas?.length || 0;
    setModalConfirmacao({
      isOpen: true,
      titulo: 'Excluir Etapa / Tarefa do Cronograma?',
      subtitulo: `Etapa: "${tarefa.titulo}"`,
      descricao: (
        <div className="space-y-1.5 text-left">
          <p>Tem certeza de que deseja excluir permanentemente a etapa <strong>"{tarefa.titulo}"</strong>?</p>
          {totalSubs > 0 && (
            <p className="text-rose-600 font-semibold">
              Atenção: todas as {totalSubs} sub-tarefas vinculadas e comprovantes de execução também serão excluídos.
            </p>
          )}
        </div>
      ),
      labelBotao: 'Sim, Excluir Etapa',
      tipo: 'danger',
      icone: 'trash',
      onConfirm: () => {
        onDeleteTarefa(tarefa.id);
        if (tarefaSelecionadaCheckin === tarefa.id) {
          setTarefaSelecionadaCheckin(null);
        }
        setModalConfirmacao(null);
      }
    });
  };

  // Adicionar sub-tarefa rápida no card
  const handleAdicionarSubtarefaRapida = (tarefa: Tarefa) => {
    const texto = novaSubtarefaPorId[tarefa.id]?.trim();
    if (!texto) return;

    const nova: SubTarefa = {
      id: generateId(),
      titulo: texto,
      dataInicioPrevista: tarefa.dataInicioPrevista,
      dataFimPrevista: tarefa.dataFimPrevista,
      duracaoDias: tarefa.duracaoDias,
      concluida: false,
      iniciada: false
    };

    const subtarefasExistentes = tarefa.subtarefas || [];
    onUpdateTarefa(tarefa.id, {
      subtarefas: [...subtarefasExistentes, nova]
    });

    setNovaSubtarefaPorId(prev => ({ ...prev, [tarefa.id]: '' }));
  };

  // Salvar edição completa de tarefa
  const handleSalvarEdicao = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tarefaEmEdicao) return;

    const tarefaOriginal = tarefas.find(t => t.id === tarefaEmEdicao.id);
    const duracaoCalculada = calcularDuracaoDias(tarefaEmEdicao.dataInicioPrevista, tarefaEmEdicao.dataFimPrevista);

    // O orçamento previsto da tarefa não pode ser menor que o somatório dos orçamentos das suas subtarefas
    const somaSubsEdicao = somarOrcamentoSubtarefas(tarefaEmEdicao.subtarefas);
    let orcamentoFinal = tarefaEmEdicao.orcamentoPrevisto;
    if (somaSubsEdicao > 0 && (orcamentoFinal === undefined || orcamentoFinal < somaSubsEdicao)) {
      alert(`O orçamento previsto da tarefa não pode ser menor que o somatório dos orçamentos das suas subtarefas (R$ ${somaSubsEdicao.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}).\n\nO valor foi ajustado automaticamente para R$ ${somaSubsEdicao.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}.`);
      orcamentoFinal = somaSubsEdicao;
    }

    // Se a tarefa era CONCLUIDA e está sendo mudada para PENDENTE ou ATRASADA, exigir confirmação
    if (tarefaOriginal && tarefaOriginal.status === 'CONCLUIDA' && tarefaEmEdicao.status !== 'CONCLUIDA') {
      setModalConfirmacao({
        isOpen: true,
        titulo: 'Desfazer Conclusão da Etapa na Edição?',
        subtitulo: `Etapa: "${tarefaEmEdicao.titulo}"`,
        descricao: (
          <div className="space-y-1.5 text-left">
            <p>Você está alterando o status de Concluída para <strong>{tarefaEmEdicao.status === 'PENDENTE' ? 'Pendente' : 'Atrasada'}</strong>.</p>
            <p className="text-amber-800 font-medium">
              Esta ação desfaz o check da etapa no cronograma.
            </p>
          </div>
        ),
        labelBotao: 'Confirmar e Salvar',
        tipo: 'warning',
        icone: 'undo',
        onConfirm: () => {
          const updates: Partial<Tarefa> = {
            titulo: tarefaEmEdicao.titulo.trim(),
            dataInicioPrevista: tarefaEmEdicao.dataInicioPrevista,
            dataFimPrevista: tarefaEmEdicao.dataFimPrevista,
            duracaoDias: duracaoCalculada,
            status: tarefaEmEdicao.status,
            iniciada: tarefaEmEdicao.iniciada,
            dataInicioReal: tarefaEmEdicao.iniciada ? (tarefaEmEdicao.dataInicioReal || tarefaEmEdicao.dataInicioPrevista) : undefined,
            dataConclusao: undefined,
            subtarefas: tarefaEmEdicao.subtarefas || [],
            fotosExecucao: tarefaEmEdicao.fotosExecucao || [],
            orcamentoPrevisto: orcamentoFinal
          };
          onUpdateTarefa(tarefaEmEdicao.id, updates);
          setTarefaEmEdicao(null);
          setModalConfirmacao(null);
        }
      });
      return;
    }

    const hojeStr = new Date().toISOString().split('T')[0];
    const updates: Partial<Tarefa> = {
      titulo: tarefaEmEdicao.titulo.trim(),
      categoria: tarefaEmEdicao.categoria || sugerirCategoriaPorTitulo(tarefaEmEdicao.titulo),
      dataInicioPrevista: tarefaEmEdicao.dataInicioPrevista,
      dataFimPrevista: tarefaEmEdicao.dataFimPrevista,
      duracaoDias: duracaoCalculada,
      status: tarefaEmEdicao.status,
      iniciada: tarefaEmEdicao.iniciada,
      dataInicioReal: tarefaEmEdicao.iniciada ? (tarefaEmEdicao.dataInicioReal || tarefaEmEdicao.dataInicioPrevista) : undefined,
      dataConclusao: tarefaEmEdicao.status === 'CONCLUIDA' ? (tarefaEmEdicao.dataConclusao || hojeStr) : undefined,
      subtarefas: tarefaEmEdicao.subtarefas || [],
      fotosExecucao: tarefaEmEdicao.fotosExecucao || [],
      orcamentoPrevisto: orcamentoFinal
    };

    onUpdateTarefa(tarefaEmEdicao.id, updates);
    setTarefaEmEdicao(null);
  };

  // Tarefas com alerta de início (não concluídas e ainda não iniciadas)
  const tarefasAlertaInicio = tarefas
    .filter(t => t.status !== 'CONCLUIDA' && !t.iniciada)
    .map(t => ({
      tarefa: t,
      alerta: obterAlertaInicio(t.dataInicioPrevista, t.iniciada, t.status === 'CONCLUIDA')
    }))
    .filter(item =>
      item.alerta.tipo === 'INICIO_ATRASADO' ||
      item.alerta.tipo === 'INICIO_HOJE' ||
      item.alerta.tipo === 'INICIO_PROXIMO'
    );

  const handleLimparTodosFiltros = () => {
    setBuscaFiltro('');
    setCategoriasFiltro([]);
    setFiltroStatus('TODOS');
    setFiltroSubtarefas('TODAS');
  };

  const temFiltroAtivo = Boolean(
    buscaFiltro.trim() ||
    categoriasFiltro.length > 0 ||
    filtroStatus !== 'TODOS' ||
    filtroSubtarefas !== 'TODAS'
  );

  return (
    <div className="space-y-6 pb-24">
      {/* Cabeçalho */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Cronograma</h1>
          <p className="text-sm text-slate-500">Timeline & Tarefas</p>
        </div>
        <button
          onClick={() => setShowNovaTarefa(!showNovaTarefa)}
          className="shrink-0 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
        >
          {showNovaTarefa ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showNovaTarefa ? 'Cancelar' : 'Nova Tarefa'}
        </button>
      </div>

      {/* BARRA DE PESQUISA E FILTROS NO TOPO DA TELA DE OBRAS */}
      {tarefas.length > 0 && (
        <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/90 shadow-xs space-y-3">
          {/* Linha 1: Input de Pesquisa Principal + Dropdown de Categorias + Botões Rápidos */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            {/* Barra de Pesquisa Rápida */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Buscar tarefas por nome, subtarefa ou status..."
                value={buscaFiltro}
                onChange={e => setBuscaFiltro(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-8 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all shadow-2xs"
              />
              {buscaFiltro && (
                <button
                  type="button"
                  onClick={() => setBuscaFiltro('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                  title="Limpar pesquisa"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Lista Suspensa Multi-Seleção de Categorias */}
            <div className="relative" ref={dropdownCategoriasRef}>
              <button
                type="button"
                onClick={() => setDropdownCategoriasAberto(!dropdownCategoriasAberto)}
                className={`w-full sm:w-auto text-xs px-3.5 py-2 rounded-xl font-bold transition-all flex items-center justify-between gap-2 border cursor-pointer ${categoriasFiltro.length > 0
                    ? 'bg-indigo-50 border-indigo-200 text-indigo-900 shadow-2xs'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Tag className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                  <span className="truncate max-w-[150px] sm:max-w-[180px]">
                    {categoriasFiltro.length === 0
                      ? 'Todas as Categorias'
                      : categoriasFiltro.length === 1
                        ? `${getInfoCategoria(categoriasFiltro[0]).numero}. ${getInfoCategoria(categoriasFiltro[0]).nome}`
                        : `${categoriasFiltro.length} categorias`}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {categoriasFiltro.length > 0 && (
                    <span className="bg-indigo-600 text-white text-[10px] font-black px-1.5 py-0.2 rounded-full">
                      {categoriasFiltro.length}
                    </span>
                  )}
                  <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${dropdownCategoriasAberto ? 'rotate-180' : ''}`} />
                </div>
              </button>

              {/* Menu da Lista Suspensa */}
              {dropdownCategoriasAberto && (
                <div className="absolute left-0 sm:right-0 sm:left-auto top-full mt-1.5 z-40 w-72 sm:w-80 bg-white rounded-2xl shadow-xl border border-slate-200 p-3 space-y-2.5 animate-in fade-in zoom-in-95 duration-150">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Filter className="w-3.5 h-3.5 text-indigo-600" />
                      Filtrar por Categorias
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setCategoriasFiltro(CATEGORIAS_ETAPAS.map(c => c.id))}
                        className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer"
                      >
                        Marcar Todas
                      </button>
                      <span className="text-slate-300">•</span>
                      <button
                        type="button"
                        onClick={() => setCategoriasFiltro([])}
                        className="text-[10px] font-bold text-rose-600 hover:text-rose-800 hover:underline cursor-pointer"
                      >
                        Limpar
                      </button>
                    </div>
                  </div>

                  {/* Busca interna por categorias */}
                  <div className="relative">
                    <Search className="w-3 h-3 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Filtrar categorias..."
                      value={buscaCategoriaDropdown}
                      onChange={e => setBuscaCategoriaDropdown(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-7 pr-6 py-1 text-[11px] text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                    {buscaCategoriaDropdown && (
                      <button
                        type="button"
                        onClick={() => setBuscaCategoriaDropdown('')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
                      >
                        ×
                      </button>
                    )}
                  </div>

                  {/* Lista com checkbox para cada categoria */}
                  <div className="max-h-56 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                    {categoriasFiltradasNoDropdown.map(cat => {
                      const isChecked = categoriasFiltro.includes(cat.id);
                      const count = contagemPorCategoria[cat.id] || 0;

                      return (
                        <label
                          key={cat.id}
                          className={`flex items-center justify-between p-2 rounded-xl text-xs cursor-pointer select-none transition-colors ${isChecked ? 'bg-indigo-50/80 border border-indigo-100' : 'hover:bg-slate-50 border border-transparent'
                            }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0 pr-2">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {
                                setCategoriasFiltro(prev =>
                                  prev.includes(cat.id)
                                    ? prev.filter(id => id !== cat.id)
                                    : [...prev, cat.id]
                                );
                              }}
                              className="rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5 cursor-pointer shrink-0"
                            />
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${cat.corBadge}`}>
                                  {cat.numero}
                                </span>
                                <span className={`font-semibold truncate ${isChecked ? 'text-indigo-950 font-bold' : 'text-slate-700'}`}>
                                  {cat.nome}
                                </span>
                              </div>
                            </div>
                          </div>

                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full shrink-0 font-bold ${count > 0 ? 'bg-slate-100 text-slate-700' : 'bg-slate-50 text-slate-400'
                            }`}>
                            {count}
                          </span>
                        </label>
                      );
                    })}
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                    <span className="text-slate-500 font-medium">
                      {categoriasFiltro.length === 0 ? 'Exibindo todas' : `${categoriasFiltro.length} de ${CATEGORIAS_ETAPAS.length} ativas`}
                    </span>
                    <button
                      type="button"
                      onClick={() => setDropdownCategoriasAberto(false)}
                      className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-3 py-1 rounded-lg text-xs cursor-pointer"
                    >
                      Concluir
                    </button>
                  </div>
                </div>
              )}
            </div>


          </div>

          {/* Linha 2: Filtros de Status de Conclusão e Subtarefas */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2.5 border-t border-slate-100">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mr-1">
                Status:
              </span>

              {/* Botões de Status */}
              <button
                type="button"
                onClick={() => setFiltroStatus('TODOS')}
                className={`text-[11px] px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${filtroStatus === 'TODOS'
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
              >
                Todos ({tarefas.length})
              </button>

              <button
                type="button"
                onClick={() => setFiltroStatus('PENDENTE')}
                className={`text-[11px] px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1 ${filtroStatus === 'PENDENTE'
                    ? 'bg-slate-800 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
              >
                <Circle className="w-2.5 h-2.5 text-slate-400" />
                Pendentes ({contagemStatus.pendentes})
              </button>

              <button
                type="button"
                onClick={() => setFiltroStatus('EM_ANDAMENTO')}
                className={`text-[11px] px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1 ${filtroStatus === 'EM_ANDAMENTO'
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-100'
                  }`}
              >
                <Play className="w-2.5 h-2.5 fill-current text-current" />
                Em Andamento ({contagemStatus.emAndamento})
              </button>

              <button
                type="button"
                onClick={() => setFiltroStatus('CONCLUIDA')}
                className={`text-[11px] px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1 ${filtroStatus === 'CONCLUIDA'
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-100'
                  }`}
              >
                <CheckCircle2 className="w-2.5 h-2.5" />
                Concluídas ({contagemStatus.concluidas})
              </button>

              {contagemStatus.atrasadas > 0 && (
                <button
                  type="button"
                  onClick={() => setFiltroStatus('ATRASADA')}
                  className={`text-[11px] px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1 ${filtroStatus === 'ATRASADA'
                      ? 'bg-rose-600 text-white shadow-2xs'
                      : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-100'
                    }`}
                >
                  <AlertTriangle className="w-2.5 h-2.5" />
                  Atrasadas ({contagemStatus.atrasadas})
                </button>
              )}
            </div>

            {/* Seletor de Subtarefas */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <ListChecks className="w-3 h-3 text-indigo-600" />
                Subtarefas:
              </span>
              <select
                value={filtroSubtarefas}
                onChange={e => setFiltroSubtarefas(e.target.value as any)}
                className={`text-[11px] bg-slate-50 border rounded-lg px-2 py-1 font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer ${filtroSubtarefas !== 'TODAS'
                    ? 'border-indigo-300 text-indigo-800 bg-indigo-50/50 font-bold'
                    : 'border-slate-200 text-slate-600'
                  }`}
              >
                <option value="TODAS">Todas ({tarefas.length})</option>
                <option value="COM_SUBS">Com Subtarefas ({contagemStatus.comSubs})</option>
                <option value="SEM_SUBS">Sem Subtarefas ({contagemStatus.semSubs})</option>
                <option value="SUBS_PENDENTES">Subtarefas Pendentes</option>
                <option value="SUBS_CONCLUIDAS">Subtarefas 100% Concluídas</option>
              </select>
            </div>
          </div>

          {/* Chips de Categorias Selecionadas */}
          {categoriasFiltro.length > 0 && (
            <div className="pt-2 border-t border-slate-100 flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Categorias ativas:</span>
              {categoriasFiltro.map(catId => {
                const info = getInfoCategoria(catId);
                return (
                  <span
                    key={catId}
                    className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md border ${info.corBadge}`}
                  >
                    <span>{info.numero}. {info.nome}</span>
                    <button
                      type="button"
                      onClick={() => setCategoriasFiltro(prev => prev.filter(id => id !== catId))}
                      className="hover:opacity-75 cursor-pointer ml-0.5"
                      title="Remover categoria"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </span>
                );
              })}
              <button
                type="button"
                onClick={() => setCategoriasFiltro([])}
                className="text-[10px] text-slate-400 hover:text-slate-600 hover:underline cursor-pointer ml-1"
              >
                Desmarcar todas
              </button>
            </div>
          )}

          {/* Indicador de Filtros Ativos e Contagem */}
          {temFiltroAtivo && (
            <div className="flex items-center justify-between bg-indigo-50/70 border border-indigo-200/80 px-3 py-1.5 rounded-xl text-xs text-indigo-950">
              <div className="flex items-center gap-2 flex-wrap text-[11px]">
                <span className="font-bold text-indigo-900">
                  Mostrando {tarefasFiltradas.length} de {tarefas.length} etapas
                </span>
                {buscaFiltro && (
                  <span className="bg-white border border-indigo-200 px-1.5 py-0.2 rounded text-[10px] font-semibold text-slate-700">
                    Termo: "{buscaFiltro}"
                  </span>
                )}
                {filtroStatus !== 'TODOS' && (
                  <span className="bg-white border border-indigo-200 px-1.5 py-0.2 rounded text-[10px] font-semibold text-slate-700">
                    Status: {filtroStatus === 'CONCLUIDA' ? 'Concluídas' : filtroStatus === 'EM_ANDAMENTO' ? 'Em Andamento' : filtroStatus === 'PENDENTE' ? 'Pendentes' : 'Atrasadas'}
                  </span>
                )}
                {filtroSubtarefas !== 'TODAS' && (
                  <span className="bg-white border border-indigo-200 px-1.5 py-0.2 rounded text-[10px] font-semibold text-slate-700">
                    {filtroSubtarefas === 'COM_SUBS' ? 'Com subtarefas' : filtroSubtarefas === 'SEM_SUBS' ? 'Sem subtarefas' : filtroSubtarefas === 'SUBS_PENDENTES' ? 'Subtarefas pendentes' : 'Subtarefas concluídas'}
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={handleLimparTodosFiltros}
                className="text-[11px] font-bold text-indigo-700 hover:text-indigo-900 hover:underline flex items-center gap-1 cursor-pointer shrink-0 ml-2"
              >
                <X className="w-3 h-3" />
                Limpar Todos os Filtros
              </button>
            </div>
          )}
        </div>
      )}
      
      {/* Botões de Expandir / Recolher */}
      <div className="flex items-center gap-1 self-end sm:self-auto shrink-0">
        <button
          type="button"
          onClick={handleColapsarTodas}
          className="flex gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 p-2 rounded-xl transition-colors cursor-pointer"
          title="Recolher todas as etapas"
        >
          <ChevronsDownUp className="w-3.5 h-3.5 text-indigo-600"/> Recolher todas 
        </button>
        <button
          type="button"
          onClick={handleExpandirTodas}
          className="flex gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 p-2 rounded-xl transition-colors cursor-pointer"
          title="Expandir todas as etapas"
        >
          <ChevronsUpDown className="w-3.5 h-3.5 text-indigo-600"/> Expandir todas 
        </button>
      </div>

      {/* Formulário de Nova Tarefa */}
      {showNovaTarefa && (
        <form onSubmit={handleNovaTarefa} className="bg-slate-900 text-white p-5 rounded-2xl shadow-lg mb-6 border border-slate-800 space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-slate-800">
            <h3 className="font-bold text-base text-slate-100 flex items-center gap-2">
              <Plus className="w-5 h-5 text-indigo-400" />
              Adicionar Nova Etapa
            </h3>
            <button
              type="button"
              onClick={() => setShowNovaTarefa(false)}
              className="text-slate-400 hover:text-slate-200 text-xs p-1 cursor-pointer"
            >
              Fechar
            </button>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Título da Tarefa *</label>
            <input
              required
              type="text"
              placeholder="Ex: Alvenaria do 1º Pavimento"
              value={titulo}
              onChange={e => {
                const novoTitulo = e.target.value;
                setTitulo(novoTitulo);
                if (!categoriaEditadaManualmente && novoTitulo.trim().length >= 3) {
                  setCategoriaNova(sugerirCategoriaPorTitulo(novoTitulo));
                }
              }}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Seletor de Categoria */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-indigo-400" />
                Categoria da Etapa *
              </span>
              <span className="text-[10px] text-slate-400 font-normal">
                {categoriaEditadaManualmente ? 'Manual' : 'Sugestão automática ativa'}
              </span>
            </label>
            <select
              value={categoriaNova}
              onChange={e => {
                setCategoriaNova(e.target.value);
                setCategoriaEditadaManualmente(true);
              }}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              {CATEGORIAS_ETAPAS.map(cat => (
                <option key={cat.id} value={cat.id}>
                  {cat.numero}. {cat.nome}
                </option>
              ))}
            </select>
            {getInfoCategoria(categoriaNova) && (
              <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                <span className="inline-block w-2 h-2 rounded-full bg-indigo-400"></span>
                {getInfoCategoria(categoriaNova).descricao}
              </p>
            )}
          </div>

          {/* Início Previsto e Fim Previsto */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                Início Previsto *
              </label>
              <input
                required
                type="date"
                value={dataInicioNova}
                onChange={e => {
                  const novoInicio = e.target.value;
                  setDataInicioNova(novoInicio);
                  if (dataFimNova < novoInicio) {
                    setDataFimNova(novoInicio);
                  }
                  if (subDataInicioNova < novoInicio) {
                    setSubDataInicioNova(novoInicio);
                  }
                }}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <CalendarCheck className="w-3.5 h-3.5 text-indigo-400" />
                Fim Previsto *
              </label>
              <input
                required
                type="date"
                value={dataFimNova}
                min={dataInicioNova}
                onChange={e => {
                  const novoFim = e.target.value;
                  setDataFimNova(novoFim);
                  if (subDataFimNova > novoFim) {
                    setSubDataFimNova(novoFim);
                  }
                }}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Duração Calculada (Não é mais um input manual) */}
          <div className="bg-slate-800/80 border border-indigo-900/50 rounded-xl p-3 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-indigo-900/60 text-indigo-300 rounded-lg">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Duração Calculada
                </span>
                <span className="text-sm font-bold text-indigo-300">
                  {duracaoCalculadaNova} {duracaoCalculadaNova === 1 ? 'dia corrido' : 'dias corridos'}
                </span>
              </div>
            </div>
            <span className="text-xs text-slate-400 font-medium">
              {formatarDataBR(dataInicioNova)} até {formatarDataBR(dataFimNova)}
            </span>
          </div>

          {/* Orçamento Previsto da Tarefa */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Coins className="w-3.5 h-3.5 text-emerald-400" />
                Orçamento Previsto da Etapa (R$)
              </span>
              <span className="text-[10px] text-slate-400 font-normal">Opcional para acompanhamento e alertas</span>
            </label>
            {(() => {
              const somaSubsNovaForm = somarOrcamentoSubtarefas(subtarefasNova);
              const orcNum = parseFloat(orcamentoPrevistoNova) || 0;
              const isMenorQueSubs = somaSubsNovaForm > 0 && orcNum < somaSubsNovaForm;

              return (
                <>
                  <input
                    type="number"
                    step="0.01"
                    min={somaSubsNovaForm > 0 ? somaSubsNovaForm : 0}
                    placeholder="Ex: 5000.00"
                    value={orcamentoPrevistoNova}
                    onChange={e => setOrcamentoPrevistoNova(e.target.value)}
                    className={`w-full bg-slate-800 border rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 font-medium ${isMenorQueSubs
                        ? 'border-rose-500 focus:ring-rose-500'
                        : 'border-slate-700 focus:ring-emerald-500'
                      }`}
                  />
                  {somaSubsNovaForm > 0 && (
                    <div className={`mt-1.5 p-2 rounded-xl text-xs flex items-center justify-between gap-2 ${isMenorQueSubs
                        ? 'bg-rose-950/70 border border-rose-800/80 text-rose-300'
                        : 'bg-emerald-950/60 border border-emerald-800/60 text-emerald-300'
                      }`}>
                      <div className="flex items-center gap-1.5 min-w-0">
                        {isMenorQueSubs ? (
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                        ) : (
                          <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        )}
                        <span className="text-[11px] truncate">
                          {isMenorQueSubs
                            ? `Não pode ser menor que o somatório das subtarefas (Mín: R$ ${somaSubsNovaForm.toLocaleString('pt-BR', { minimumFractionDigits: 2 })})`
                            : `Cobre o somatório das subtarefas (R$ ${somaSubsNovaForm.toLocaleString('pt-BR', { minimumFractionDigits: 2 })})`}
                        </span>
                      </div>
                      {isMenorQueSubs && (
                        <button
                          type="button"
                          onClick={() => setOrcamentoPrevistoNova(somaSubsNovaForm.toFixed(2))}
                          className="text-[10px] font-bold bg-rose-600 hover:bg-rose-500 text-white px-2 py-1 rounded-md shrink-0 cursor-pointer shadow-2xs transition-colors"
                        >
                          Ajustar para R$ {somaSubsNovaForm.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </button>
                      )}
                    </div>
                  )}
                </>
              );
            })()}
          </div>

          {/* Sub-tarefas no cadastro inicial */}
          <div className="pt-2 border-t border-slate-800 space-y-2.5">
            <label className="block text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <ListChecks className="w-4 h-4 text-indigo-400" />
              Sub-tarefas da Etapa (Opcional)
            </label>

            <div className="space-y-2 bg-slate-800/50 p-3 rounded-xl border border-slate-700/50">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Título da sub-tarefa (Ex: Marcação dos blocos...)"
                  value={inputSubtarefaNova}
                  onChange={e => setInputSubtarefaNova(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAdicionarSubtarefaNova();
                    }
                  }}
                  className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  type="button"
                  onClick={handleAdicionarSubtarefaNova}
                  className="bg-indigo-600 hover:bg-indigo-500 px-3.5 py-2 rounded-xl text-xs font-semibold text-white transition-colors cursor-pointer"
                >
                  <Plus />
                </button>
              </div>

              {/* Datas e Orçamento da subtarefa em adição rápida */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] text-slate-400">
                <div className="flex items-center gap-1.5">
                  <span>Início:</span>
                  <input
                    type="date"
                    value={subDataInicioNova}
                    onChange={e => setSubDataInicioNova(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-2 py-1 text-xs focus:outline-none"
                  />
                </div>
                <div className="flex items-center gap-1.5">
                  <span>Fim:</span>
                  <input
                    type="date"
                    value={subDataFimNova}
                    min={subDataInicioNova}
                    onChange={e => setSubDataFimNova(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-2 py-1 text-xs focus:outline-none"
                  />
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-emerald-400 font-medium">Orç: R$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0,00"
                    value={subOrcamentoNova}
                    onChange={e => setSubOrcamentoNova(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-2 py-1 text-xs focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {subtarefasNova.length > 0 && (
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {subtarefasNova.map((sub, idx) => (
                  <div key={sub.id || idx} className="flex items-center justify-between bg-slate-800/80 px-3 py-2 rounded-lg text-xs border border-slate-700/60">
                    <div className="min-w-0 flex-1 pr-2">
                      <span className="text-slate-200 font-medium truncate block">• {sub.titulo}</span>
                      <div className="flex items-center gap-2 flex-wrap text-[10px] text-slate-400">
                        <span>{formatarDataBR(sub.dataInicioPrevista)} até {formatarDataBR(sub.dataFimPrevista)}</span>
                        {sub.orcamentoPrevisto && sub.orcamentoPrevisto > 0 && (
                          <span className="text-emerald-400 font-semibold">
                            Orç: R$ {sub.orcamentoPrevisto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoverSubtarefaNova(idx)}
                      className="text-rose-400 hover:text-rose-300 p-1 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] text-white font-bold py-3.5 rounded-xl transition-all shadow-md mt-2 cursor-pointer"
          >
            Cadastrar Tarefa
          </button>
        </form>
      )}

      {/* Banner de Alertas de Início Previsto Próximos ou Atrasados */}
      {tarefasAlertaInicio.length > 0 && (
        <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-indigo-500/10 border border-amber-300/80 rounded-2xl p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-amber-500 text-white rounded-lg shadow-xs animate-pulse">
                <BellRing className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-black text-amber-950 uppercase tracking-wider">
                  Atenção: Início Previsto de Etapas
                </h3>
                <p className="text-[11px] text-amber-800 font-medium">
                  {tarefasAlertaInicio.length} {tarefasAlertaInicio.length === 1 ? 'etapa com início programado' : 'etapas com início programado'}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-1">
            {tarefasAlertaInicio.map(({ tarefa, alerta }) => (
              <div
                key={tarefa.id}
                className="bg-white/95 border border-amber-200/90 rounded-xl p-3 flex items-center justify-between gap-3 shadow-2xs"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs font-bold text-slate-800 truncate">
                      {tarefa.titulo}
                    </span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${alerta.tipo === 'INICIO_ATRASADO'
                        ? 'bg-rose-100 text-rose-800'
                        : alerta.tipo === 'INICIO_HOJE'
                          ? 'bg-amber-100 text-amber-800 font-extrabold animate-pulse'
                          : 'bg-indigo-100 text-indigo-800'
                      }`}>
                      {alerta.tipo === 'INICIO_ATRASADO' ? 'Início Atrasado' : alerta.tipo === 'INICIO_HOJE' ? 'Início Hoje' : `Inicia em ${alerta.diasDiferenca}d`}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Previsto: {formatarDataBR(tarefa.dataInicioPrevista)} ({tarefa.duracaoDias} {tarefa.duracaoDias === 1 ? 'dia' : 'dias'})
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => abrirConfirmarInicioTarefa(tarefa)}
                  className="bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-xs px-3 py-2 rounded-xl flex items-center gap-1.5 transition-all shadow-xs flex-shrink-0 cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  Confirmar Início
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Timeline de Tarefas */}
      {tarefasFiltradas.length === 0 && tarefas.length > 0 ? (
        <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
            <Filter className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-base text-slate-800">Nenhuma etapa encontrada</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Não foram encontradas etapas com os filtros e busca aplicados.
          </p>
          <div className="flex items-center justify-center gap-2 pt-2">
            <button
              type="button"
              onClick={handleLimparTodosFiltros}
              className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-2 rounded-xl transition-colors cursor-pointer"
            >
              Limpar Todos os Filtros
            </button>
            <button
              type="button"
              onClick={() => {
                if (categoriasFiltro.length === 1) {
                  setCategoriaNova(categoriasFiltro[0]);
                  setCategoriaEditadaManualmente(true);
                }
                setShowNovaTarefa(true);
              }}
              className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2 rounded-xl transition-colors cursor-pointer"
            >
              + Nova Tarefa
            </button>
          </div>
        </div>
      ) : (
        <div className="relative pl-6 border-l-2 border-slate-200 space-y-4 mt-4">
          {tarefasFiltradas.map(tarefa => {
            const isConcluida = tarefa.status === 'CONCLUIDA';
            const isAtrasada = !isConcluida && new Date(tarefa.dataFimPrevista) < new Date();
            const isCheckinOpen = tarefaSelecionadaCheckin === tarefa.id;
            const isColapsada = isTarefaColapsada(tarefa.id);
            const catInfo = getInfoCategoria(tarefa.categoria || sugerirCategoriaPorTitulo(tarefa.titulo));

            const subtarefas = tarefa.subtarefas || [];
            const totalSubs = subtarefas.length;
            const concluidasSubs = subtarefas.filter(s => s.concluida).length;
            const progressoSubs = totalSubs > 0 ? Math.round((concluidasSubs / totalSubs) * 100) : 0;
            const idsSubtarefas = new Set(subtarefas.map(s => s.id));

            // Despesas desta Tarefa: soma de cada item de despesa cadastrado para ela, incluindo os das suas subtarefas (usando filtro)
            const itensDestaTarefa = itensCalculadosDaObra.filter(it =>
              it.tarefaId === tarefa.id || (it.subtarefaId ? idsSubtarefas.has(it.subtarefaId) : false)
            );
            const itensRealizadosTarefa = itensDestaTarefa.filter(it => !it.isPrevisao);
            const itensPrevisaoTarefa = itensDestaTarefa.filter(it => !!it.isPrevisao);
            const totalDespesasRealizadas = itensRealizadosTarefa.reduce((acc, it) => acc + it.valorTotal, 0);
            const totalPrevisaoDespesas = itensPrevisaoTarefa.reduce((acc, it) => acc + it.valorTotal, 0);
            const isDespesasOpen = !!despesasExpandidas[tarefa.id];

            return (
              <div key={tarefa.id} className="relative group">
                {/* Marcador na Timeline */}
                <div className={`absolute -left-[35px] bg-white p-1 rounded-full shadow-xs ${isConcluida ? 'text-emerald-500' : isAtrasada ? 'text-rose-500' : 'text-slate-400'
                  }`}>
                  {isConcluida ? (
                    <CheckCircle2 className="w-6 h-6 fill-emerald-100" />
                  ) : isAtrasada ? (
                    <Clock className="w-6 h-6 fill-rose-100" />
                  ) : (
                    <Circle className="w-6 h-6" />
                  )}
                </div>

                {/* Card da Tarefa */}
                <div
                  className={`bg-white rounded-2xl shadow-sm border transition-all ${isColapsada ? 'p-3 hover:shadow-md' : 'p-4'
                    } ${isConcluida
                      ? 'border-emerald-200 bg-emerald-50/20'
                      : isAtrasada
                        ? 'border-rose-200 bg-rose-50/15'
                        : 'border-slate-200/80 hover:border-slate-300'
                    }`}
                >
                  {/* Linha Superior: Título + Badges + Ações */}
                  {(() => {
                    const alertaInicio = obterAlertaInicio(tarefa.dataInicioPrevista, tarefa.iniciada, isConcluida);

                    return (
                      <div className="flex justify-between items-start gap-2">
                        <div
                          onClick={() => toggleColapsarTarefa(tarefa.id)}
                          className="flex-1 cursor-pointer select-none group/title"
                        >
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className={`font-bold text-base leading-snug group-hover/title:text-indigo-600 transition-colors ${isConcluida ? 'text-emerald-900' : 'text-slate-800'
                              }`}>
                              {tarefa.titulo}
                            </h3>

                            {/* Badge de Categoria da Etapa */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setCategoriasFiltro([catInfo.id]);
                              }}
                              title={`Filtrar cronograma por ${catInfo.nome}`}
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-md border flex items-center gap-1 transition-transform hover:scale-105 active:scale-95 cursor-pointer ${catInfo.corBadge}`}
                            >
                              <Tag className="w-2.5 h-2.5" />
                              <span>{catInfo.numero}. {catInfo.nome}</span>
                            </button>

                            {/* Badge de Status Geral */}
                            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${isConcluida ? 'bg-emerald-100 text-emerald-800' :
                                isAtrasada ? 'bg-rose-100 text-rose-800' :
                                  tarefa.iniciada ? 'bg-indigo-100 text-indigo-800' :
                                    'bg-slate-100 text-slate-700'
                              }`}>
                              {isConcluida ? 'Concluída' : isAtrasada ? 'Prazo Vencido' : tarefa.iniciada ? 'Em Andamento' : 'Aguardando Início'}
                            </span>

                            {/* Badge de Alerta de Início (se pendente e não iniciada) */}
                            {!isConcluida && !tarefa.iniciada && (
                              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md flex items-center gap-1 ${alertaInicio.tipo === 'INICIO_ATRASADO'
                                  ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                  : alertaInicio.tipo === 'INICIO_HOJE'
                                    ? 'bg-amber-100 text-amber-900 border border-amber-300 font-black animate-pulse'
                                    : alertaInicio.tipo === 'INICIO_PROXIMO'
                                      ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                                      : 'bg-slate-100 text-slate-600'
                                }`}>
                                <CalendarClock className="w-3 h-3" />
                                {alertaInicio.tipo === 'INICIO_ATRASADO' ? 'Início Atrasado' :
                                  alertaInicio.tipo === 'INICIO_HOJE' ? 'Início Previsto Hoje' :
                                    alertaInicio.tipo === 'INICIO_PROXIMO' ? `Inicia em ${alertaInicio.diasDiferenca}d` :
                                      'Não Iniciada'}
                              </span>
                            )}
                          </div>

                          {/* Datas e Prazos da Etapa */}
                          <div className="flex flex-wrap items-center gap-2.5 text-xs text-slate-500 mt-1.5">
                            <span className="flex items-center gap-1 font-medium">
                              <span className="text-slate-400">Início:</span> {formatarDataBR(tarefa.dataInicioPrevista)}
                            </span>
                            <span className="text-slate-300">•</span>
                            <span className="flex items-center gap-1 font-medium">
                              <span className="text-slate-400">Fim:</span> {formatarDataBR(tarefa.dataFimPrevista)}
                            </span>
                            <span className="text-slate-300">•</span>
                            <span className="bg-slate-100 text-slate-700 font-semibold px-2 py-0.5 rounded-md text-[11px]">
                              {tarefa.duracaoDias} {tarefa.duracaoDias === 1 ? 'dia' : 'dias'}
                            </span>

                            {/* Início Real */}
                            {tarefa.iniciada && tarefa.dataInicioReal && !isConcluida && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md border border-indigo-100">
                                <Play className="w-2.5 h-2.5 fill-current text-indigo-600" />
                                Iniciada em: {formatarDataBR(tarefa.dataInicioReal)}
                              </span>
                            )}

                            {/* Conclusão */}
                            {isConcluida && tarefa.dataConclusao && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-emerald-100/70 text-emerald-800 px-2 py-0.5 rounded-md">
                                <CalendarCheck className="w-3 h-3 text-emerald-600" />
                                Check: {formatarDataBR(tarefa.dataConclusao)}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Botões de Ação da Tarefa */}
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {/* Botão rápido para iniciar se não iniciada e não concluída */}
                          {!isConcluida && !tarefa.iniciada && (
                            <button
                              type="button"
                              title="Confirmar início desta tarefa"
                              onClick={(e) => {
                                e.stopPropagation();
                                abrirConfirmarInicioTarefa(tarefa);
                              }}
                              className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all active:scale-95 cursor-pointer mr-1"
                            >
                              <Play className="w-3 h-3 fill-current text-indigo-600" />
                              <span className="hidden sm:inline">Iniciar</span>
                            </button>
                          )}

                          <button
                            type="button"
                            title="Editar Tarefa"
                            onClick={() => setTarefaEmEdicao({ ...tarefa })}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 active:scale-95 transition-colors cursor-pointer"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            title="Excluir Tarefa"
                            onClick={() => solicitarExclusaoTarefa(tarefa)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 active:scale-95 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            title={isColapsada ? "Expandir etapa" : "Recolher etapa"}
                            onClick={() => toggleColapsarTarefa(tarefa.id)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 active:scale-95 transition-colors cursor-pointer"
                          >
                            {isColapsada ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Resumo Compacto quando a Tarefa está Colapsada */}
                  {isColapsada && (
                    <div
                      onClick={() => toggleColapsarTarefa(tarefa.id)}
                      className="mt-2.5 pt-2 border-t border-slate-100/80 flex flex-wrap items-center justify-between gap-2 cursor-pointer select-none"
                    >
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        {/* Sub-tarefas badge */}
                        {totalSubs > 0 ? (
                          <div className="flex items-center gap-1.5 bg-slate-100/90 px-2 py-0.5 rounded-md text-slate-700 text-[11px]">
                            <ListChecks className="w-3 h-3 text-indigo-500" />
                            <span className="font-semibold">{concluidasSubs}/{totalSubs} subs</span>
                            <span className={`text-[10px] font-bold px-1 rounded ${progressoSubs === 100 ? 'bg-emerald-100 text-emerald-800' : 'bg-indigo-100 text-indigo-700'
                              }`}>
                              {progressoSubs}%
                            </span>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">Sem sub-etapas</span>
                        )}

                        {/* Orçamento badge no colapsado */}
                        {(() => {
                          const somaSubsColap = somarOrcamentoSubtarefas(tarefa.subtarefas);
                          const orcEfetivoColap = Math.max(tarefa.orcamentoPrevisto || 0, somaSubsColap);
                          if (orcEfetivoColap <= 0) return null;
                          return (
                            <div className="flex items-center gap-1 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-md text-emerald-800 text-[11px] font-semibold">
                              <Coins className="w-3 h-3 text-emerald-600" />
                              <span>Orç: R$ {orcEfetivoColap.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                            </div>
                          );
                        })()}

                        {/* Despesas da Etapa */}
                        {(totalDespesasRealizadas > 0 || totalPrevisaoDespesas > 0) && (
                          <div className="flex items-center gap-1 bg-rose-50 border border-rose-100/80 px-2 py-0.5 rounded-md text-slate-700 text-[11px]">
                            <Receipt className="w-3 h-3 text-rose-500" />
                            <span className="font-bold text-rose-700">
                              R$ {totalDespesasRealizadas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </span>
                            {totalPrevisaoDespesas > 0 && (
                              <span className="text-[10px] text-amber-700 font-semibold">
                                (+{totalPrevisaoDespesas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })})
                              </span>
                            )}
                          </div>
                        )}

                        {/* Fotos de Comprovação */}
                        {tarefa.fotosExecucao && tarefa.fotosExecucao.length > 0 && (
                          <div className="flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded-md text-slate-600 text-[11px] font-medium">
                            <Camera className="w-3 h-3 text-slate-500" />
                            <span>{tarefa.fotosExecucao.length} {tarefa.fotosExecucao.length === 1 ? 'foto' : 'fotos'}</span>
                          </div>
                        )}
                      </div>

                      <div className="text-[11px] text-indigo-600 font-semibold flex items-center gap-0.5 hover:underline">
                        <span>Ver detalhes</span>
                        <ChevronDown className="w-3 h-3" />
                      </div>
                    </div>
                  )}

                  {/* Conteúdo Completo quando Expandida */}
                  {!isColapsada && (
                    <div className="mt-3 pt-3 border-t border-slate-100 space-y-3">
                      {/* Botão Desfazer Check se concluída */}
                      {isConcluida && (
                        <div>
                          <button
                            type="button"
                            onClick={() => solicitarDesfazerCheckTarefa(tarefa)}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200/80 px-2.5 py-1 rounded-md transition-colors cursor-pointer"
                            title="Desfazer conclusão desta etapa"
                          >
                            <Undo2 className="w-3 h-3 text-amber-600" />
                            Desfazer Check desta Etapa
                          </button>
                        </div>
                      )}

                      {/* Alerta e Botão de Confirmação de Início (quando não iniciada e não concluída) */}
                      {!isConcluida && !tarefa.iniciada && (() => {
                        const alerta = obterAlertaInicio(tarefa.dataInicioPrevista, tarefa.iniciada, isConcluida);
                        return (
                          <div className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${alerta.tipo === 'INICIO_ATRASADO'
                              ? 'bg-rose-50/80 border-rose-200'
                              : alerta.tipo === 'INICIO_HOJE'
                                ? 'bg-amber-50/90 border-amber-300 shadow-2xs'
                                : 'bg-indigo-50/50 border-indigo-100'
                            }`}>
                            <div className="flex items-start gap-2.5">
                              <div className={`p-1.5 rounded-lg flex-shrink-0 mt-0.5 ${alerta.tipo === 'INICIO_ATRASADO'
                                  ? 'bg-rose-100 text-rose-700'
                                  : alerta.tipo === 'INICIO_HOJE'
                                    ? 'bg-amber-200 text-amber-900 font-black'
                                    : 'bg-indigo-100 text-indigo-700'
                                }`}>
                                <Clock className="w-4 h-4" />
                              </div>
                              <div>
                                <span className="text-xs font-bold text-slate-800 block">
                                  Início Previsto: {formatarDataBR(tarefa.dataInicioPrevista)} ({tarefa.duracaoDias} {tarefa.duracaoDias === 1 ? 'dia' : 'dias'})
                                </span>
                                <span className={`text-[11px] block mt-0.5 ${alerta.tipo === 'INICIO_ATRASADO' ? 'text-rose-700 font-semibold' :
                                    alerta.tipo === 'INICIO_HOJE' ? 'text-amber-900 font-bold' :
                                      'text-slate-600 font-medium'
                                  }`}>
                                  {alerta.mensagem}
                                </span>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => abrirConfirmarInicioTarefa(tarefa)}
                              className="bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-xs px-3.5 py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer flex-shrink-0"
                            >
                              <Play className="w-3.5 h-3.5 fill-current" />
                              Confirmar Início da Tarefa
                            </button>
                          </div>
                        );
                      })()}

                      {/* Status de Trabalhos Iniciados (quando iniciada e não concluída) */}
                      {!isConcluida && tarefa.iniciada && (
                        <div className="p-2.5 bg-indigo-50/60 border border-indigo-100 rounded-xl flex items-center justify-between gap-2 text-xs">
                          <div className="flex items-center gap-2 text-indigo-950 font-medium">
                            <Play className="w-3.5 h-3.5 text-indigo-600 fill-current" />
                            <span>
                              Trabalhos iniciados no canteiro em <strong>{formatarDataBR(tarefa.dataInicioReal || tarefa.dataInicioPrevista)}</strong>
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => solicitarDesfazerInicio(tarefa)}
                            className="text-[11px] text-slate-500 hover:text-amber-700 font-medium hover:underline flex items-center gap-1 cursor-pointer"
                            title="Desfazer marcação de início"
                          >
                            <Undo2 className="w-3 h-3" />
                            Desfazer início
                          </button>
                        </div>
                      )}

                      {/* Bloco de Orçamento Previsto da Tarefa */}
                      {(() => {
                        const somaSubsCard = somarOrcamentoSubtarefas(tarefa.subtarefas);
                        const orcTarefaCard = tarefa.orcamentoPrevisto && tarefa.orcamentoPrevisto > 0 ? tarefa.orcamentoPrevisto : undefined;
                        const orcEfetivo = Math.max(orcTarefaCard || 0, somaSubsCard);

                        if (orcEfetivo <= 0) return null;

                        return (
                          <div className="my-2 p-2.5 bg-emerald-50/70 rounded-xl border border-emerald-100 flex items-center justify-between gap-2 text-xs">
                            <div className="flex items-center gap-2 min-w-0">
                              <div className="p-1.5 bg-emerald-100 text-emerald-700 rounded-lg">
                                <Coins className="w-3.5 h-3.5" />
                              </div>
                              <div className="min-w-0">
                                <span className="text-[11px] text-emerald-800 font-medium block">Orçamento Previsto da Etapa</span>
                                <div className="flex items-baseline gap-1.5 flex-wrap">
                                  <span className="text-xs font-bold text-emerald-900">
                                    R$ {orcEfetivo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                  </span>
                                  {somaSubsCard > 0 && (
                                    <span className="text-[10px] text-emerald-700 font-medium">
                                      (Subtarefas: R$ {somaSubsCard.toLocaleString('pt-BR', { minimumFractionDigits: 2 })})
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })()}

                      {/* Bloco de Despesas da Tarefa */}
                      <div className="my-2.5 p-2.5 bg-slate-50/80 rounded-xl border border-slate-200/70">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-rose-100 text-rose-600 rounded-lg">
                              <Receipt className="w-3.5 h-3.5" />
                            </div>
                            <div>
                              <span className="text-[11px] text-slate-500 font-medium block">Despesas da Etapa</span>
                              <div className="flex items-baseline gap-1.5 flex-wrap">
                                <span className="text-xs font-bold text-slate-800">
                                  R$ {totalDespesasRealizadas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </span>
                                {totalPrevisaoDespesas > 0 && (
                                  <span className="text-[10px] text-amber-700 font-semibold">
                                    (+ R$ {totalPrevisaoDespesas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} previstos)
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {itensDestaTarefa.length > 0 && (
                            <button
                              type="button"
                              onClick={() => toggleDespesasTarefa(tarefa.id)}
                              className="text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1 bg-white px-2 py-1 rounded-lg border border-slate-200/80 transition-colors cursor-pointer"
                            >
                              {itensDestaTarefa.length} {itensDestaTarefa.length === 1 ? 'item' : 'itens'}
                              {isDespesasOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                            </button>
                          )}
                        </div>

                        {/* Lista detalhada dos itens de despesa se expandido */}
                        {isDespesasOpen && itensDestaTarefa.length > 0 && (
                          <div className="mt-2.5 pt-2 border-t border-slate-200/60 space-y-1.5">
                            {itensDestaTarefa.map(it => {
                              const subVinculada = subtarefas.find(s => s.id === it.subtarefaId);
                              const cat = it.categoria || 'Material';
                              return (
                                <div key={it.id} className="flex items-center justify-between text-xs py-1.5 border-b border-slate-100 last:border-0">
                                  <div className="min-w-0 pr-2">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <span className="font-semibold text-slate-700 truncate">{it.item}</span>
                                      <span className="text-[9px] bg-slate-100 text-slate-600 font-semibold px-1.5 py-0.5 rounded border border-slate-200/70">
                                        {cat}
                                      </span>
                                      {it.isPrevisao && (
                                        <span className="text-[9px] bg-amber-100 text-amber-800 font-bold px-1 rounded flex items-center gap-0.5">
                                          <Clock className="w-2.5 h-2.5" />
                                          Previsão
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-0.5 flex-wrap">
                                      <span>{new Date(it.dataNecessidade + 'T00:00:00').toLocaleDateString('pt-BR')}</span>
                                      {it.quantidade && it.quantidade > 1 && (
                                        <>
                                          <span>•</span>
                                          <span>{it.quantidade}x R$ {it.valorUnitario.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                        </>
                                      )}
                                      {subVinculada ? (
                                        <>
                                          <span>•</span>
                                          <span className="bg-indigo-50 text-indigo-700 px-1 rounded font-medium truncate max-w-[140px]">
                                            Sub: {subVinculada.titulo}
                                          </span>
                                        </>
                                      ) : (
                                        <>
                                          <span>•</span>
                                          <span className="text-slate-400 italic">
                                            Geral da etapa
                                          </span>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                  <span className={`font-bold whitespace-nowrap text-xs ${it.isPrevisao ? 'text-amber-700' : 'text-rose-600'}`}>
                                    R$ {it.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* Sub-tarefas Lista & Progresso */}
                      <div className="mt-3 pt-3 border-t border-slate-100">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                            <ListChecks className="w-3.5 h-3.5 text-indigo-500" />
                            Sub-tarefas
                            {totalSubs > 0 && (
                              <span className="text-[11px] font-normal text-slate-500">
                                ({concluidasSubs}/{totalSubs})
                              </span>
                            )}
                          </span>
                          {totalSubs > 0 && (
                            <span className="text-xs font-bold text-indigo-600">
                              {progressoSubs}%
                            </span>
                          )}
                        </div>

                        {/* Mini barra de progresso das sub-tarefas */}
                        {totalSubs > 0 && (
                          <div className="w-full bg-slate-100 rounded-full h-1.5 mb-2.5 overflow-hidden">
                            <div
                              className={`h-1.5 rounded-full transition-all duration-300 ${progressoSubs === 100 ? 'bg-emerald-500' : 'bg-indigo-500'
                                }`}
                              style={{ width: `${progressoSubs}%` }}
                            />
                          </div>
                        )}

                        {/* Lista de Sub-tarefas */}
                        {totalSubs > 0 && (
                          <div className="space-y-1.5 mb-2.5">
                            {subtarefas.map(sub => {
                              // Despesas específicas desta subtarefa (filtradas a partir dos itens de despesa)
                              const itensDestaSub = itensDestaTarefa.filter(it => it.subtarefaId === sub.id);
                              const totalGastoSub = itensDestaSub.filter(it => !it.isPrevisao).reduce((acc, it) => acc + it.valorTotal, 0);
                              const totalPrevisaoSub = itensDestaSub.filter(it => it.isPrevisao).reduce((acc, it) => acc + it.valorTotal, 0);

                              return (
                                <div
                                  key={sub.id}
                                  className="flex items-center justify-between bg-slate-50 hover:bg-slate-100/80 px-2.5 py-1.5 rounded-lg border border-slate-100 group/sub transition-colors"
                                >
                                  <div className="flex items-start gap-2 flex-1 min-w-0">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (sub.concluida) {
                                          solicitarDesfazerCheckSubtarefa(tarefa, sub);
                                        } else {
                                          const hojeStr = new Date().toISOString().split('T')[0];
                                          setSubtarefaParaCheckin({
                                            tarefa,
                                            subtarefa: sub,
                                            dataConclusao: hojeStr,
                                            foto: ''
                                          });
                                        }
                                      }}
                                      className="cursor-pointer text-slate-400 hover:text-indigo-600 transition-colors mt-0.5 flex-shrink-0"
                                      title={sub.concluida ? "Desfazer check" : "Marcar como concluída"}
                                    >
                                      {sub.concluida ? (
                                        <CheckSquare className="w-4 h-4 text-emerald-600" />
                                      ) : (
                                        <Square className="w-4 h-4 text-slate-400 hover:text-slate-600" />
                                      )}
                                    </button>

                                    <div className="flex flex-col min-w-0 flex-1">
                                      <div
                                        onClick={() => {
                                          if (sub.concluida) {
                                            solicitarDesfazerCheckSubtarefa(tarefa, sub);
                                          } else {
                                            const hojeStr = new Date().toISOString().split('T')[0];
                                            setSubtarefaParaCheckin({
                                              tarefa,
                                              subtarefa: sub,
                                              dataConclusao: hojeStr,
                                              foto: ''
                                            });
                                          }
                                        }}
                                        className="flex items-center gap-1.5 flex-wrap cursor-pointer select-none"
                                      >
                                        <span className={`text-xs truncate ${sub.concluida ? 'line-through text-slate-400' : 'text-slate-700 hover:text-indigo-600'}`}>
                                          {sub.titulo}
                                        </span>
                                        {sub.categoria && sub.categoria !== tarefa.categoria && (
                                          <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${getInfoCategoria(sub.categoria).corBadge}`}>
                                            {getInfoCategoria(sub.categoria).nome}
                                          </span>
                                        )}
                                        {totalGastoSub > 0 && (
                                          <span className="text-[10px] font-bold text-rose-600 bg-rose-50 border border-rose-100 px-1.5 py-0.2 rounded-md" title={`Gasto realizado nesta subtarefa: R$ ${totalGastoSub.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}>
                                            R$ {totalGastoSub.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                          </span>
                                        )}
                                        {totalPrevisaoSub > 0 && (
                                          <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded-md" title={`Previsão de gasto nesta subtarefa: R$ ${totalPrevisaoSub.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}>
                                            +{totalPrevisaoSub.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                          </span>
                                        )}
                                      </div>
                                      {sub.concluida && sub.dataConclusao && (
                                        <span className="text-[10px] text-emerald-600 font-medium flex items-center gap-1 mt-0.5">
                                          <CalendarCheck className="w-2.5 h-2.5" />
                                          Check: {new Date(sub.dataConclusao + 'T00:00:00').toLocaleDateString('pt-BR')}
                                        </span>
                                      )}

                                      {/* Fotos de Comprovação da Subtarefa */}
                                      {sub.fotosExecucao && sub.fotosExecucao.length > 0 && (
                                        <div className="flex items-center gap-1 mt-1 flex-wrap">
                                          {sub.fotosExecucao.map((foto, fIdx) => (
                                            <button
                                              key={fIdx}
                                              type="button"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                setFotoVisualizacao({
                                                  url: foto,
                                                  titulo: `Comprovação: ${sub.titulo} (${tarefa.titulo})`
                                                });
                                              }}
                                              className="relative rounded-md overflow-hidden border border-slate-200 hover:ring-2 hover:ring-indigo-400 transition-all cursor-pointer shadow-2xs"
                                              title="Visualizar foto de comprovação"
                                            >
                                              <img src={foto} alt={`Comprovação ${fIdx + 1}`} className="w-6 h-6 object-cover" />
                                            </button>
                                          ))}
                                          <span className="text-[10px] text-slate-500 font-medium flex items-center gap-0.5 ml-0.5">
                                            <Camera className="w-2.5 h-2.5 text-slate-400" />
                                            {sub.fotosExecucao.length}
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-0.5 flex-shrink-0">
                                    <button
                                      type="button"
                                      title="Editar sub-tarefa e fotos"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        const hojeStr = new Date().toISOString().split('T')[0];
                                        setSubtarefaEmEdicao({
                                          tarefa,
                                          subtarefa: sub,
                                          titulo: sub.titulo,
                                          categoria: sub.categoria || tarefa.categoria,
                                          orcamentoPrevisto: sub.orcamentoPrevisto,
                                          concluida: sub.concluida,
                                          dataConclusao: sub.dataConclusao || (sub.concluida ? hojeStr : ''),
                                          fotosExecucao: sub.fotosExecucao ? [...sub.fotosExecucao] : []
                                        });
                                      }}
                                      className="opacity-70 hover:opacity-100 text-slate-400 hover:text-indigo-600 p-1 cursor-pointer transition-colors"
                                    >
                                      <Pencil className="w-3.5 h-3.5" />
                                    </button>

                                    <button
                                      type="button"
                                      title="Remover sub-tarefa"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        solicitarExclusaoSubtarefa(tarefa, sub);
                                      }}
                                      className="opacity-70 hover:opacity-100 text-slate-400 hover:text-rose-500 p-1 cursor-pointer transition-colors"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* Input rápido para adicionar sub-tarefa */}
                        <div className="flex gap-1.5 mt-2">
                          <input
                            type="text"
                            placeholder="+ Nova sub-tarefa..."
                            value={novaSubtarefaPorId[tarefa.id] || ''}
                            onChange={e => setNovaSubtarefaPorId(prev => ({ ...prev, [tarefa.id]: e.target.value }))}
                            onKeyDown={e => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAdicionarSubtarefaRapida(tarefa);
                              }
                            }}
                            className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          />
                          <button
                            type="button"
                            onClick={() => handleAdicionarSubtarefaRapida(tarefa)}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors"
                          >
                            Adicionar
                          </button>
                        </div>
                      </div>

                      {/* Fotos da Execução */}
                      {tarefa.fotosExecucao && tarefa.fotosExecucao.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-slate-100">
                          <span className="text-[11px] font-semibold text-slate-500 block mb-1.5">
                            Fotos de Comprovação:
                          </span>
                          <div className="flex gap-2 overflow-x-auto pb-1">
                            {tarefa.fotosExecucao.map((foto, idx) => (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => setFotoVisualizacao({
                                  url: foto,
                                  titulo: `Comprovação da Etapa: ${tarefa.titulo}`
                                })}
                                className="rounded-xl overflow-hidden border border-slate-200 shadow-2xs hover:ring-2 hover:ring-indigo-400 transition-all cursor-pointer flex-shrink-0"
                                title="Clique para ampliar"
                              >
                                <img
                                  src={foto}
                                  alt={`Execução ${idx + 1}`}
                                  className="w-16 h-16 object-cover"
                                />
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Botão de Check-in / Concluir */}
                      {!isConcluida ? (
                        <div className="mt-4 pt-3 border-t border-slate-100">
                          {!isCheckinOpen ? (
                            <button
                              type="button"
                              onClick={() => {
                                setTarefaSelecionadaCheckin(tarefa.id);
                                setFotoCheckin('');
                                setDataCheckin(new Date().toISOString().split('T')[0]);
                              }}
                              className="w-full bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white text-xs font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-xs"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              Finalizar Etapa com Foto (Check-in)
                            </button>
                          ) : (
                            <div className="bg-emerald-50/50 p-3.5 rounded-xl border border-emerald-100 space-y-3">
                              <div className="flex justify-between items-center">
                                <p className="text-xs font-bold text-emerald-900">Comprovar Conclusão da Tarefa</p>
                                <button
                                  type="button"
                                  onClick={() => setTarefaSelecionadaCheckin(null)}
                                  className="text-xs text-slate-400 hover:text-slate-600"
                                >
                                  Fechar
                                </button>
                              </div>

                              <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Data do Check / Conclusão</label>
                                <input
                                  type="date"
                                  value={dataCheckin}
                                  onChange={e => setDataCheckin(e.target.value)}
                                  className="w-full bg-white border border-emerald-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                />
                              </div>

                              <ImageUploader onImageSelected={setFotoCheckin} label="Anexar Foto de Execução" preview={fotoCheckin} />

                              <button
                                type="button"
                                onClick={() => handleCheckin(tarefa.id)}
                                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl text-xs transition-colors shadow-sm"
                              >
                                Confirmar Conclusão da Etapa
                              </button>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="mt-4 pt-3 border-t border-emerald-100 flex items-center justify-between">
                          <div className="flex items-center gap-1.5 text-xs text-emerald-800 font-semibold">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span>Etapa Finalizada com Sucesso</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => solicitarDesfazerCheckTarefa(tarefa)}
                            className="text-xs text-amber-700 hover:text-amber-800 hover:bg-amber-100/80 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200 transition-all flex items-center gap-1.5 font-bold cursor-pointer active:scale-95 shadow-2xs"
                          >
                            <Undo2 className="w-3.5 h-3.5 text-amber-600" />
                            Desfazer Check
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {tarefas.length === 0 && !showNovaTarefa && (
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-100 p-6">
          <ListChecks className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="text-slate-500 font-medium text-sm">Nenhuma etapa cadastrada no cronograma.</p>
          <button
            onClick={() => setShowNovaTarefa(true)}
            className="mt-3 text-indigo-600 font-semibold text-xs hover:underline"
          >
            Criar a primeira tarefa
          </button>
        </div>
      )}

      {/* Modal / Diálogo de Edição de Tarefa */}
      {tarefaEmEdicao && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs justify-center p-4 z-50">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[80vh]">
            <div className="p-4 bg-slate-900 text-white flex justify-between items-center">
              <h3 className="font-bold text-base flex items-center gap-2">
                <Pencil className="w-4 h-4 text-indigo-400" />
                Editar Tarefa
              </h3>
              <button
                type="button"
                onClick={() => setTarefaEmEdicao(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSalvarEdicao} className="p-5 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Título da Tarefa</label>
                <input
                  required
                  type="text"
                  value={tarefaEmEdicao.titulo}
                  onChange={e => setTarefaEmEdicao({ ...tarefaEmEdicao, titulo: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Categoria da Tarefa no Modal de Edição */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-indigo-600" />
                  Categoria da Etapa
                </label>
                <select
                  value={tarefaEmEdicao.categoria || sugerirCategoriaPorTitulo(tarefaEmEdicao.titulo)}
                  onChange={e => setTarefaEmEdicao({ ...tarefaEmEdicao, categoria: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                  {CATEGORIAS_ETAPAS.map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.numero}. {cat.nome}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-400 mt-1">
                  {getInfoCategoria(tarefaEmEdicao.categoria || sugerirCategoriaPorTitulo(tarefaEmEdicao.titulo)).descricao}
                </p>
              </div>

              {/* Prazos: Início Previsto e Fim Previsto */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Início Previsto</label>
                  <input
                    required
                    type="date"
                    value={tarefaEmEdicao.dataInicioPrevista || ''}
                    onChange={e => {
                      const novoInicio = e.target.value;
                      const novaDuracao = calcularDuracaoDias(novoInicio, tarefaEmEdicao.dataFimPrevista);
                      setTarefaEmEdicao({
                        ...tarefaEmEdicao,
                        dataInicioPrevista: novoInicio,
                        duracaoDias: novaDuracao
                      });
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Fim Previsto</label>
                  <input
                    required
                    type="date"
                    value={tarefaEmEdicao.dataFimPrevista}
                    onChange={e => {
                      const novoFim = e.target.value;
                      const novaDuracao = calcularDuracaoDias(tarefaEmEdicao.dataInicioPrevista, novoFim);
                      setTarefaEmEdicao({
                        ...tarefaEmEdicao,
                        dataFimPrevista: novoFim,
                        duracaoDias: novaDuracao
                      });
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Duração Calculada */}
              <div className="bg-indigo-50/70 border border-indigo-100 rounded-xl p-2.5 flex items-center justify-between text-xs">
                <span className="text-slate-600 font-medium">Duração calculada:</span>
                <span className="font-bold text-indigo-700 bg-white px-2 py-0.5 rounded-md shadow-2xs border border-indigo-100">
                  {calcularDuracaoDias(tarefaEmEdicao.dataInicioPrevista, tarefaEmEdicao.dataFimPrevista)} {calcularDuracaoDias(tarefaEmEdicao.dataInicioPrevista, tarefaEmEdicao.dataFimPrevista) === 1 ? 'dia' : 'dias'}
                </span>
              </div>

              {/* Orçamento Previsto */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Coins className="w-3.5 h-3.5 text-emerald-600" />
                    Orçamento Previsto da Etapa (R$)
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal">Para controle e notificações</span>
                </label>
                {(() => {
                  const somaSubsEdicaoForm = somarOrcamentoSubtarefas(tarefaEmEdicao.subtarefas);
                  const isMenorQueSubs = somaSubsEdicaoForm > 0 && (tarefaEmEdicao.orcamentoPrevisto === undefined || tarefaEmEdicao.orcamentoPrevisto < somaSubsEdicaoForm);

                  return (
                    <>
                      <input
                        type="number"
                        step="0.01"
                        min={somaSubsEdicaoForm > 0 ? somaSubsEdicaoForm : 0}
                        placeholder="0,00"
                        value={tarefaEmEdicao.orcamentoPrevisto !== undefined ? tarefaEmEdicao.orcamentoPrevisto : ''}
                        onChange={e => {
                          const val = e.target.value === '' ? undefined : parseFloat(e.target.value);
                          setTarefaEmEdicao({ ...tarefaEmEdicao, orcamentoPrevisto: val });
                        }}
                        className={`w-full bg-slate-50 border rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 font-medium ${isMenorQueSubs
                            ? 'border-rose-400 focus:ring-rose-500'
                            : 'border-slate-200 focus:ring-emerald-500'
                          }`}
                      />

                      {somaSubsEdicaoForm > 0 && (
                        <div className={`mt-1.5 p-2 rounded-lg text-xs flex items-center justify-between gap-2 ${isMenorQueSubs
                            ? 'bg-rose-50 border border-rose-200 text-rose-800'
                            : 'bg-emerald-50/70 border border-emerald-100 text-emerald-800'
                          }`}>
                          <div className="flex items-center gap-1.5 min-w-0">
                            {isMenorQueSubs ? (
                              <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                            ) : (
                              <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            )}
                            <span className="text-[11px] truncate">
                              {isMenorQueSubs
                                ? `Não pode ser menor que o somatório das subtarefas (Mín: R$ ${somaSubsEdicaoForm.toLocaleString('pt-BR', { minimumFractionDigits: 2 })})`
                                : `Cobre o somatório das subtarefas (R$ ${somaSubsEdicaoForm.toLocaleString('pt-BR', { minimumFractionDigits: 2 })})`}
                            </span>
                          </div>
                          {isMenorQueSubs && (
                            <button
                              type="button"
                              onClick={() => setTarefaEmEdicao({ ...tarefaEmEdicao, orcamentoPrevisto: somaSubsEdicaoForm })}
                              className="text-[10px] font-bold bg-rose-600 hover:bg-rose-700 text-white px-2 py-1 rounded-md shrink-0 cursor-pointer shadow-2xs transition-colors"
                            >
                              Ajustar para R$ {somaSubsEdicaoForm.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </button>
                          )}
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>

              {/* Status de Início Real */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!tarefaEmEdicao.iniciada}
                    onChange={e => {
                      const iniciada = e.target.checked;
                      const hojeStr = new Date().toISOString().split('T')[0];
                      setTarefaEmEdicao({
                        ...tarefaEmEdicao,
                        iniciada,
                        dataInicioReal: iniciada ? (tarefaEmEdicao.dataInicioReal || hojeStr) : undefined
                      });
                    }}
                    className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4 cursor-pointer"
                  />
                  <span className="text-xs font-bold text-slate-800">
                    Tarefa já iniciada no canteiro de obras
                  </span>
                </label>

                {tarefaEmEdicao.iniciada && (
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Data do Início Real
                    </label>
                    <input
                      type="date"
                      value={tarefaEmEdicao.dataInicioReal || ''}
                      onChange={e => setTarefaEmEdicao({ ...tarefaEmEdicao, dataInicioReal: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Status</label>
                  <select
                    value={tarefaEmEdicao.status}
                    onChange={e => {
                      const novoStatus = e.target.value as TarefaStatus;
                      const hojeStr = new Date().toISOString().split('T')[0];
                      setTarefaEmEdicao({
                        ...tarefaEmEdicao,
                        status: novoStatus,
                        dataConclusao: novoStatus === 'CONCLUIDA' ? (tarefaEmEdicao.dataConclusao || hojeStr) : undefined
                      });
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="PENDENTE">Pendente / Em Andamento</option>
                    <option value="CONCLUIDA">Concluída</option>
                    <option value="ATRASADA">Atrasada</option>
                  </select>
                </div>

                {tarefaEmEdicao.status === 'CONCLUIDA' && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Data do Check</label>
                    <input
                      type="date"
                      value={tarefaEmEdicao.dataConclusao || ''}
                      onChange={e => setTarefaEmEdicao({ ...tarefaEmEdicao, dataConclusao: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                )}
              </div>

              {/* Subtarefas no Modal de Edição */}
              <div className="pt-2 border-t border-slate-100">
                <label className="block text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
                  <ListChecks className="w-4 h-4 text-indigo-600" />
                  Sub-tarefas da Etapa
                </label>

                {/* Subtarefas cadastradas */}
                <div className="space-y-1.5 mb-3 max-h-36 overflow-y-auto pr-1">
                  {(tarefaEmEdicao.subtarefas || []).map((sub, idx) => (
                    <div key={sub.id} className="flex items-center justify-between bg-slate-50 p-2 rounded-lg border border-slate-200">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <input
                          type="checkbox"
                          checked={sub.concluida}
                          onChange={() => {
                            if (sub.concluida) {
                              solicitarDesfazerCheckSubtarefa(tarefaEmEdicao, sub);
                            } else {
                              const hojeStr = new Date().toISOString().split('T')[0];
                              setSubtarefaParaCheckin({
                                tarefa: tarefaEmEdicao,
                                subtarefa: sub,
                                dataConclusao: hojeStr,
                                foto: ''
                              });
                            }
                          }}
                          className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4 cursor-pointer"
                        />
                        <div className="flex flex-col min-w-0">
                          <span className={`text-xs truncate ${sub.concluida ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                            {sub.titulo}
                          </span>
                          <div className="flex items-center gap-2 flex-wrap">
                            {sub.concluida && sub.dataConclusao && (
                              <span className="text-[10px] text-emerald-600">
                                Check: {new Date(sub.dataConclusao + 'T00:00:00').toLocaleDateString('pt-BR')}
                              </span>
                            )}
                            {sub.fotosExecucao && sub.fotosExecucao.length > 0 && (
                              <span className="text-[10px] text-indigo-600 font-semibold flex items-center gap-0.5">
                                <Camera className="w-2.5 h-2.5" />
                                {sub.fotosExecucao.length} {sub.fotosExecucao.length === 1 ? 'foto' : 'fotos'}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          type="button"
                          title="Editar sub-tarefa e fotos"
                          onClick={() => {
                            const hojeStr = new Date().toISOString().split('T')[0];
                            setSubtarefaEmEdicao({
                              tarefa: tarefaEmEdicao,
                              subtarefa: sub,
                              titulo: sub.titulo,
                              categoria: sub.categoria,
                              orcamentoPrevisto: sub.orcamentoPrevisto,
                              concluida: sub.concluida,
                              dataConclusao: sub.dataConclusao || (sub.concluida ? hojeStr : ''),
                              fotosExecucao: sub.fotosExecucao ? [...sub.fotosExecucao] : []
                            });
                          }}
                          className="text-slate-400 hover:text-indigo-600 p-1 cursor-pointer transition-colors"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          title="Excluir sub-tarefa"
                          onClick={() => solicitarExclusaoSubtarefa(tarefaEmEdicao, sub)}
                          className="text-slate-400 hover:text-rose-500 p-1 cursor-pointer transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}

                  {(!tarefaEmEdicao.subtarefas || tarefaEmEdicao.subtarefas.length === 0) && (
                    <p className="text-xs text-slate-400 italic py-1">Nenhuma sub-tarefa nesta etapa.</p>
                  )}
                </div>

                {/* Adicionar nova sub-tarefa na edição */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    id="input-sub-edicao"
                    placeholder="Adicionar nova sub-tarefa..."
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const input = e.currentTarget;
                        const val = input.value.trim();
                        if (val) {
                          const novaSub: SubTarefa = { id: generateId(), titulo: val, concluida: false };
                          setTarefaEmEdicao({
                            ...tarefaEmEdicao,
                            subtarefas: [...(tarefaEmEdicao.subtarefas || []), novaSub]
                          });
                          input.value = '';
                        }
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const input = document.getElementById('input-sub-edicao') as HTMLInputElement | null;
                      if (input && input.value.trim()) {
                        const novaSub: SubTarefa = { id: generateId(), titulo: input.value.trim(), concluida: false };
                        setTarefaEmEdicao({
                          ...tarefaEmEdicao,
                          subtarefas: [...(tarefaEmEdicao.subtarefas || []), novaSub]
                        });
                        input.value = '';
                      }
                    }}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-3 py-2 rounded-xl"
                  >
                    <Plus />
                  </button>
                </div>
              </div>

              {/* Fotos de Comprovação de Conclusão da Tarefa */}
              <div className="pt-3 border-t border-slate-100 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-indigo-600" />
                    Fotos de Comprovação da Tarefa
                  </label>
                  {tarefaEmEdicao.fotosExecucao && tarefaEmEdicao.fotosExecucao.length > 0 && (
                    <span className="text-[10px] font-semibold text-slate-500">
                      {tarefaEmEdicao.fotosExecucao.length} {tarefaEmEdicao.fotosExecucao.length === 1 ? 'foto anexada' : 'fotos anexadas'}
                    </span>
                  )}
                </div>

                {/* Miniaturas de fotos existentes na tarefa com opção de exclusão */}
                {tarefaEmEdicao.fotosExecucao && tarefaEmEdicao.fotosExecucao.length > 0 && (
                  <div className="flex gap-2 overflow-x-auto pb-1 pt-1">
                    {tarefaEmEdicao.fotosExecucao.map((foto, idx) => (
                      <div key={idx} className="relative group/foto flex-shrink-0">
                        <img
                          src={foto}
                          alt={`Comprovação ${idx + 1}`}
                          onClick={() => setFotoVisualizacao({
                            url: foto,
                            titulo: `Comprovação da Etapa: ${tarefaEmEdicao.titulo}`
                          })}
                          className="w-14 h-14 object-cover rounded-xl border border-slate-200 shadow-2xs cursor-pointer hover:opacity-90 transition-opacity"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const novas = (tarefaEmEdicao.fotosExecucao || []).filter((_, i) => i !== idx);
                            setTarefaEmEdicao({ ...tarefaEmEdicao, fotosExecucao: novas });
                          }}
                          className="absolute -top-1.5 -right-1.5 bg-rose-600 hover:bg-rose-700 text-white p-0.5 rounded-full shadow-xs cursor-pointer"
                          title="Remover foto"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <ImageUploader
                  label="Adicionar Foto de Comprovação da Tarefa"
                  onImageSelected={(base64) => {
                    if (base64) {
                      setTarefaEmEdicao({
                        ...tarefaEmEdicao,
                        fotosExecucao: [...(tarefaEmEdicao.fotosExecucao || []), base64]
                      });
                    }
                  }}
                />
              </div>

              <div className="flex gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setTarefaEmEdicao(null)}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md transition-colors"
                >
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Início de Tarefa */}
      {modalIniciarTarefa && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col">
            <div className="p-4 bg-indigo-600 text-white flex justify-between items-center">
              <h3 className="font-bold text-base flex items-center gap-2">
                <Play className="w-4 h-4 fill-current" />
                Confirmar Início da Tarefa
              </h3>
              <button
                type="button"
                onClick={() => setModalIniciarTarefa(null)}
                className="text-indigo-200 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="bg-indigo-50/60 border border-indigo-100 rounded-xl p-3.5 space-y-1.5">
                <span className="text-[11px] font-bold text-indigo-700 uppercase tracking-wider block">Etapa a Iniciar</span>
                <h4 className="font-bold text-sm text-slate-800">{modalIniciarTarefa.tarefa.titulo}</h4>
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 pt-1">
                  <span>Previsão: {formatarDataBR(modalIniciarTarefa.tarefa.dataInicioPrevista)} a {formatarDataBR(modalIniciarTarefa.tarefa.dataFimPrevista)}</span>
                  <span>•</span>
                  <span className="font-bold text-indigo-700">{modalIniciarTarefa.tarefa.duracaoDias} {modalIniciarTarefa.tarefa.duracaoDias === 1 ? 'dia' : 'dias'}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Data Real de Início dos Trabalhos
                </label>
                <input
                  type="date"
                  value={modalIniciarTarefa.dataInicioReal}
                  onChange={e => setModalIniciarTarefa({ ...modalIniciarTarefa, dataInicioReal: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Ao confirmar, esta etapa passará para o status de <strong>Em Andamento</strong> e não gerará mais alertas de início pendente.
                </p>
              </div>

              <div className="flex gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalIniciarTarefa(null)}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={executarConfirmarInicio}
                  className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  Confirmar Início
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação com exigência de 'estou ciente' */}
      {modalConfirmacao && (
        <ModalConfirmacaoCiente
          isOpen={modalConfirmacao.isOpen}
          titulo={modalConfirmacao.titulo}
          subtitulo={modalConfirmacao.subtitulo}
          descricao={modalConfirmacao.descricao}
          labelBotao={modalConfirmacao.labelBotao}
          tipo={modalConfirmacao.tipo || 'danger'}
          icone={modalConfirmacao.icone || 'alert'}
          onConfirm={modalConfirmacao.onConfirm}
          onCancel={() => setModalConfirmacao(null)}
        />
      )}

      {/* Modal de Check-in de Sub-tarefa com Foto de Comprovação */}
      {subtarefaParaCheckin && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col">
            <div className="p-4 bg-emerald-600 text-white flex justify-between items-center">
              <h3 className="font-bold text-base flex items-center gap-2">
                <CheckSquare className="w-5 h-5" />
                Concluir Sub-tarefa
              </h3>
              <button
                type="button"
                onClick={() => setSubtarefaParaCheckin(null)}
                className="text-emerald-100 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[82vh] overflow-y-auto">
              <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-3.5 space-y-1">
                <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
                  Sub-tarefa a Concluir
                </span>
                <h4 className="font-bold text-sm text-slate-800">
                  {subtarefaParaCheckin.subtarefa.titulo}
                </h4>
                <p className="text-xs text-slate-600">
                  Etapa: <strong>{subtarefaParaCheckin.tarefa.titulo}</strong>
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                  <CalendarCheck className="w-3.5 h-3.5 text-emerald-600" />
                  Data do Check / Conclusão
                </label>
                <input
                  type="date"
                  value={subtarefaParaCheckin.dataConclusao}
                  onChange={e => setSubtarefaParaCheckin({ ...subtarefaParaCheckin, dataConclusao: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5 text-emerald-600" />
                  Foto de Comprovação da Sub-tarefa
                </label>
                <ImageUploader
                  label="Tirar foto ou anexar da galeria"
                  preview={subtarefaParaCheckin.foto}
                  onImageSelected={base64 => setSubtarefaParaCheckin({ ...subtarefaParaCheckin, foto: base64 })}
                />
              </div>

              <div className="flex gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSubtarefaParaCheckin(null)}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleConcluirSubtarefa(
                      subtarefaParaCheckin.tarefa,
                      subtarefaParaCheckin.subtarefa.id,
                      subtarefaParaCheckin.dataConclusao,
                      subtarefaParaCheckin.foto || undefined
                    );
                  }}
                  className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  Confirmar Check
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Edição de Sub-tarefa (com fotos de comprovação) */}
      {subtarefaEmEdicao && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[80vh]">
            <div className="p-4 bg-indigo-600 text-white flex justify-between items-center">
              <h3 className="font-bold text-base flex items-center gap-2">
                <Pencil className="w-4 h-4" />
                Editar Sub-tarefa
              </h3>
              <button
                type="button"
                onClick={() => setSubtarefaEmEdicao(null)}
                className="text-indigo-200 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSalvarEdicaoSubtarefa} className="p-5 space-y-4 max-h-[82vh] overflow-y-auto">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  Etapa Principal
                </span>
                <p className="font-bold text-xs text-slate-800 mt-0.5">
                  {subtarefaEmEdicao.tarefa.titulo}
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Título da Sub-tarefa *
                </label>
                <input
                  required
                  type="text"
                  value={subtarefaEmEdicao.titulo}
                  onChange={e => setSubtarefaEmEdicao({ ...subtarefaEmEdicao, titulo: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>

              {/* Categoria da Sub-tarefa */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-indigo-600" />
                  Categoria da Sub-tarefa
                </label>
                <select
                  value={subtarefaEmEdicao.categoria || subtarefaEmEdicao.subtarefa.categoria || subtarefaEmEdicao.tarefa.categoria || sugerirCategoriaPorTitulo(subtarefaEmEdicao.titulo)}
                  onChange={e => setSubtarefaEmEdicao({ ...subtarefaEmEdicao, categoria: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                  {CATEGORIAS_ETAPAS.map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.numero}. {cat.nome}
                    </option>
                  ))}
                </select>
              </div>

              {/* Orçamento Previsto da Sub-tarefa */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Coins className="w-3.5 h-3.5 text-emerald-600" />
                    Orçamento Previsto da Sub-tarefa (R$)
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal">Opcional</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0,00"
                  value={subtarefaEmEdicao.orcamentoPrevisto !== undefined ? subtarefaEmEdicao.orcamentoPrevisto : ''}
                  onChange={e => {
                    const val = e.target.value === '' ? undefined : parseFloat(e.target.value);
                    setSubtarefaEmEdicao({ ...subtarefaEmEdicao, orcamentoPrevisto: val });
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                />
                {(() => {
                  const tarefaPai = tarefas.find(t => t.id === subtarefaEmEdicao.tarefa.id) || subtarefaEmEdicao.tarefa;
                  const outrasSubs = (tarefaPai.subtarefas || []).filter(s => s.id !== subtarefaEmEdicao.subtarefa.id);
                  const somaOutras = somarOrcamentoSubtarefas(outrasSubs);
                  const novaSomaTotal = somaOutras + (subtarefaEmEdicao.orcamentoPrevisto || 0);
                  const orcPaiAtual = tarefaPai.orcamentoPrevisto || 0;
                  const vaiAumentarPai = novaSomaTotal > orcPaiAtual;

                  if (!vaiAumentarPai || novaSomaTotal <= 0) return null;

                  return (
                    <div className="mt-1.5 p-2 rounded-lg text-xs bg-indigo-50 border border-indigo-100 text-indigo-900 flex items-start gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
                      <p className="text-[11px] leading-tight">
                        A soma das subtarefas atingirá <strong>R$ {novaSomaTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>. O orçamento da tarefa principal <em>"{tarefaPai.titulo}"</em> será ajustado automaticamente para este valor para manter a consistência.
                      </p>
                    </div>
                  );
                })()}
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={subtarefaEmEdicao.concluida}
                    onChange={e => {
                      const checked = e.target.checked;
                      const hojeStr = new Date().toISOString().split('T')[0];
                      setSubtarefaEmEdicao({
                        ...subtarefaEmEdicao,
                        concluida: checked,
                        dataConclusao: checked ? (subtarefaEmEdicao.dataConclusao || hojeStr) : undefined
                      });
                    }}
                    className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4 cursor-pointer"
                  />
                  <span className="text-xs font-bold text-slate-700">Sub-tarefa Concluída</span>
                </label>

                {subtarefaEmEdicao.concluida && (
                  <div className="pt-2 border-t border-slate-200/80">
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1 flex items-center gap-1">
                      <CalendarCheck className="w-3.5 h-3.5 text-emerald-600" />
                      Data de Conclusão / Check
                    </label>
                    <input
                      type="date"
                      value={subtarefaEmEdicao.dataConclusao || new Date().toISOString().split('T')[0]}
                      onChange={e => setSubtarefaEmEdicao({ ...subtarefaEmEdicao, dataConclusao: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                )}
              </div>

              {/* Fotos de Comprovação da Subtarefa */}
              <div className="space-y-2 pt-1 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-indigo-600" />
                    Fotos de Comprovação de Conclusão
                  </label>
                  {subtarefaEmEdicao.fotosExecucao && subtarefaEmEdicao.fotosExecucao.length > 0 && (
                    <span className="text-[10px] font-semibold text-slate-500">
                      {subtarefaEmEdicao.fotosExecucao.length} {subtarefaEmEdicao.fotosExecucao.length === 1 ? 'foto' : 'fotos'}
                    </span>
                  )}
                </div>

                {/* Fotos existentes com botão de remoção */}
                {subtarefaEmEdicao.fotosExecucao && subtarefaEmEdicao.fotosExecucao.length > 0 && (
                  <div className="flex gap-2 overflow-x-auto pb-1 pt-1">
                    {subtarefaEmEdicao.fotosExecucao.map((foto, idx) => (
                      <div key={idx} className="relative group/subfoto flex-shrink-0">
                        <img
                          src={foto}
                          alt={`Foto ${idx + 1}`}
                          onClick={() => setFotoVisualizacao({
                            url: foto,
                            titulo: `Comprovação: ${subtarefaEmEdicao.titulo}`
                          })}
                          className="w-14 h-14 object-cover rounded-xl border border-slate-200 shadow-2xs cursor-pointer hover:opacity-90"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const novas = (subtarefaEmEdicao.fotosExecucao || []).filter((_, i) => i !== idx);
                            setSubtarefaEmEdicao({ ...subtarefaEmEdicao, fotosExecucao: novas });
                          }}
                          className="absolute -top-1.5 -right-1.5 bg-rose-600 hover:bg-rose-700 text-white p-0.5 rounded-full shadow-xs cursor-pointer"
                          title="Remover foto"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <ImageUploader
                  label="Adicionar Foto de Comprovação"
                  onImageSelected={base64 => {
                    if (base64) {
                      setSubtarefaEmEdicao({
                        ...subtarefaEmEdicao,
                        fotosExecucao: [...(subtarefaEmEdicao.fotosExecucao || []), base64]
                      });
                    }
                  }}
                />
              </div>

              <div className="flex gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSubtarefaEmEdicao(null)}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  Salvar Sub-tarefa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Lightbox para visualização de Foto em tela cheia */}
      {fotoVisualizacao && (
        <div
          onClick={() => setFotoVisualizacao(null)}
          className="fixed inset-0 bg-slate-950/85 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150 cursor-pointer"
        >
          <div
            onClick={e => e.stopPropagation()}
            className="bg-slate-900 text-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border border-slate-800 flex flex-col cursor-default"
          >
            <div className="p-3.5 bg-slate-950 border-b border-slate-800/80 flex justify-between items-center">
              <h4 className="font-bold text-xs text-slate-200 truncate flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-indigo-400" />
                {fotoVisualizacao.titulo || 'Foto de Comprovação'}
              </h4>
              <button
                type="button"
                onClick={() => setFotoVisualizacao(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-black flex items-center justify-center max-h-[75vh]">
              <img
                src={fotoVisualizacao.url}
                alt={fotoVisualizacao.titulo || 'Foto de Comprovação'}
                className="max-h-[70vh] max-w-full object-contain rounded-lg"
              />
            </div>

            <div className="p-3 bg-slate-950 border-t border-slate-800 text-center">
              <button
                type="button"
                onClick={() => setFotoVisualizacao(null)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Fechar Visualização
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
