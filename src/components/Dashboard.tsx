import React, { useState } from 'react';
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
  ExternalLink
} from 'lucide-react';
import { ModalEditarRdoConfirmacao } from './ModalEditarRdoConfirmacao';

interface DashboardProps {
  state: AppState;
  onNavigateFinanceiro?: () => void;
  onNavigateCronograma?: () => void;
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

  // Filtragem de tarefas para o relatório
  const tarefasFiltradas = apenasComGastos 
    ? relatorioTarefas.filter(t => t.totalGasto > 0 || t.totalPrevisaoTarefa > 0) 
    : relatorioTarefas;

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
      {/* DISTRIBUIÇÃO DE DESPESAS POR CATEGORIA (MATERIAL, SERVIÇO, TRANSPORTE, ALIMENTAÇÃO) */}
      {/* ========================================================================= */}
      <div className="bg-white p-4 rounded-2xl shadow-xs border border-slate-200/80 space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-rose-50 text-rose-600 rounded-lg">
              <PieChart className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Despesas por Categoria</h3>
              <p className="text-[11px] text-slate-500">Distribuição dos custos por tipo de gasto</p>
            </div>
          </div>
          {onNavigateFinanceiro && (
            <button
              type="button"
              onClick={onNavigateFinanceiro}
              className="text-[11px] font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1 bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded-lg transition-colors cursor-pointer"
            >
              Extrato
              <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {relatorioCategorias.map(cat => {
            const Icone = cat.Icon;
            return (
              <div 
                key={cat.nome} 
                className={`p-3 rounded-xl border ${cat.border} ${cat.bg} flex flex-col justify-between space-y-2`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">{cat.nome}</span>
                  <div className={`p-1 rounded-lg bg-white/70 ${cat.cor}`}>
                    <Icone className="w-3.5 h-3.5" />
                  </div>
                </div>

                <div>
                  <span className="text-sm font-black text-slate-900 block">
                    R$ {cat.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                  <div className="flex items-center justify-between text-[10px] text-slate-500 mt-0.5 font-medium">
                    <span>{cat.percentual.toFixed(1)}%</span>
                    {/* <span>{cat.quantidadeDespesas} desp. • {cat.totalItens} it.</span> */}
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
              <h3 className="font-bold text-slate-800 text-sm">Relatório de Gastos por Etapa</h3>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Custos contabilizados por etapas e subtarefas
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setApenasComGastos(!apenasComGastos)}
              className={`text-[11px] px-2.5 py-1 rounded-lg border font-medium transition-colors cursor-pointer ${
                apenasComGastos 
                  ? 'bg-indigo-50 text-indigo-700 border-indigo-200' 
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              {apenasComGastos ? 'Mostrando com Gastos' : 'Mostrar Todos'}
            </button>
          </div>
        </div>

        {/* Resumo de Alocação de Gastos */}
        <div className="grid grid-cols-2 gap-2.5 bg-slate-50 p-3 rounded-xl border border-slate-100">
          <div>
            <span className="text-[10px] text-slate-500 font-medium block">Alocado em Etapas</span>
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
