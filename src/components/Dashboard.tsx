import React, { useState, useMemo } from 'react';
import { AppState, DiarioObra } from '../types';
import { 
  AlertTriangle, 
  Clock, 
  TrendingDown, 
  TrendingUp, 
  CheckCircle, 
  Receipt, 
  ChevronDown, 
  ChevronUp, 
  ListChecks, 
  PieChart, 
  Layers, 
  CheckCircle2,
  FolderTree,
  CalendarClock,
  ArrowRight,
  Package,
  Wrench,
  Truck,
  Utensils,
  PlayCircle,
  AlertOctagon,
  FileCheck2,
  Sparkles,
  Check,
  Edit3,
  CalendarDays,
  ExternalLink,
  Tag,
  BarChart3,
  Filter,
  Target,
  Hourglass
} from 'lucide-react';
import { ModalEditarRdoConfirmacao } from './ModalEditarRdoConfirmacao';
import { CATEGORIAS_ETAPAS, getInfoCategoria, sugerirCategoriaPorTitulo } from '../constants/categorias';

interface DashboardProps {
  state: AppState;
  onNavigateFinanceiro?: () => void;
  onNavigateCronograma?: (categoriaId?: string) => void;
  onNavigateDiario?: (diarioId?: string) => void;
  onConfirmarRdo?: (id: string) => void;
  onUpdateDiario?: (
    id: string,
    diario: DiarioObra,
    checks: { tarefaId: string; subtarefaId?: string; dataConclusao: string; concluirTarefaCompleta?: boolean }[]
  ) => void;
}

export function Dashboard({ 
  state, 
  onNavigateFinanceiro,
  onNavigateCronograma,
  onNavigateDiario,
  onConfirmarRdo,
  onUpdateDiario
}: DashboardProps) {
  const obraId = state.obraAtivaId;
  const [apenasComGastos, setApenasComGastos] = useState(false);
  const [modoAnaliseEtapas, setModoAnaliseEtapas] = useState<'GASTOS' | 'DURACAO' | 'PROGRESSO'>('GASTOS');
  const [apenasCategoriasComAtividades, setApenasCategoriasComAtividades] = useState(true);
  const [mostrarDetalhesEtapas, setMostrarDetalhesEtapas] = useState(false);
  const [mostrarDetalhesTarefas, setMostrarDetalhesTarefas] = useState(false);
  const [tipoAgrupamentoPizza, setTipoAgrupamentoPizza] = useState<'TIPO' | 'ETAPA'>('TIPO');
  const [categoriaPizzaHover, setCategoriaPizzaHover] = useState<string | null>(null);
  const [filtroCategoriaRelatorio, setFiltroCategoriaRelatorio] = useState<string>('TODAS');
  const [etapasExpandidas, setEtapasExpandidas] = useState<{ [tarefaId: string]: boolean }>({});
  const [diarioParaEditar, setDiarioParaEditar] = useState<DiarioObra | null>(null);
  const [modalEditarRdoAberto, setModalEditarRdoAberto] = useState(false);
  const [mensagemSucesso, setMensagemSucesso] = useState<string | null>(null);

  const toggleExpandirEtapa = (id: string) => {
    setEtapasExpandidas(prev => ({ ...prev, [id]: !prev[id] }));
  };

  if (!obraId) return <div className="p-6 text-center text-slate-500">Nenhuma obra selecionada.</div>;

  const obra = state.obras.find(o => o.id === obraId);
  const tarefas = state.tarefas.filter(t => t.obraId === obraId);
  const compras = state.compras.filter(c => c.obraId === obraId);
  const pagamentos = state.pagamentosCliente.filter(p => p.obraId === obraId);

  const hojeStr = new Date().toISOString().split('T')[0];

  // Cálculos Financeiros: Apenas itens CONFIRMADOS / CONTABILIZADOS entram no saldo real
  const pagamentosRealizados = pagamentos.filter(p => !p.isPrevisao);
  const comprasRealizadas = compras.filter(c => !c.isPrevisao);

  const totalRecebido = pagamentosRealizados.reduce((acc, curr) => acc + curr.valor, 0);
  const totalGasto = comprasRealizadas.reduce((acc, curr) => acc + curr.valorTotal, 0);
  const saldo = totalRecebido - totalGasto;

  // Previsões Futuras (Não contabilizadas ainda)
  const pagamentosPrevisao = pagamentos.filter(p => !!p.isPrevisao);
  const comprasPrevisao = compras.filter(c => !!c.isPrevisao);

  const totalPrevisaoReceita = pagamentosPrevisao.reduce((acc, curr) => acc + curr.valor, 0);
  const totalPrevisaoGasto = comprasPrevisao.reduce((acc, curr) => acc + curr.valorTotal, 0);
  const saldoProjetado = saldo + totalPrevisaoReceita - totalPrevisaoGasto;
  const totalPrevisoes = pagamentosPrevisao.length + comprasPrevisao.length;

  // Previsões com data já atingida aguardando confirmação
  const previsoesAtingidas = [
    ...comprasPrevisao.filter(c => c.dataNecessidade <= hojeStr).map(c => ({
      id: c.id,
      tipo: 'GASTO' as const,
      titulo: c.nomeMaterial,
      valor: c.valorTotal,
      data: c.dataNecessidade
    })),
    ...pagamentosPrevisao.filter(p => p.data <= hojeStr).map(p => ({
      id: p.id,
      tipo: 'RECEITA' as const,
      titulo: p.descricao || 'Recebimento de Cliente',
      valor: p.valor,
      data: p.data
    }))
  ];

  // Cálculos de Tarefas
  const totalTarefas = tarefas.length;
  const tarefasConcluidas = tarefas.filter(t => t.status === 'CONCLUIDA').length;
  const progresso = totalTarefas === 0 ? 0 : Math.round((tarefasConcluidas / totalTarefas) * 100);

  const totalSubtarefas = tarefas.reduce((acc, t) => acc + (t.subtarefas?.length || 0), 0);
  const subtarefasConcluidas = tarefas.reduce((acc, t) => acc + (t.subtarefas?.filter(s => s.concluida).length || 0), 0);

  // Agrupamento de Gastos por Tarefa e Subtarefa (apenas compras confirmadas contabilizadas)
  const relatorioTarefas = tarefas.map(tarefa => {
    const comprasDaTarefa = compras.filter(c => c.tarefaId === tarefa.id);
    const comprasRealizadasTarefa = comprasDaTarefa.filter(c => !c.isPrevisao);
    const comprasPrevisaoTarefa = comprasDaTarefa.filter(c => !!c.isPrevisao);

    const totalGastoTarefa = comprasRealizadasTarefa.reduce((acc, c) => acc + c.valorTotal, 0);
    const totalPrevisaoTarefa = comprasPrevisaoTarefa.reduce((acc, c) => acc + c.valorTotal, 0);
    const percentualDoTotal = totalGasto > 0 ? (totalGastoTarefa / totalGasto) * 100 : 0;

    // Subtarefas agrupadas
    const subtarefas = (tarefa.subtarefas || []).map(sub => {
      const comprasSub = comprasDaTarefa.filter(c => c.subtarefaId === sub.id);
      const comprasSubReal = comprasSub.filter(c => !c.isPrevisao);
      const totalGastoSub = comprasSubReal.reduce((acc, c) => acc + c.valorTotal, 0);
      const totalPrevisaoSub = comprasSub.filter(c => !!c.isPrevisao).reduce((acc, c) => acc + c.valorTotal, 0);
      const percentualDaTarefa = totalGastoTarefa > 0 ? (totalGastoSub / totalGastoTarefa) * 100 : 0;
      return {
        ...sub,
        totalGasto: totalGastoSub,
        totalPrevisao: totalPrevisaoSub,
        percentualDaTarefa,
        compras: comprasSub
      };
    });

    // Gastos gerais da tarefa (sem subtarefa específica)
    const comprasGeraisTarefa = comprasDaTarefa.filter(c => !c.subtarefaId);
    const totalGeraisTarefa = comprasGeraisTarefa.filter(c => !c.isPrevisao).reduce((acc, c) => acc + c.valorTotal, 0);
    const totalPrevisaoGeraisTarefa = comprasGeraisTarefa.filter(c => !!c.isPrevisao).reduce((acc, c) => acc + c.valorTotal, 0);

    return {
      ...tarefa,
      totalGasto: totalGastoTarefa,
      totalPrevisaoTarefa,
      percentualDoTotal,
      subtarefasComGastos: subtarefas,
      comprasGerais: comprasGeraisTarefa,
      totalGeraisTarefa,
      totalPrevisaoGeraisTarefa,
      quantidadeCompras: comprasDaTarefa.length
    };
  });

  // Compras sem tarefa vinculada (Despesas gerais da obra)
  const comprasSemTarefa = compras.filter(c => !c.tarefaId);
  const totalSemTarefa = comprasSemTarefa.filter(c => !c.isPrevisao).reduce((acc, c) => acc + c.valorTotal, 0);
  const percentualSemTarefa = totalGasto > 0 ? (totalSemTarefa / totalGasto) * 100 : 0;

  const totalAlocadoEmTarefas = relatorioTarefas.reduce((acc, t) => acc + t.totalGasto, 0);
  const percentualAlocado = totalGasto > 0 ? (totalAlocadoEmTarefas / totalGasto) * 100 : 0;

  // Agrupamento de Despesas por Categoria
  const configCategorias = [
    { nome: 'Material' as const, Icon: Package, cor: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-200', bar: 'bg-indigo-500' },
    { nome: 'Serviço' as const, Icon: Wrench, cor: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200', bar: 'bg-amber-500' },
    { nome: 'Transporte' as const, Icon: Truck, cor: 'text-sky-700', bg: 'bg-sky-50', border: 'border-sky-200', bar: 'bg-sky-500' },
    { nome: 'Alimentação' as const, Icon: Utensils, cor: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', bar: 'bg-emerald-500' }
  ];

  const relatorioCategorias = configCategorias.map(cfg => {
    const comprasDaCat = comprasRealizadas.filter(c => (c.categoria || 'Material') === cfg.nome);
    const totalCat = comprasDaCat.reduce((acc, c) => acc + c.valorTotal, 0);
    const percentual = totalGasto > 0 ? (totalCat / totalGasto) * 100 : 0;
    const totalItens = comprasDaCat.reduce((acc, c) => acc + (c.itens && c.itens.length > 0 ? c.itens.length : 1), 0);
    return {
      ...cfg,
      total: totalCat,
      percentual,
      quantidadeDespesas: comprasDaCat.length,
      totalItens
    };
  });

  // Relatório Analítico Detalhado por Categorias de Engenharia (12 Categorias)
  const relatorioCategoriasEtapas = useMemo(() => {
    return CATEGORIAS_ETAPAS.map(cat => {
      // Tarefas desta categoria
      const tarefasDestaCat = tarefas.filter(t => {
        const catTarefa = t.categoria || sugerirCategoriaPorTitulo(t.titulo);
        if (cat.id === 'Instalações') {
          return catTarefa.startsWith('Instalações');
        }
        return catTarefa === cat.id;
      });

      const totalTarefasCat = tarefasDestaCat.length;
      const tarefasConcluidasCat = tarefasDestaCat.filter(t => t.status === 'CONCLUIDA').length;
      const tarefasEmAndamentoCat = tarefasDestaCat.filter(t => t.iniciada && t.status !== 'CONCLUIDA').length;
      const tarefasAtrasadasCat = tarefasDestaCat.filter(t => t.status !== 'CONCLUIDA' && (t.status === 'ATRASADA' || t.dataFimPrevista < hojeStr)).length;

      // Subtarefas desta categoria
      const subtarefasDestaCat = tarefasDestaCat.flatMap(t => t.subtarefas || []);
      const totalSubtarefasCat = subtarefasDestaCat.length;
      const subtarefasConcluidasCat = subtarefasDestaCat.filter(s => s.concluida).length;

      // Duração planejada (dias)
      const duracaoTotalDias = tarefasDestaCat.reduce((acc, t) => acc + (t.duracaoDias || 0), 0);
      const duracaoMediaDias = totalTarefasCat > 0 ? Math.round(duracaoTotalDias / totalTarefasCat) : 0;

      // Gastos financeiros vinculados
      const idsTarefas = new Set(tarefasDestaCat.map(t => t.id));
      const comprasDestaCat = compras.filter(c => c.tarefaId && idsTarefas.has(c.tarefaId));
      const comprasRealizadasCat = comprasDestaCat.filter(c => !c.isPrevisao);
      const comprasPrevisaoCat = comprasDestaCat.filter(c => !!c.isPrevisao);

      const totalGastoRealizado = comprasRealizadasCat.reduce((acc, c) => acc + c.valorTotal, 0);
      const totalGastoPrevisao = comprasPrevisaoCat.reduce((acc, c) => acc + c.valorTotal, 0);
      const totalGastoGeral = totalGastoRealizado + totalGastoPrevisao;
      const percentualDoTotalGasto = totalGasto > 0 ? (totalGastoRealizado / totalGasto) * 100 : 0;

      // Progresso percentual físico (ponderando subtarefas e tarefas)
      let progressoFisico = 0;
      if (totalSubtarefasCat > 0) {
        progressoFisico = Math.round((subtarefasConcluidasCat / totalSubtarefasCat) * 100);
      } else if (totalTarefasCat > 0) {
        progressoFisico = Math.round((tarefasConcluidasCat / totalTarefasCat) * 100);
      }

      return {
        ...cat,
        tarefas: tarefasDestaCat,
        totalTarefas: totalTarefasCat,
        tarefasConcluidas: tarefasConcluidasCat,
        tarefasEmAndamento: tarefasEmAndamentoCat,
        tarefasAtrasadas: tarefasAtrasadasCat,
        totalSubtarefas: totalSubtarefasCat,
        subtarefasConcluidas: subtarefasConcluidasCat,
        duracaoTotalDias,
        duracaoMediaDias,
        progressoFisico,
        totalGastoRealizado,
        totalGastoPrevisao,
        totalGastoGeral,
        percentualDoTotalGasto,
        quantidadeCompras: comprasDestaCat.length
      };
    });
  }, [tarefas, compras, totalGasto, hojeStr]);

  // Indicadores comparativos das categorias
  const maiorGastoCat = useMemo(() => {
    const comGastos = relatorioCategoriasEtapas.filter(c => c.totalGastoRealizado > 0);
    if (comGastos.length === 0) return null;
    return comGastos.reduce((prev, curr) => curr.totalGastoRealizado > prev.totalGastoRealizado ? curr : prev, comGastos[0]);
  }, [relatorioCategoriasEtapas]);

  const maiorDuracaoCat = useMemo(() => {
    const comDuracao = relatorioCategoriasEtapas.filter(c => c.duracaoTotalDias > 0);
    if (comDuracao.length === 0) return null;
    return comDuracao.reduce((prev, curr) => curr.duracaoTotalDias > prev.duracaoTotalDias ? curr : prev, comDuracao[0]);
  }, [relatorioCategoriasEtapas]);

  const totalDiasCronogramaObra = useMemo(() => {
    return relatorioCategoriasEtapas.reduce((acc, c) => acc + c.duracaoTotalDias, 0);
  }, [relatorioCategoriasEtapas]);

  // Dados formatados para o Gráfico Pizza de Despesas por Categoria
  const dadosPizzaTipos = useMemo(() => {
    const mapaCores: Record<string, { hex: string; bg: string; text: string }> = {
      'Material': { hex: '#6366f1', bg: 'bg-indigo-50', text: 'text-indigo-700' },
      'Serviço': { hex: '#f59e0b', bg: 'bg-amber-50', text: 'text-amber-700' },
      'Transporte': { hex: '#0ea5e9', bg: 'bg-sky-50', text: 'text-sky-700' },
      'Alimentação': { hex: '#10b981', bg: 'bg-emerald-50', text: 'text-emerald-700' }
    };

    interface ItemPizzaTipo {
      id: string;
      nome: string;
      total: number;
      percentual: number;
      quantidade: number;
      hex: string;
      bg: string;
      text: string;
      Icon: React.ElementType;
    }

    const itens: ItemPizzaTipo[] = relatorioCategorias.map(c => ({
      id: c.nome as string,
      nome: c.nome as string,
      total: c.total,
      percentual: c.percentual,
      quantidade: c.quantidadeDespesas,
      hex: mapaCores[c.nome]?.hex || '#8b5cf6',
      bg: mapaCores[c.nome]?.bg || 'bg-purple-50',
      text: mapaCores[c.nome]?.text || 'text-purple-700',
      Icon: c.Icon
    }));

    // Se houver compras com categoria personalizada não mapeada
    const categoriasBase = new Set(['Material', 'Serviço', 'Transporte', 'Alimentação']);
    const comprasOutras = comprasRealizadas.filter(c => c.categoria && !categoriasBase.has(c.categoria));
    if (comprasOutras.length > 0) {
      const totalOutras = comprasOutras.reduce((acc, c) => acc + c.valorTotal, 0);
      itens.push({
        id: 'Outros',
        nome: 'Outros',
        total: totalOutras,
        percentual: totalGasto > 0 ? (totalOutras / totalGasto) * 100 : 0,
        quantidade: comprasOutras.length,
        hex: '#8b5cf6',
        bg: 'bg-purple-50',
        text: 'text-purple-700',
        Icon: Tag
      });
    }

    return itens;
  }, [relatorioCategorias, comprasRealizadas, totalGasto]);

  const dadosPizzaEtapas = useMemo(() => {
    const coresEtapas = [
      '#6366f1', '#3b82f6', '#0ea5e9', '#06b6d4', 
      '#10b981', '#84cc16', '#eab308', '#f59e0b', 
      '#f97316', '#ef4444', '#ec4899', '#8b5cf6'
    ];

    const itens = relatorioCategoriasEtapas
      .filter(c => c.totalGastoRealizado > 0)
      .map((c, idx) => ({
        id: c.id,
        nome: `${c.numero}. ${c.nome}`,
        total: c.totalGastoRealizado,
        percentual: totalGasto > 0 ? (c.totalGastoRealizado / totalGasto) * 100 : 0,
        quantidade: c.quantidadeCompras,
        hex: coresEtapas[idx % coresEtapas.length],
        bg: 'bg-slate-50',
        text: 'text-slate-800',
        Icon: Layers
      }));

    if (totalSemTarefa > 0) {
      itens.push({
        id: 'Gerais',
        nome: 'Despesas Gerais (Sem Etapa)',
        total: totalSemTarefa,
        percentual: totalGasto > 0 ? (totalSemTarefa / totalGasto) * 100 : 0,
        quantidade: comprasSemTarefa.length,
        hex: '#94a3b8',
        bg: 'bg-slate-50',
        text: 'text-slate-600',
        Icon: Tag
      });
    }

    return itens;
  }, [relatorioCategoriasEtapas, totalGasto, totalSemTarefa, comprasSemTarefa.length]);

  const dadosPizzaAtuais = tipoAgrupamentoPizza === 'TIPO' ? dadosPizzaTipos : dadosPizzaEtapas;
  const fatiasPizza = useMemo(() => {
    return dadosPizzaAtuais.filter(item => item.total > 0);
  }, [dadosPizzaAtuais]);

  // Filtragem de tarefas para o relatório detalhado
  const tarefasFiltradas = relatorioTarefas.filter(t => {
    if (apenasComGastos && t.totalGasto === 0 && t.totalPrevisaoTarefa === 0) return false;
    if (filtroCategoriaRelatorio !== 'TODAS') {
      const catTarefa = t.categoria || sugerirCategoriaPorTitulo(t.titulo);
      if (filtroCategoriaRelatorio === 'Instalações') {
        if (!catTarefa.startsWith('Instalações')) return false;
      } else if (catTarefa !== filtroCategoriaRelatorio) {
        return false;
      }
    }
    return true;
  });

  // Alertas
  const tarefasAtrasadas = tarefas.filter(t => 
    t.status !== 'CONCLUIDA' && (t.status === 'ATRASADA' || t.dataFimPrevista < hojeStr)
  );

  const tarefasVencemHoje = tarefas.filter(t => 
    t.status !== 'CONCLUIDA' && t.dataFimPrevista === hojeStr
  );

  const tarefasIniciamHoje = tarefas.filter(t => 
    t.status !== 'CONCLUIDA' && t.dataInicioPrevista === hojeStr && !t.iniciada
  );

  const rdosPendentes = state.diarioObra.filter(d => 
    d.obraId === obraId && d.statusConfirmacao === 'PENDENTE'
  );

  const dataLimiteProximas = new Date();
  dataLimiteProximas.setDate(dataLimiteProximas.getDate() + 3);
  const dataLimiteProximasStr = dataLimiteProximas.toISOString().split('T')[0];

  const tarefasProximas = tarefas.filter(t => 
    t.status !== 'CONCLUIDA' && 
    t.dataFimPrevista > hojeStr && 
    t.dataFimPrevista <= dataLimiteProximasStr
  );

  const comprasPendentes = compras.filter(c => c.statusCompra === 'PENDENTE' && !c.isPrevisao);

  const totalAlertasAtencao = tarefasAtrasadas.length + tarefasVencemHoje.length + tarefasIniciamHoje.length + rdosPendentes.length;

  const handleAbrirEditarRdo = (diario: DiarioObra) => {
    setDiarioParaEditar(diario);
    setModalEditarRdoAberto(true);
  };

  const handleConfirmarRdoRapido = (id: string) => {
    if (onConfirmarRdo) {
      onConfirmarRdo(id);
      setMensagemSucesso("RDO de hoje confirmado com sucesso!");
      setTimeout(() => setMensagemSucesso(null), 3500);
    }
  };

  return (
    <div className="space-y-5 pb-24">
      {/* Mensagem Toast de Sucesso */}
      {mensagemSucesso && (
        <div className="bg-emerald-600 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-md flex items-center justify-between gap-2 animate-in fade-in slide-in-from-top duration-300">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4" />
            <span>{mensagemSucesso}</span>
          </div>
          <button 
            type="button" 
            onClick={() => setMensagemSucesso(null)}
            className="text-white/80 hover:text-white text-xs font-bold px-1.5 py-0.5 rounded cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Cabeçalho */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">{obra?.nome}</h1>
          <p className="text-xs text-slate-500">Visão Geral & Indicadores de Obra</p>
        </div>

        {totalAlertasAtencao > 0 && (
          <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200/80 px-2.5 py-1 rounded-xl shrink-0">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            <span className="text-[11px] font-bold text-amber-900">
              {totalAlertasAtencao} {totalAlertasAtencao === 1 ? 'alerta ativo' : 'alertas ativos'}
            </span>
          </div>
        )}
      </div>

      {/* Barra Rápida de Indicadores de Alerta do Cronograma e RDO */}
      {totalAlertasAtencao > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {/* Card Atrasadas */}
          <div 
            onClick={() => onNavigateCronograma && onNavigateCronograma()}
            className={`p-2.5 rounded-xl border flex items-center gap-2 transition-all ${
              tarefasAtrasadas.length > 0 
                ? 'bg-rose-50/80 border-rose-200 text-rose-900 hover:bg-rose-100 cursor-pointer shadow-2xs' 
                : 'bg-slate-50 border-slate-100 text-slate-400 opacity-60'
            }`}
          >
            <div className={`p-1.5 rounded-lg shrink-0 ${tarefasAtrasadas.length > 0 ? 'bg-rose-100 text-rose-700' : 'bg-slate-200 text-slate-500'}`}>
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] uppercase font-bold block tracking-wider leading-none">Atrasadas</span>
              <span className="text-xs font-black">
                {tarefasAtrasadas.length} {tarefasAtrasadas.length === 1 ? 'tarefa' : 'tarefas'}
              </span>
            </div>
          </div>

          {/* Card Vencimento Hoje */}
          <div 
            onClick={() => onNavigateCronograma && onNavigateCronograma()}
            className={`p-2.5 rounded-xl border flex items-center gap-2 transition-all ${
              tarefasVencemHoje.length > 0 
                ? 'bg-amber-50/80 border-amber-200 text-amber-900 hover:bg-amber-100 cursor-pointer shadow-2xs' 
                : 'bg-slate-50 border-slate-100 text-slate-400 opacity-60'
            }`}
          >
            <div className={`p-1.5 rounded-lg shrink-0 ${tarefasVencemHoje.length > 0 ? 'bg-amber-100 text-amber-700' : 'bg-slate-200 text-slate-500'}`}>
              <Clock className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] uppercase font-bold block tracking-wider leading-none">Vencem Hoje</span>
              <span className="text-xs font-black">
                {tarefasVencemHoje.length} {tarefasVencemHoje.length === 1 ? 'tarefa' : 'tarefas'}
              </span>
            </div>
          </div>

          {/* Card Início Hoje */}
          <div 
            onClick={() => onNavigateCronograma && onNavigateCronograma()}
            className={`p-2.5 rounded-xl border flex items-center gap-2 transition-all ${
              tarefasIniciamHoje.length > 0 
                ? 'bg-sky-50/80 border-sky-200 text-sky-900 hover:bg-sky-100 cursor-pointer shadow-2xs' 
                : 'bg-slate-50 border-slate-100 text-slate-400 opacity-60'
            }`}
          >
            <div className={`p-1.5 rounded-lg shrink-0 ${tarefasIniciamHoje.length > 0 ? 'bg-sky-100 text-sky-700' : 'bg-slate-200 text-slate-500'}`}>
              <PlayCircle className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] uppercase font-bold block tracking-wider leading-none">Início Hoje</span>
              <span className="text-xs font-black">
                {tarefasIniciamHoje.length} {tarefasIniciamHoje.length === 1 ? 'tarefa' : 'tarefas'}
              </span>
            </div>
          </div>

          {/* Card RDO Pendente */}
          <div 
            onClick={() => {
              if (rdosPendentes.length > 0) {
                handleAbrirEditarRdo(rdosPendentes[0]);
              } else if (onNavigateDiario) {
                onNavigateDiario();
              }
            }}
            className={`p-2.5 rounded-xl border flex items-center gap-2 transition-all ${
              rdosPendentes.length > 0 
                ? 'bg-purple-50/80 border-purple-200 text-purple-900 hover:bg-purple-100 cursor-pointer shadow-2xs' 
                : 'bg-slate-50 border-slate-100 text-slate-400 opacity-60'
            }`}
          >
            <div className={`p-1.5 rounded-lg shrink-0 ${rdosPendentes.length > 0 ? 'bg-purple-100 text-purple-700' : 'bg-slate-200 text-slate-500'}`}>
              <FileCheck2 className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] uppercase font-bold block tracking-wider leading-none">RDO Pendente</span>
              <span className="text-xs font-black">
                {rdosPendentes.length} {rdosPendentes.length === 1 ? 'diário' : 'diários'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Cards Financeiros Principais (Contabilizados) */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white p-4 rounded-2xl shadow-xs border border-slate-100 flex flex-col justify-between">
          <div className="flex items-center gap-2 text-slate-500 mb-1.5">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Recebido</span>
          </div>
          <span className="text-lg font-black text-slate-800">
            R$ {totalRecebido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </span>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-xs border border-slate-100 flex flex-col justify-between">
          <div className="flex items-center gap-2 text-slate-500 mb-1.5">
            <TrendingDown className="w-4 h-4 text-rose-600" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Gasto</span>
          </div>
          <span className="text-lg font-black text-slate-800">
            R$ {totalGasto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </span>
        </div>
        
        {/* Card Saldo em Caixa */}
        <div className="bg-gradient-to-br from-green-700 via-green-900 border-green-800/60 to-slate-700 text-white shadow-md border overflow-hidden col-span-2 bg-slate-900 p-4 rounded-2xl shadow-sm text-white flex items-center justify-between">
          <div>
            <span className="text-white text-[10px] font-bold uppercase tracking-wider block">Saldo Real em Caixa</span>
            <div className={`text-2xl font-black mt-0.5 ${saldo >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              R$ {saldo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </div>
          {saldo >= 0 ? <TrendingUp className="w-7 h-7 text-emerald-400 opacity-60" /> : <TrendingDown className="w-7 h-7 text-rose-400 opacity-60" />}
        </div>
      </div>

      {/* Painel de Previsões & Projeções Futuras */}
      {(totalPrevisoes > 0 || totalPrevisaoReceita > 0 || totalPrevisaoGasto > 0) && (
        <div className="bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border border-amber-200/90 rounded-2xl p-4 space-y-2.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-amber-100 text-amber-800 rounded-lg">
                <CalendarClock className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-amber-950">Previsões Financeiras</h3>
                <p className="text-[10px] text-amber-700">Valores aguardando confirmação</p>
              </div>
            </div>

            {onNavigateFinanceiro && (
              <button
                type="button"
                onClick={onNavigateFinanceiro}
                className="text-[11px] font-bold text-amber-800 hover:text-amber-950 flex items-center gap-1 bg-amber-100/70 hover:bg-amber-100 px-2 py-1 rounded-lg border border-amber-200/80 transition-colors cursor-pointer"
              >
                Gerenciar
                <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>

          <div className="items-center grid grid-cols-3 gap-1.5 pt-1 text-[11px]">
                <div className="py-1 bg-white/80 rounded-xl border border-amber-100 text-center">
                  <span className="text-[9px] text-slate-500 block font-medium">Receita</span>
                  <span className="text-[9px] font-bold text-emerald-700">
                    + R$ {totalPrevisaoReceita.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="py-1 bg-white/80 rounded-xl border border-amber-100 text-center">
                  <span className="text-[9px] text-slate-500 block font-medium">Gasto</span>
                  <span className="text-[9px] font-bold text-rose-700">
                    - R$ {totalPrevisaoGasto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="py-1 bg-amber-100/70 rounded-xl border border-amber-200 text-center">
                  <span className="text-[9px] text-amber-900 block font-bold">Saldo Previsto</span>
                  <span className={`font-black ${saldoProjetado >= 0 ? 'text-emerald-800' : 'text-rose-800'}`}>
                    R$ {saldoProjetado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SEÇÃO: GRÁFICO PIZZA DE DESPESAS POR CATEGORIA */}
      {/* ========================================================================= */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-xs border border-slate-200/80 space-y-4">
        {/* Cabeçalho com Título, Seletor de Modo e Atalho de Extrato */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-rose-50 text-rose-600 rounded-xl">
              <PieChart className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm sm:text-base">
                Gráfico Pizza de Despesas por Categoria
              </h3>
              <p className="text-[11px] text-slate-500">
                Distribuição percentual e financeira dos custos da obra
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
            {/* Seletor de Modo de Agrupamento */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-xl">
              <button
                type="button"
                onClick={() => setTipoAgrupamentoPizza('TIPO')}
                className={`text-xs px-2.5 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  tipoAgrupamentoPizza === 'TIPO'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Tipo de Custo
              </button>
              <button
                type="button"
                onClick={() => setTipoAgrupamentoPizza('ETAPA')}
                className={`text-xs px-2.5 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  tipoAgrupamentoPizza === 'ETAPA'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Etapas da Obra
              </button>
            </div>

            {onNavigateFinanceiro && (
              <button
                type="button"
                onClick={onNavigateFinanceiro}
                className="text-xs font-bold text-slate-700 hover:text-slate-900 flex items-center gap-1 bg-slate-100 hover:bg-slate-200 px-2.5 py-1.5 rounded-xl transition-colors cursor-pointer"
              >
                <span>Extrato</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Visualização: Gráfico Donut/Pizza e Painel de Legenda */}
        {fatiasPizza.length === 0 ? (
          <div className="p-8 text-center bg-slate-50/70 rounded-xl border border-slate-100 space-y-2">
            <div className="w-10 h-10 mx-auto rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
              <PieChart className="w-5 h-5" />
            </div>
            <p className="text-xs font-bold text-slate-700">Nenhuma despesa registrada nesta obra ainda</p>
            <p className="text-[11px] text-slate-400">
              Cadastre compras ou pagamentos no módulo Financeiro para visualizar o gráfico de pizza.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
            {/* Donut SVG Interativo */}
            <div className="col-span-1 md:col-span-5 flex flex-col items-center justify-center">
              <div className="relative w-44 h-44 sm:w-48 sm:h-48 flex items-center justify-center">
                <svg 
                  className="w-full h-full transform -rotate-90 drop-shadow-xs" 
                  viewBox="0 0 160 160"
                >
                  {/* Círculo de Trilha Base */}
                  <circle
                    cx="80"
                    cy="80"
                    r={52}
                    fill="transparent"
                    stroke="#f1f5f9"
                    strokeWidth={16}
                  />

                  {/* Arcos das Fatias com cálculo de circunferência */}
                  {(() => {
                    const r = 52;
                    const circumference = 2 * Math.PI * r;
                    let accumulatedOffset = 0;

                    return fatiasPizza.map((fatia) => {
                      const dashLength = (fatia.percentual / 100) * circumference;
                      const currentOffset = -accumulatedOffset;
                      accumulatedOffset += dashLength;
                      const isHovered = categoriaPizzaHover === fatia.id;

                      return (
                        <circle
                          key={fatia.id}
                          cx="80"
                          cy="80"
                          r={r}
                          fill="transparent"
                          stroke={fatia.hex}
                          strokeWidth={isHovered ? 20 : 16}
                          strokeDasharray={`${Math.max(0.2, dashLength)} ${Math.max(0.1, circumference - dashLength)}`}
                          strokeDashoffset={currentOffset}
                          strokeLinecap="butt"
                          className="transition-all duration-300 cursor-pointer"
                          style={{
                            opacity: categoriaPizzaHover && !isHovered ? 0.45 : 1,
                            filter: isHovered ? 'drop-shadow(0 2px 5px rgba(0,0,0,0.2))' : 'none'
                          }}
                          onMouseEnter={() => setCategoriaPizzaHover(fatia.id)}
                          onMouseLeave={() => setCategoriaPizzaHover(null)}
                        />
                      );
                    });
                  })()}
                </svg>

                {/* Conteúdo Central do Donut */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-4 select-none">
                  {(() => {
                    const itemHover = fatiasPizza.find(f => f.id === categoriaPizzaHover);
                    if (itemHover) {
                      return (
                        <>
                          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider truncate max-w-[120px]">
                            {itemHover.nome}
                          </span>
                          <span className="text-sm sm:text-base font-black text-slate-800 tracking-tight mt-0.5">
                            R$ {itemHover.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                          <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full mt-1 border border-indigo-100">
                            {itemHover.percentual.toFixed(1)}% do total
                          </span>
                        </>
                      );
                    }
                    return (
                      <>
                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                          Total Despesas
                        </span>
                        <span className="text-sm sm:text-base font-black text-slate-800 tracking-tight mt-0.5">
                          R$ {totalGasto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                        <span className="text-[10px] font-semibold text-slate-500 mt-1">
                          {comprasRealizadas.length} {comprasRealizadas.length === 1 ? 'despesa' : 'despesas'}
                        </span>
                      </>
                    );
                  })()}
                </div>
              </div>

              <span className="text-[10px] text-slate-400 mt-1 font-medium">
                Passe o mouse ou toque para inspecionar cada fatia
              </span>
            </div>

            {/* Painel Lateral com Legenda e Detalhamento das Fatias */}
            <div className="col-span-1 md:col-span-7 space-y-2 max-h-72 overflow-y-auto pr-1">
              {fatiasPizza.map((fatia) => {
                const isHovered = categoriaPizzaHover === fatia.id;
                return (
                  <div
                    key={fatia.id}
                    onMouseEnter={() => setCategoriaPizzaHover(fatia.id)}
                    onMouseLeave={() => setCategoriaPizzaHover(null)}
                    className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                      isHovered
                        ? 'border-indigo-300 bg-indigo-50/50 shadow-xs ring-1 ring-indigo-200'
                        : 'border-slate-200/70 bg-slate-50/60 hover:bg-slate-50 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span
                          className="w-3 h-3 rounded-md shrink-0 shadow-2xs"
                          style={{ backgroundColor: fatia.hex }}
                        />
                        <div className="min-w-0">
                          <span className="text-xs font-bold text-slate-800 truncate block">
                            {fatia.nome}
                          </span>
                          <span className="text-[10px] text-slate-500 font-medium">
                            {fatia.quantidade} {fatia.quantidade === 1 ? 'lançamento' : 'lançamentos'}
                          </span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-xs font-black text-slate-900 block">
                          R$ {fatia.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                        <span className="text-[10px] font-bold text-indigo-700 bg-white px-1.5 py-0.2 rounded border border-slate-200/80 inline-block mt-0.5">
                          {fatia.percentual.toFixed(1)}%
                        </span>
                      </div>
                    </div>

                    {/* Barra de Proporção Relativa */}
                    <div className="w-full bg-slate-200/70 rounded-full h-1.5 mt-2 overflow-hidden">
                      <div
                        className="h-1.5 rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min(fatia.percentual, 100)}%`,
                          backgroundColor: fatia.hex
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Cards Rápidos de Apoio por Tipo de Custo */}
        <div className="pt-2 border-t border-slate-100">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
            Resumo Rápido por Natureza de Custo
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {relatorioCategorias.map(cat => {
              const Icone = cat.Icon;
              return (
                <div 
                  key={cat.nome} 
                  className={`p-2.5 rounded-xl border ${cat.border} ${cat.bg} flex flex-col justify-between space-y-1.5`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">{cat.nome}</span>
                    <div className={`p-1 rounded-lg bg-white/80 ${cat.cor}`}>
                      <Icone className="w-3.5 h-3.5" />
                    </div>
                  </div>

                  <div>
                    <span className="text-xs sm:text-sm font-black text-slate-900 block">
                      R$ {cat.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                    <div className="flex items-center justify-between text-[10px] text-slate-500 mt-0.5 font-medium">
                      <span>{cat.percentual.toFixed(1)}%</span>
                      <span>{cat.quantidadeDespesas} desp.</span>
                    </div>
                  </div>

                  <div className="w-full bg-white/80 rounded-full h-1.5 overflow-hidden">
                    <div 
                      className={`${cat.bar} h-1.5 rounded-full transition-all duration-500`}
                      style={{ width: `${Math.min(cat.percentual, 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Progresso Geral da Obra */}
      <div className="bg-white p-4 rounded-2xl shadow-xs border border-slate-100">
        <div className="flex justify-between items-end mb-2.5">
          <div>
            <h3 className="font-bold text-slate-800 text-sm">Progresso Físico</h3>
            <p className="text-xs text-slate-500">
              {tarefasConcluidas} de {totalTarefas} tarefas concluídas
              {totalSubtarefas > 0 && ` • ${subtarefasConcluidas}/${totalSubtarefas} sub-tarefas`}
            </p>
          </div>
          <span className="text-xl font-black text-indigo-600">{progresso}%</span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
          <div 
            className="bg-indigo-600 h-2.5 rounded-full transition-all duration-500 ease-out" 
            style={{ width: `${progresso}%` }}
          ></div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* PAINEL DE ANÁLISE POR CATEGORIA DE ETAPA (12 CATEGORIAS DA CONSTRUÇÃO) */}
      {/* ========================================================================= */}
      <div className="bg-white p-4 rounded-2xl shadow-xs border border-slate-200/80 space-y-4">
        {/* Cabeçalho da Análise */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                <BarChart3 className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-slate-800 text-sm">Análise por Etapa</h3>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Gastos, duração e progresso nas etapas da construção civil
            </p>
          </div>
        </div>

        {/* Cards de Destaques Rápidos */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
              Maior Investimento
            </span>
            <span className="text-xs font-bold text-slate-800 truncate block mt-0.5">
              {maiorGastoCat ? `${maiorGastoCat.numero}. ${maiorGastoCat.nome}` : 'Nenhum gasto'}
            </span>
            <span className="text-[11px] font-bold text-rose-600 block">
              {maiorGastoCat ? `R$ ${maiorGastoCat.totalGastoRealizado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'R$ 0,00'}
            </span>
          </div>

          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
              Maior Duração
            </span>
            <span className="text-xs font-bold text-slate-800 truncate block mt-0.5">
              {maiorDuracaoCat ? `${maiorDuracaoCat.numero}. ${maiorDuracaoCat.nome}` : 'Nenhuma etapa'}
            </span>
            <span className="text-[11px] font-bold text-indigo-600 block">
              {maiorDuracaoCat ? `${maiorDuracaoCat.duracaoTotalDias} dias previstos` : '0 dias'}
            </span>
          </div>

          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 col-span-2 sm:col-span-1">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
              Volume de Etapas
            </span>
            <span className="text-xs font-bold text-slate-800 block mt-0.5">
              {tarefas.length} {tarefas.length === 1 ? 'etapa cadastrada' : 'etapas cadastradas'}
            </span>
            <span className="text-[11px] font-medium text-emerald-600 block">
              {tarefasConcluidas} concluídas ({progresso}%)
            </span>
          </div>
        </div>

        {/* Botão para Expandir / Colapsar detalhes */}
        <div className="flex items-center justify-center pt-0.5">
          <button
            type="button"
            onClick={() => setMostrarDetalhesEtapas(!mostrarDetalhesEtapas)}
            className="w-full sm:w-auto flex items-center justify-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-slate-50 hover:bg-slate-100 border border-slate-200/70 px-4 py-2 rounded-xl transition-all cursor-pointer"
          >
            <span>{mostrarDetalhesEtapas ? 'Ocultar detalhes' : 'Ver detalhes'}</span>
            {mostrarDetalhesEtapas ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>
        </div>

        {/* Trecho Detalhado Colapsável */}
        {mostrarDetalhesEtapas && (
          <div className="space-y-4 pt-2 border-t border-slate-100 animate-in fade-in duration-200">
            {/* Seletor de Modo de Visualização */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-xl self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setModoAnaliseEtapas('GASTOS')}
                className={`text-xs px-2.5 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  modoAnaliseEtapas === 'GASTOS'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                💰 Gastos
              </button>
              <button
                type="button"
                onClick={() => setModoAnaliseEtapas('DURACAO')}
                className={`text-xs px-2.5 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  modoAnaliseEtapas === 'DURACAO'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                ⏱️ Duração
              </button>
              <button
                type="button"
                onClick={() => setModoAnaliseEtapas('PROGRESSO')}
                className={`text-xs px-2.5 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  modoAnaliseEtapas === 'PROGRESSO'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                🎯 Progresso
              </button>
            </div>

            {/* Filtro: Mostrar apenas categorias com tarefas ou despesas */}
            <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
              <label className="flex items-center gap-1.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={apenasCategoriasComAtividades}
                  onChange={e => setApenasCategoriasComAtividades(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
                <span className="font-medium">Ocultar categorias sem etapas nesta obra</span>
              </label>
            </div>

            {/* Lista de Gráficos e Barras Analíticas por Categoria */}
            <div className="space-y-2.5 pt-1">
              {relatorioCategoriasEtapas
                .filter(cat => !apenasCategoriasComAtividades || cat.totalTarefas > 0 || cat.totalGastoRealizado > 0)
                .map(cat => {
                  const temAtividade = cat.totalTarefas > 0 || cat.totalGastoRealizado > 0;
                  const maxGasto = maiorGastoCat?.totalGastoRealizado || 1;
                  const percentualBarraGasto = maxGasto > 0 ? (cat.totalGastoRealizado / maxGasto) * 100 : 0;
                  const maxDuracao = maiorDuracaoCat?.duracaoTotalDias || 1;
                  const percentualBarraDuracao = maxDuracao > 0 ? (cat.duracaoTotalDias / maxDuracao) * 100 : 0;

                  return (
                    <div
                      key={cat.id}
                      className={`p-3 rounded-xl border transition-all ${
                        temAtividade
                          ? 'bg-white border-slate-200/90 shadow-2xs hover:border-indigo-300'
                          : 'bg-slate-50/70 border-slate-200/50 opacity-60'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-2">
                        {/* Badge e Nome da Categoria */}
                        <div className="flex items-center gap-2 min-w-0">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border shrink-0 ${cat.corBadge}`}>
                            {cat.numero}
                          </span>
                          <div className="min-w-0">
                            <span className="text-xs font-bold text-slate-800 truncate block">
                              {cat.nome}
                            </span>
                            <span className="text-[10px] text-slate-400 font-normal truncate block">
                              {cat.descricao}
                            </span>
                          </div>
                        </div>

                        {/* Botão de Atalho para o Cronograma */}
                        <button
                          type="button"
                          onClick={() => onNavigateCronograma && onNavigateCronograma(cat.id)}
                          title={`Abrir ${cat.nome} no Cronograma`}
                          className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50/70 hover:bg-indigo-100 px-2 py-1 rounded-lg transition-colors flex items-center gap-1 cursor-pointer shrink-0"
                        >
                          <span>Ver no Cronograma</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Conteúdo Dinâmico Baseado no Modo Selecionado */}
                      {modoAnaliseEtapas === 'GASTOS' && (
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-800">
                                R$ {cat.totalGastoRealizado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </span>
                              {cat.totalGastoPrevisao > 0 && (
                                <span className="text-[10px] text-amber-700 font-semibold bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                                  + R$ {cat.totalGastoPrevisao.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} previstos
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] font-bold text-slate-500">
                              {cat.percentualDoTotalGasto.toFixed(1)}% dos gastos
                            </span>
                          </div>

                          {/* Barra de Progresso Financeiro */}
                          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                            <div
                              className="h-2 rounded-full bg-indigo-600 transition-all duration-500"
                              style={{ width: `${Math.min(percentualBarraGasto, 100)}%` }}
                            />
                          </div>

                          <div className="flex items-center justify-between text-[10px] text-slate-400">
                            <span>{cat.quantidadeCompras} {cat.quantidadeCompras === 1 ? 'despesa alocada' : 'despesas alocadas'}</span>
                            <span>{cat.totalTarefas} {cat.totalTarefas === 1 ? 'etapa cadastrada' : 'etapas cadastradas'}</span>
                          </div>
                        </div>
                      )}

                      {modoAnaliseEtapas === 'DURACAO' && (
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-800">
                                {cat.duracaoTotalDias} {cat.duracaoTotalDias === 1 ? 'dia planejado' : 'dias planejados'}
                              </span>
                              {cat.duracaoMediaDias > 0 && (
                                <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded font-medium">
                                  Média: {cat.duracaoMediaDias}d / etapa
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] font-bold text-slate-500">
                              {totalDiasCronogramaObra > 0 ? ((cat.duracaoTotalDias / totalDiasCronogramaObra) * 100).toFixed(1) : 0}% do tempo da obra
                            </span>
                          </div>

                          {/* Barra de Proporção de Duração */}
                          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                            <div
                              className="h-2 rounded-full bg-amber-500 transition-all duration-500"
                              style={{ width: `${Math.min(percentualBarraDuracao, 100)}%` }}
                            />
                          </div>

                          <div className="flex items-center justify-between text-[10px] text-slate-400">
                            <span>{cat.tarefasConcluidas} concluídas • {cat.tarefasEmAndamento} em andamento</span>
                            {cat.tarefasAtrasadas > 0 ? (
                              <span className="text-rose-600 font-bold">{cat.tarefasAtrasadas} atrasadas</span>
                            ) : (
                              <span className="text-emerald-600 font-medium">Sem atrasos</span>
                            )}
                          </div>
                        </div>
                      )}

                      {modoAnaliseEtapas === 'PROGRESSO' && (
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-800">
                                {cat.progressoFisico}% concluído
                              </span>
                              <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded font-medium">
                                {cat.tarefasConcluidas} de {cat.totalTarefas} etapas
                              </span>
                            </div>
                            <span className="text-[10px] font-semibold text-slate-500">
                              {cat.subtarefasConcluidas}/{cat.totalSubtarefas} subtarefas
                            </span>
                          </div>

                          {/* Barra de Progresso Físico */}
                          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                            <div
                              className={`h-2 rounded-full transition-all duration-500 ${
                                cat.progressoFisico === 100 ? 'bg-emerald-500' : 'bg-indigo-600'
                              }`}
                              style={{ width: `${Math.min(cat.progressoFisico, 100)}%` }}
                            />
                          </div>

                          <div className="flex items-center justify-between text-[10px] text-slate-400">
                            <span>
                              {cat.totalTarefas === 0 
                                ? 'Nenhuma etapa iniciada' 
                                : cat.tarefasConcluidas === cat.totalTarefas 
                                ? '✓ Etapa 100% finalizada' 
                                : `${cat.totalTarefas - cat.tarefasConcluidas} pendentes`}
                            </span>
                            {cat.tarefasAtrasadas > 0 && (
                              <span className="text-rose-600 font-bold flex items-center gap-0.5">
                                <AlertTriangle className="w-2.5 h-2.5" /> Atenção aos prazos
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MINIRRELATÓRIO DE GASTOS AGRUPADO POR CADA TAREFA E SUBTAREFA */}
      {/* ========================================================================= */}
      <div className="bg-white p-4 rounded-2xl shadow-xs border border-slate-200/80 space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                <PieChart className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-slate-800 text-sm">Análise por Tarefas</h3>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Custos contabilizados por etapas e subtarefas
            </p>
          </div>

          <button
            type="button"
            onClick={() => setMostrarDetalhesTarefas(!mostrarDetalhesTarefas)}
            className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50/70 hover:bg-indigo-100 px-3 py-1.5 rounded-xl transition-all cursor-pointer shrink-0 self-start sm:self-auto"
          >
            <span>{mostrarDetalhesTarefas ? 'Ocultar tarefas' : 'Ver tarefas'}</span>
            {mostrarDetalhesTarefas ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>
        </div>

        {/* Resumo de Alocação de Gastos (sempre visível) */}
        <div className="grid grid-cols-2 gap-2.5 bg-slate-50 p-3 rounded-xl border border-slate-100">
          <div>
            <span className="text-[10px] text-slate-500 font-medium block">Alocado em Tarefas</span>
            <span className="text-xs font-bold text-slate-800">
              R$ {totalAlocadoEmTarefas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
            <span className="text-[10px] text-indigo-600 font-semibold block">
              {percentualAlocado.toFixed(1)}% do total gasto
            </span>
          </div>

          <div>
            <span className="text-[10px] text-slate-500 font-medium block">Despesas Gerais</span>
            <span className="text-xs font-bold text-slate-800">
              R$ {totalSemTarefa.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
            <span className="text-[10px] text-slate-500 font-medium block">
              {percentualSemTarefa.toFixed(1)}% do total
            </span>
          </div>
        </div>

        {/* Botão de Expansão/Colapso para Despoluir Tela */}
        <div className="flex justify-center pt-0.5">
          <button
            type="button"
            onClick={() => setMostrarDetalhesTarefas(!mostrarDetalhesTarefas)}
            className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors py-1 px-3 rounded-lg hover:bg-indigo-50/60 cursor-pointer"
          >
            <span>
              {mostrarDetalhesTarefas 
                ? 'Recolher lista de tarefas' 
                : `Ver detalhamento de ${tarefasFiltradas.length} tarefas`}
            </span>
            {mostrarDetalhesTarefas ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>
        </div>

        {/* Bloco Detalhado de Tarefas Colapsável */}
        {mostrarDetalhesTarefas && (
          <div className="space-y-3 pt-2 border-t border-slate-100">
            {/* Seletor e Filtro */}
            <div className="flex items-center justify-between gap-2 flex-wrap bg-slate-50/70 p-2 rounded-xl border border-slate-100">
              <span className="text-xs font-bold text-slate-700">Filtros:</span>
              <div className="flex items-center gap-2 flex-wrap">
                <select
                  value={filtroCategoriaRelatorio}
                  onChange={e => setFiltroCategoriaRelatorio(e.target.value)}
                  className="text-[11px] bg-white border border-slate-200 rounded-lg px-2 py-1 text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer shadow-2xs"
                >
                  <option value="TODAS">Todas as Categorias</option>
                  {CATEGORIAS_ETAPAS.map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.numero}. {cat.nome}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={() => setApenasComGastos(!apenasComGastos)}
                  className={`text-[11px] px-2.5 py-1 rounded-lg border font-medium transition-colors cursor-pointer ${
                    apenasComGastos 
                      ? 'bg-indigo-50 text-indigo-700 border-indigo-200' 
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {apenasComGastos ? 'Com Gastos' : 'Todos'}
                </button>
              </div>
            </div>

            {/* Lista de Etapas e seus gastos */}
            <div className="space-y-2">
          {tarefasFiltradas.map((tarefa) => {
            const isExpandida = etapasExpandidas[tarefa.id];
            const temSubtarefas = tarefa.subtarefasComGastos && tarefa.subtarefasComGastos.length > 0;
            const temComprasGerais = tarefa.comprasGerais && tarefa.comprasGerais.length > 0;
            const isConcluida = tarefa.status === 'CONCLUIDA';
            const isAtrasada = !isConcluida && (tarefa.status === 'ATRASADA' || tarefa.dataFimPrevista < hojeStr);
            const isVenceHoje = !isConcluida && tarefa.dataFimPrevista === hojeStr;
            const isIniciaHoje = !isConcluida && tarefa.dataInicioPrevista === hojeStr && !tarefa.iniciada;

            return (
              <div 
                key={tarefa.id} 
                className="border border-slate-200/70 rounded-xl overflow-hidden bg-slate-50/50 hover:bg-slate-50 transition-colors"
              >
                {/* Linha Cabeçalho da Tarefa */}
                <div 
                  onClick={() => toggleExpandirEtapa(tarefa.id)}
                  className="p-3 flex items-center justify-between gap-2 cursor-pointer select-none"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`p-1 rounded-md ${
                      isConcluida 
                        ? 'bg-emerald-100 text-emerald-700' 
                        : isAtrasada 
                        ? 'bg-rose-100 text-rose-700' 
                        : isVenceHoje 
                        ? 'bg-amber-100 text-amber-700' 
                        : isIniciaHoje
                        ? 'bg-sky-100 text-sky-700'
                        : 'bg-slate-200 text-slate-600'
                    }`}>
                      {isConcluida ? (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      ) : isAtrasada ? (
                        <AlertTriangle className="w-3.5 h-3.5" />
                      ) : isVenceHoje ? (
                        <Clock className="w-3.5 h-3.5" />
                      ) : isIniciaHoje ? (
                        <PlayCircle className="w-3.5 h-3.5" />
                      ) : (
                        <Layers className="w-3.5 h-3.5" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`text-xs font-bold truncate ${isConcluida ? 'text-slate-600 line-through' : 'text-slate-800'}`}>
                          {tarefa.titulo}
                        </span>
                        
                        {/* Badge de Categoria da Etapa */}
                        <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${getInfoCategoria(tarefa.categoria || sugerirCategoriaPorTitulo(tarefa.titulo)).corBadge}`}>
                          {getInfoCategoria(tarefa.categoria || sugerirCategoriaPorTitulo(tarefa.titulo)).nome}
                        </span>

                        {isConcluida && (
                          <span className="text-[9px] bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded font-bold border border-emerald-200/60">
                            Concluída
                          </span>
                        )}
                        {isAtrasada && (
                          <span className="text-[9px] bg-rose-100 text-rose-800 border border-rose-200 px-1.5 py-0.5 rounded font-bold flex items-center gap-1">
                            <AlertTriangle className="w-2.5 h-2.5 text-rose-600" /> Atrasada
                          </span>
                        )}
                        {isVenceHoje && (
                          <span className="text-[9px] bg-amber-100 text-amber-900 border border-amber-200 px-1.5 py-0.5 rounded font-bold flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5 text-amber-600" /> Vence Hoje
                          </span>
                        )}
                        {isIniciaHoje && (
                          <span className="text-[9px] bg-sky-100 text-sky-900 border border-sky-200 px-1.5 py-0.5 rounded font-bold flex items-center gap-1">
                            <PlayCircle className="w-2.5 h-2.5 text-sky-600" /> Início Hoje
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 font-medium block">
                        {tarefa.quantidadeCompras} {tarefa.quantidadeCompras === 1 ? 'lançamento' : 'lançamentos'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="text-right">
                      <span className="text-xs font-bold text-slate-800 block">
                        R$ {tarefa.totalGasto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                      {tarefa.totalPrevisaoTarefa > 0 ? (
                        <span className="text-[9px] text-amber-700 font-semibold block">
                          + R$ {tarefa.totalPrevisaoTarefa.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} previsto
                        </span>
                      ) : (
                        <span className="text-[9px] text-slate-400 font-medium">
                          {tarefa.percentualDoTotal.toFixed(1)}% do total
                        </span>
                      )}
                    </div>
                    <div className="text-slate-400">
                      {isExpandida ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </div>
                </div>

                {/* Detalhamento Interno Expandido */}
                {isExpandida && (
                  <div className="p-3 pt-0 border-t border-slate-200/60 bg-white space-y-2">
                    {/* Gastos gerais da tarefa */}
                    {temComprasGerais && (
                      <div className="pt-2">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                          Gastos Gerais da Etapa (Sem Subtarefa)
                        </span>
                        <div className="space-y-1">
                          {tarefa.comprasGerais.map(c => (
                            <div key={c.id} className="flex items-center justify-between text-[11px] py-1 px-2 rounded bg-slate-50 border border-slate-100">
                              <div className="flex items-center gap-1.5">
                                {c.isPrevisao && <Clock className="w-3 h-3 text-amber-600" />}
                                <span className="font-medium text-slate-700">{c.nomeMaterial}</span>
                                {c.isPrevisao && (
                                  <span className="text-[9px] bg-amber-100 text-amber-800 px-1 rounded font-bold">Previsto</span>
                                )}
                              </div>
                              <span className={`font-bold ${c.isPrevisao ? 'text-amber-700' : 'text-slate-800'}`}>
                                R$ {c.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Subtarefas e seus gastos */}
                    {temSubtarefas && (
                      <div className="pt-2">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                          Subtarefas & Gastos
                        </span>
                        <div className="space-y-1.5">
                          {tarefa.subtarefasComGastos.map(sub => (
                            <div key={sub.id} className="p-2 rounded-lg bg-slate-50/70 border border-slate-100 space-y-1">
                              <div className="flex items-center justify-between text-xs">
                                <div className="flex items-center gap-1.5">
                                  <span className={`w-2 h-2 rounded-full ${sub.concluida ? 'bg-emerald-500' : 'bg-slate-300'}`}></span>
                                  <span className={`font-medium ${sub.concluida ? 'text-slate-500 line-through' : 'text-slate-700'}`}>
                                    {sub.titulo}
                                  </span>
                                </div>
                                <span className="font-bold text-slate-800 text-[11px]">
                                  R$ {sub.totalGasto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </span>
                              </div>
                              {sub.compras && sub.compras.length > 0 && (
                                <div className="pl-3.5 space-y-0.5">
                                  {sub.compras.map(c => (
  <div
    key={c.id}
    className="flex items-center justify-between text-[10px] text-slate-500"
  >
    <span className="flex items-center gap-1">
      {c.isPrevisao && (
        <Clock className="w-2.5 h-2.5 text-amber-600" />
      )}
      {c.nomeMaterial}
    </span>

    <span className="font-medium text-right w-20 shrink-0">
      <span className="block">
        R$ {c.valorTotal.toLocaleString("pt-BR", {
          minimumFractionDigits: 2,
        })}
      </span>

      {c.isPrevisao && (
        <span className="block text-amber-700 font-bold">
          (previsto)
        </span>
      )}
    </span>
  </div>
))}

                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
            </div>
          </div>
        )}
      </div>

      {/* Alertas & Notificações */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-slate-800 text-xs flex items-center gap-1.5 uppercase tracking-wider">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            Atenção Necessária
          </h3>
          {onNavigateCronograma && (
            <button
              type="button"
              onClick={onNavigateCronograma}
              className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
            >
              Abrir Cronograma
              <ExternalLink className="w-3 h-3" />
            </button>
          )}
        </div>

        

        {/* Alerta de RDO Pendente de Confirmação
        {rdosPendentes.map(rdo => (
          <div key={rdo.id} className="bg-purple-50 border border-purple-200 p-3.5 rounded-xl space-y-2.5">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2.5">
                <FileCheck2 className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-xs font-bold text-purple-950">
                      RDO Automático Aguardando Confirmação
                    </p>
                    <span className="text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 px-1.5 py-0.2 rounded">
                      Pendente
                    </span>
                  </div>
                  <p className="text-[11px] text-purple-900 mt-0.5">
                    Data: <strong>{new Date(rdo.data + 'T00:00:00').toLocaleDateString('pt-BR')}</strong> • 
                    {rdo.itensChecados?.length || 0} avanço(s) registrado(s) hoje no cronograma.
                  </p>
                  <p className="text-[11px] text-purple-800 italic mt-1 bg-white/60 p-1.5 rounded-md border border-purple-100">
                    "{rdo.resumoDia}"
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
                <button
                  type="button"
                  onClick={() => handleAbrirEditarRdo(rdo)}
                  className="text-xs bg-white hover:bg-purple-100 text-purple-800 border border-purple-300 font-bold px-2.5 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1 shrink-0"
                >
                  <Edit3 className="w-3 h-3 text-purple-700" />
                  Editar
                </button>
                <button
                  type="button"
                  onClick={() => handleConfirmarRdoRapido(rdo.id)}
                  className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-2.5 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1 shadow-xs shrink-0"
                >
                  <Check className="w-3 h-3" />
                  Confirmar
                </button>
              </div>
            </div>
          </div>
        ))} */}

        {/* Alerta de Tarefas com Vencimento para HOJE */}
        {tarefasVencemHoje.map(t => (
          <div key={`vence-hoje-${t.id}`} className="bg-amber-50 border border-amber-200 p-3 rounded-xl flex items-start justify-between gap-2.5">
            <div className="flex items-start gap-2.5">
              <div className="p-1.5 bg-amber-100 text-amber-700 rounded-lg shrink-0 mt-0.5">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <p className="text-xs font-bold text-amber-950">Vencimento Hoje!</p>
                  <span className="text-[9px] font-bold bg-amber-200 text-amber-900 px-1.5 py-0.2 rounded">
                    Urgente
                  </span>
                </div>
                <p className="text-xs font-semibold text-amber-900 mt-0.5">{t.titulo}</p>
                <p className="text-[11px] text-amber-800">
                  O prazo planejado de encerramento da tarefa é hoje ({new Date(t.dataFimPrevista + 'T00:00:00').toLocaleDateString('pt-BR')}).
                </p>
              </div>
            </div>

            {onNavigateCronograma && (
              <button
                type="button"
                onClick={onNavigateCronograma}
                className="text-xs bg-amber-600 hover:bg-amber-700 text-white font-bold px-2.5 py-1 rounded-lg transition-colors cursor-pointer shrink-0"
              >
                Ver no Cronograma
              </button>
            )}
          </div>
        ))}

        {/* Alerta de Tarefas ATRASADAS */}
        {tarefasAtrasadas.map(t => (
          <div key={`atrasada-${t.id}`} className="bg-rose-50 border border-rose-200 p-3 rounded-xl flex items-start justify-between gap-2.5">
            <div className="flex items-start gap-2.5">
              <div className="p-1.5 bg-rose-100 text-rose-700 rounded-lg shrink-0 mt-0.5">
                <AlertOctagon className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <p className="text-xs font-bold text-rose-950">Tarefa Atrasada</p>
                  <span className="text-[9px] font-bold bg-rose-200 text-rose-900 px-1.5 py-0.2 rounded">
                    Atraso
                  </span>
                </div>
                <p className="text-xs font-semibold text-rose-900 mt-0.5">{t.titulo}</p>
                <p className="text-[11px] text-rose-800">
                  Prazo previsto encerrou em {new Date(t.dataFimPrevista + 'T00:00:00').toLocaleDateString('pt-BR')}.
                </p>
              </div>
            </div>

            {onNavigateCronograma && (
              <button
                type="button"
                onClick={onNavigateCronograma}
                className="text-xs bg-rose-600 hover:bg-rose-700 text-white font-bold px-2.5 py-1 rounded-lg transition-colors cursor-pointer shrink-0"
              >
                Ver no Cronograma
              </button>
            )}
          </div>
        ))}

        {/* Alerta de Tarefas com Previsão de INÍCIO PARA HOJE */}
        {tarefasIniciamHoje.map(t => (
          <div key={`inicio-hoje-${t.id}`} className="bg-sky-50 border border-sky-200 p-3 rounded-xl flex items-start justify-between gap-2.5">
            <div className="flex items-start gap-2.5">
              <div className="p-1.5 bg-sky-100 text-sky-700 rounded-lg shrink-0 mt-0.5">
                <PlayCircle className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <p className="text-xs font-bold text-sky-950">Previsão de Início Hoje</p>
                  <span className="text-[9px] font-bold bg-sky-200 text-sky-900 px-1.5 py-0.2 rounded">
                    Iniciar
                  </span>
                </div>
                <p className="text-xs font-semibold text-sky-900 mt-0.5">{t.titulo}</p>
                <p className="text-[11px] text-sky-800">
                  Data de início planejada para hoje ({new Date(t.dataInicioPrevista + 'T00:00:00').toLocaleDateString('pt-BR')}).
                </p>
              </div>
            </div>

            {onNavigateCronograma && (
              <button
                type="button"
                onClick={onNavigateCronograma}
                className="text-xs bg-sky-600 hover:bg-sky-700 text-white font-bold px-2.5 py-1 rounded-lg transition-colors cursor-pointer shrink-0"
              >
                Ver no Cronograma
              </button>
            )}
          </div>
        ))}

        {/* Alerta de Previsões Atingidas */}
        {previsoesAtingidas.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-xl space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2">
                <Clock className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-amber-900">
                    {previsoesAtingidas.length} Previsão(ões) com data atingida aguardando confirmação!
                  </p>
                  <p className="text-[11px] text-amber-800 mt-0.5">
                    A data programada já chegou. Confirme no caixa para contabilizar no saldo da obra.
                  </p>
                </div>
              </div>

              {onNavigateFinanceiro && (
                <button
                  type="button"
                  onClick={onNavigateFinanceiro}
                  className="text-xs bg-amber-600 hover:bg-amber-700 text-white font-bold px-2.5 py-1 rounded-lg transition-colors cursor-pointer flex-shrink-0"
                >
                  Conferir
                </button>
              )}
            </div>
          </div>
        )}

        {/* Alerta de Vencimento Próximo (dentro de 3 dias, exceto hoje e atrasadas) */}
        {tarefasProximas.filter(t => t.dataFimPrevista !== hojeStr && t.dataFimPrevista > hojeStr).map(t => (
          <div key={`proxima-${t.id}`} className="bg-slate-50 border border-slate-200 p-3 rounded-xl flex items-start gap-2.5">
            <Clock className="w-4 h-4 text-slate-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-slate-800">Vencimento Próximo</p>
              <p className="text-[11px] text-slate-600 mt-0.5">
                {t.titulo} (Vence em {new Date(t.dataFimPrevista + 'T00:00:00').toLocaleDateString('pt-BR')})
              </p>
            </div>
          </div>
        ))}

{/* Destaque: Card Prominente de RDO Automático Aguardando Confirmação */}
      {rdosPendentes.length > 0 && (
        <div className="bg-gradient-to-br from-purple-900 via-indigo-900 to-slate-900 text-white rounded-2xl p-4 shadow-md border border-purple-800/60 relative overflow-hidden">
          <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 opacity-10 pointer-events-none">
            <FileCheck2 className="w-36 h-36 text-white" />
          </div>

          <div className="relative z-10 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-purple-500/30 text-purple-300 rounded-xl border border-purple-400/30">
                  <Sparkles className="w-5 h-5 text-amber-300" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-sm text-white">RDO Automático Gerado</h3>
                    <span className="text-[10px] bg-amber-400/20 text-amber-300 border border-amber-400/40 px-2 py-0.5 rounded-full font-bold">
                      Aguardando Confirmação
                    </span>
                  </div>
                  <p className="text-xs text-purple-200 mt-0.5">
                    Criado a partir dos checks realizados hoje no cronograma
                  </p>
                </div>
              </div>
            </div>

            {rdosPendentes.map(rdo => {
              const totalChecks = rdo.itensChecados?.length || 0;
              const totalFotos = rdo.fotosDia?.length || 0;

              return (
                <div key={rdo.id} className="bg-white/10 rounded-xl p-3 border border-white/10 space-y-2.5">
                  <div className="shrink-0 flex items-center justify-between text-xs">
                    <span className="font-semibold text-purple-100 flex items-center gap-1.5">
                      <CalendarDays className="w-3.5 h-3.5 text-purple-300" />
                      <strong>{new Date(rdo.data + 'T00:00:00').toLocaleDateString('pt-BR')}</strong>
                    </span>
                    <span className="text-[11px] text-purple-200">
                      {totalChecks} {totalChecks === 1 ? 'avanço checado' : 'avanços checados'}
                      {totalFotos > 0 && ` • ${totalFotos} foto(s)`}
                    </span>
                  </div>

                  <p className="text-xs text-slate-200 italic line-clamp-2 bg-black/20 p-2 rounded-lg">
                    "{rdo.resumoDia}"
                  </p>

                  <div className="flex items-center justify-end gap-2 pt-1 flex-wrap">
                    <button
                      type="button"
                      onClick={() => handleAbrirEditarRdo(rdo)}
                      className="px-3 py-1.5 bg-white/15 hover:bg-white/25 text-white font-bold text-xs rounded-xl border border-white/20 transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 shrink-0"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-purple-200" />
                      Editar antes de confirmar
                    </button>

                    <button
                      type="button"
                      onClick={() => handleConfirmarRdoRapido(rdo.id)}
                      className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-xs hover:shadow transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 shrink-0"
                    >
                      <Check className="w-3.5 h-3.5" />
                      Confirmar RDO Agora
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

        {/* Estado sem nenhum alerta pendente */}
        {totalAlertasAtencao === 0 && comprasPendentes.length === 0 && previsoesAtingidas.length === 0 && (
          <div className="bg-emerald-50 text-emerald-700 p-3.5 rounded-xl flex items-center gap-2.5 text-xs font-medium">
            <CheckCircle className="w-4 h-4 flex-shrink-0 text-emerald-600" />
            <span>Tudo sob controle! Nenhum alerta crítico ou RDO pendente de confirmação.</span>
          </div>
        )}
      </div>

      {/* Modal de Edição de RDO antes da Confirmação */}
      <ModalEditarRdoConfirmacao
        isOpen={modalEditarRdoAberto}
        diario={diarioParaEditar}
        onClose={() => {
          setModalEditarRdoAberto(false);
          setDiarioParaEditar(null);
        }}
        onSalvarSemConfirmar={(atualizado) => {
          if (onUpdateDiario) {
            onUpdateDiario(atualizado.id, atualizado, []);
            setMensagemSucesso("RDO atualizado e mantido como rascunho!");
            setTimeout(() => setMensagemSucesso(null), 3500);
          }
        }}
        onSalvarEConfirmar={(atualizado) => {
          if (onUpdateDiario) {
            onUpdateDiario(atualizado.id, { ...atualizado, statusConfirmacao: 'CONFIRMADO' }, []);
          } else if (onConfirmarRdo) {
            onConfirmarRdo(atualizado.id);
          }
          setMensagemSucesso("RDO revisado e confirmado com sucesso!");
          setTimeout(() => setMensagemSucesso(null), 3500);
        }}
      />
    </div>
  );
}
