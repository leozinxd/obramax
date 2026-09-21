import React, { useState, useMemo } from 'react';
import { AppState, generateId } from '../store';
import { Obra, ObraStatus, Tarefa } from '../types';
import {
  Building2,
  Plus,
  Search,
  Calendar,
  Coins,
  Receipt,
  TrendingUp,
  CheckCircle2,
  Clock,
  Pencil,
  Trash2,
  X,
  AlertTriangle,
  ArrowRight,
  HardHat,
  Sparkles,
  Wallet,
  Briefcase
} from 'lucide-react';
import { CATEGORIAS_ETAPAS } from '../constants/categorias';

interface TelaInicialObrasProps {
  state: AppState;
  onSelecionarObra: (obraId: string) => void;
  onAddObra: (obra: Obra) => void;
  onUpdateObra: (id: string, updates: Partial<Obra>) => void;
  onDeleteObra: (id: string) => void;
  onAdicionarTarefasIniciais?: (tarefas: Tarefa[]) => void;
}

export function TelaInicialObras({
  state,
  onSelecionarObra,
  onAddObra,
  onUpdateObra,
  onDeleteObra,
  onAdicionarTarefasIniciais
}: TelaInicialObrasProps) {
  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState<string>('TODAS');
  const [modalNovaObraAberto, setModalNovaObraAberto] = useState(false);
  const [obraEmEdicao, setObraEmEdicao] = useState<Obra | null>(null);
  const [obraParaExcluir, setObraParaExcluir] = useState<Obra | null>(null);

  // Form states para Nova Obra
  const [novoNome, setNovoNome] = useState('');
  const [novoOrcamento, setNovoOrcamento] = useState('');
  const [novaDataInicio, setNovaDataInicio] = useState(new Date().toISOString().split('T')[0]);
  const [novoStatus, setNovoStatus] = useState<ObraStatus>('EM_ANDAMENTO');
  const [incluirEtapasPadrao, setIncluirEtapasPadrao] = useState(true);

  // Estatísticas gerais de todas as obras
  const estatisticas = useMemo(() => {
    const totalObras = state.obras.length;
    const emAndamento = state.obras.filter(o => o.status === 'EM_ANDAMENTO').length;
    const concluidas = state.obras.filter(o => o.status === 'CONCLUIDA').length;
    const pausadas = state.obras.filter(o => o.status === 'PAUSADA').length;
    const orcamentoTotal = state.obras.reduce((acc, o) => acc + (o.orcamentoPrevisto || 0), 0);

    return {
      totalObras,
      emAndamento,
      concluidas,
      pausadas,
      orcamentoTotal
    };
  }, [state.obras]);

  // Filtro de Obras
  const obrasFiltradas = useMemo(() => {
    return state.obras.filter(obra => {
      const matchTexto = busca.trim() === '' || obra.nome.toLowerCase().includes(busca.toLowerCase().trim());
      const matchStatus = filtroStatus === 'TODAS' || obra.status === filtroStatus;
      return matchTexto && matchStatus;
    });
  }, [state.obras, busca, filtroStatus]);

  // Função auxiliar para métricas de uma obra específica
  const getMetricasObra = (obraId: string) => {
    const tarefas = state.tarefas.filter(t => t.obraId === obraId);
    const compras = state.compras.filter(c => c.obraId === obraId && !c.isPrevisao);
    const pagamentos = state.pagamentosCliente.filter(p => p.obraId === obraId && !p.isPrevisao);

    const totalGasto = compras.reduce((acc, c) => acc + c.valorTotal, 0);
    const totalRecebido = pagamentos.reduce((acc, p) => acc + p.valor, 0);
    const saldo = totalRecebido - totalGasto;

    const totalTarefas = tarefas.length;
    const concluidasTarefas = tarefas.filter(t => t.status === 'CONCLUIDA').length;

    // Cálculo do progresso físico
    let progresso = 0;
    if (totalTarefas > 0) {
      let somaPercentuais = 0;
      tarefas.forEach(t => {
        const subs = t.subtarefas || [];
        if (t.status === 'CONCLUIDA') {
          somaPercentuais += 100;
        } else if (subs.length > 0) {
          const subsConcluidas = subs.filter(s => s.concluida).length;
          somaPercentuais += (subsConcluidas / subs.length) * 100;
        } else if (t.iniciada) {
          somaPercentuais += 0;
        }
      });
      progresso = Math.min(100, Math.round(somaPercentuais / totalTarefas));
    }

    return {
      totalGasto,
      totalRecebido,
      saldo,
      totalTarefas,
      concluidasTarefas,
      progresso
    };
  };

  const handleCriarObra = (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoNome.trim()) return;

    const novaObraId = 'obra-' + generateId();
    const orc = parseFloat(novoOrcamento) || 0;

    const novaObra: Obra = {
      id: novaObraId,
      nome: novoNome.trim(),
      orcamentoPrevisto: orc,
      dataInicio: novaDataInicio || new Date().toISOString().split('T')[0],
      status: novoStatus
    };

    // Adiciona obra
    onAddObra(novaObra);

    // Se o usuário optou por etapas padrão e o callback existir
    if (incluirEtapasPadrao && onAdicionarTarefasIniciais) {
      const hoje = novaObra.dataInicio;
      const em10Dias = new Date(new Date(hoje).getTime() + 10 * 86400000).toISOString().split('T')[0];
      const em20Dias = new Date(new Date(hoje).getTime() + 20 * 86400000).toISOString().split('T')[0];
      const em30Dias = new Date(new Date(hoje).getTime() + 30 * 86400000).toISOString().split('T')[0];

      const tarefasIniciais: Tarefa[] = [
        {
          id: 'tar-' + generateId(),
          obraId: novaObraId,
          titulo: 'Serviços Preliminares e Canteiro',
          categoria: 'Serviços preliminares',
          orcamentoPrevisto: orc > 0 ? Math.round(orc * 0.05) : 3000,
          dataInicioPrevista: hoje,
          dataFimPrevista: em10Dias,
          duracaoDias: 10,
          status: 'PENDENTE',
          iniciada: false,
          fotosExecucao: [],
          subtarefas: [
            {
              id: 'sub-' + generateId(),
              titulo: 'Ligação provisória de água e energia',
              categoria: 'Serviços preliminares',
              orcamentoPrevisto: 1000,
              dataInicioPrevista: hoje,
              dataFimPrevista: em10Dias,
              duracaoDias: 10,
              concluida: false
            }
          ]
        },
        {
          id: 'tar-' + generateId(),
          obraId: novaObraId,
          titulo: 'Infraestrutura e Fundações',
          categoria: 'Infraestrutura',
          orcamentoPrevisto: orc > 0 ? Math.round(orc * 0.2) : 15000,
          dataInicioPrevista: em10Dias,
          dataFimPrevista: em20Dias,
          duracaoDias: 10,
          status: 'PENDENTE',
          iniciada: false,
          fotosExecucao: [],
          subtarefas: []
        },
        {
          id: 'tar-' + generateId(),
          obraId: novaObraId,
          titulo: 'Estrutura e Alvenaria',
          categoria: 'Superestrutura',
          orcamentoPrevisto: orc > 0 ? Math.round(orc * 0.25) : 20000,
          dataInicioPrevista: em20Dias,
          dataFimPrevista: em30Dias,
          duracaoDias: 10,
          status: 'PENDENTE',
          iniciada: false,
          fotosExecucao: [],
          subtarefas: []
        }
      ];

      onAdicionarTarefasIniciais(tarefasIniciais);
    }

    // Limpa formulário e fecha modal
    setNovoNome('');
    setNovoOrcamento('');
    setNovaDataInicio(new Date().toISOString().split('T')[0]);
    setNovoStatus('EM_ANDAMENTO');
    setModalNovaObraAberto(false);

    // Seleciona a obra criada imediatamente
    onSelecionarObra(novaObraId);
  };

  const handleSalvarEdicao = (e: React.FormEvent) => {
    e.preventDefault();
    if (!obraEmEdicao || !obraEmEdicao.nome.trim()) return;

    onUpdateObra(obraEmEdicao.id, {
      nome: obraEmEdicao.nome.trim(),
      orcamentoPrevisto: Number(obraEmEdicao.orcamentoPrevisto) || 0,
      dataInicio: obraEmEdicao.dataInicio,
      status: obraEmEdicao.status
    });

    setObraEmEdicao(null);
  };

  const handleConfirmarExclusao = () => {
    if (!obraParaExcluir) return;
    onDeleteObra(obraParaExcluir.id);
    setObraParaExcluir(null);
  };

  const formatarDataBR = (dataIso?: string) => {
    if (!dataIso) return '-';
    const [ano, mes, dia] = dataIso.split('T')[0].split('-');
    return `${dia}/${mes}/${ano}`;
  };

  const badgeStatus = (status: ObraStatus) => {
    switch (status) {
      case 'EM_ANDAMENTO':
        return {
          texto: 'Em Andamento',
          classe: 'bg-indigo-50 border-indigo-200 text-indigo-700'
        };
      case 'CONCLUIDA':
        return {
          texto: 'Concluída',
          classe: 'bg-emerald-50 border-emerald-200 text-emerald-700'
        };
      case 'PAUSADA':
        return {
          texto: 'Pausada',
          classe: 'bg-amber-50 border-amber-200 text-amber-800'
        };
      default:
        return {
          texto: status,
          classe: 'bg-slate-50 border-slate-200 text-slate-700'
        };
    }
  };

  return (
    <div className="space-y-5 pb-20">
      {/* Top Banner & Apresentação */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white rounded-3xl p-5 shadow-xl border border-slate-700 relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 w-40 h-40 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/30">
              <HardHat className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-black tracking-widest text-indigo-300 block">
                OBRAMAX
              </span>
              <h1 className="text-xl font-bold text-white leading-tight">
                Painel de Obras
              </h1>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setModalNovaObraAberto(true)}
            className="shrink-0 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white text-xs font-bold px-3.5 py-2.5 rounded-xl transition-all shadow-md shadow-indigo-600/30 flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Obra</span>
          </button>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed mb-4">
          Selecione uma obra para acessar o cronograma, caixa financeiro e diário de obra, ou cadastre um novo projeto.
        </p>

        {/* Resumo Numérico Rápido */}
        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-700/80">
          <div className="bg-slate-800/60 rounded-xl p-2.5 border border-slate-700/50">
            <span className="text-[10px] text-slate-400 block font-semibold">Total de Obras</span>
            <span className="text-base font-black text-white">{estatisticas.totalObras}</span>
          </div>
          <div className="bg-slate-800/60 rounded-xl p-2.5 border border-slate-700/50">
            <span className="text-[10px] text-indigo-300 block font-semibold">Em Andamento</span>
            <span className="text-base font-black text-indigo-300">{estatisticas.emAndamento}</span>
          </div>
          <div className="bg-slate-800/60 rounded-xl p-2.5 border border-slate-700/50">
            <span className="text-[10px] text-emerald-300 block font-semibold">Concluídas</span>
            <span className="text-base font-black text-emerald-300">{estatisticas.concluidas}</span>
          </div>
        </div>
      </div>

      {/* Barra de Busca e Filtros */}
      <div className="space-y-2.5">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar obra pelo nome..."
            value={busca}
            onChange={e => setBusca(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-9 py-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs"
          />
          {busca && (
            <button
              type="button"
              onClick={() => setBusca('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Chips de Status */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
          <button
            type="button"
            onClick={() => setFiltroStatus('TODAS')}
            className={`text-[11px] px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer shrink-0 ${
              filtroStatus === 'TODAS'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            Todas ({state.obras.length})
          </button>
          <button
            type="button"
            onClick={() => setFiltroStatus('EM_ANDAMENTO')}
            className={`text-[11px] px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer shrink-0 ${
              filtroStatus === 'EM_ANDAMENTO'
                ? 'bg-indigo-600 text-white shadow-2xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            Em Andamento ({estatisticas.emAndamento})
          </button>
          <button
            type="button"
            onClick={() => setFiltroStatus('CONCLUIDA')}
            className={`text-[11px] px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer shrink-0 ${
              filtroStatus === 'CONCLUIDA'
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            Concluídas ({estatisticas.concluidas})
          </button>
          {estatisticas.pausadas > 0 && (
            <button
              type="button"
              onClick={() => setFiltroStatus('PAUSADA')}
              className={`text-[11px] px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer shrink-0 ${
                filtroStatus === 'PAUSADA'
                  ? 'bg-amber-600 text-white shadow-2xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              Pausadas ({estatisticas.pausadas})
            </button>
          )}
        </div>
      </div>

      {/* Lista de Obras */}
      <div className="space-y-3.5">
        {obrasFiltradas.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center border border-slate-200 shadow-sm space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">
                {busca ? 'Nenhuma obra encontrada' : 'Nenhuma obra cadastrada'}
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                {busca
                  ? 'Não encontramos nenhuma obra com esse nome. Tente alterar o termo da pesquisa.'
                  : 'Comece cadastrando sua primeira obra para gerenciar cronograma, gastos e diários.'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setModalNovaObraAberto(true)}
              className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Criar Primeira Obra</span>
            </button>
          </div>
        ) : (
          obrasFiltradas.map(obra => {
            const metricas = getMetricasObra(obra.id);
            const statusInfo = badgeStatus(obra.status);
            const orcamento = obra.orcamentoPrevisto || 0;
            const percentualGasto = orcamento > 0 ? Math.min(100, Math.round((metricas.totalGasto / orcamento) * 100)) : 0;
            const isEstourado = orcamento > 0 && metricas.totalGasto > orcamento;

            return (
              <div
                key={obra.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all p-4 space-y-3.5 group"
              >
                {/* Linha Superior: Nome + Status + Ações Rápidas */}
                <div className="flex items-start justify-between gap-2">
                  <div
                    onClick={() => onSelecionarObra(obra.id)}
                    className="flex-1 cursor-pointer select-none"
                  >
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                        {obra.nome}
                      </h2>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${statusInfo.classe}`}>
                        {statusInfo.texto}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-1">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        Início: {formatarDataBR(obra.dataInicio)}
                      </span>
                      <span>•</span>
                      <span>{metricas.totalTarefas} {metricas.totalTarefas === 1 ? 'etapa' : 'etapas'}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      title="Editar Obra"
                      onClick={() => setObraEmEdicao({ ...obra })}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      title="Excluir Obra"
                      onClick={() => setObraParaExcluir(obra)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Barra de Progresso Físico da Obra */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="font-semibold text-slate-600 flex items-center gap-1">
                      <TrendingUp className="w-3 h-3 text-indigo-600" />
                      Progresso Físico
                    </span>
                    <span className="font-bold text-slate-800">{metricas.progresso}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        metricas.progresso === 100
                          ? 'bg-emerald-500'
                          : metricas.progresso > 50
                          ? 'bg-indigo-600'
                          : 'bg-indigo-400'
                      }`}
                      style={{ width: `${metricas.progresso}%` }}
                    />
                  </div>
                </div>

                {/* Métricas Financeiras e Operacionais */}
                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100">
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <span className="text-[10px] text-slate-500 font-medium block flex items-center gap-1">
                      <Coins className="w-3 h-3 text-emerald-600" />
                      Orçamento Previsto
                    </span>
                    <span className="text-xs font-bold text-slate-800 block mt-0.5">
                      R$ {orcamento.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className={`p-2.5 rounded-xl border ${isEstourado ? 'bg-rose-50 border-rose-100' : 'bg-slate-50 border-slate-100'}`}>
                    <span className="text-[10px] font-medium block flex items-center gap-1 text-slate-500">
                      <Receipt className={`w-3 h-3 ${isEstourado ? 'text-rose-600' : 'text-slate-500'}`} />
                      Gastos Realizados
                    </span>
                    <span className={`text-xs font-bold block mt-0.5 ${isEstourado ? 'text-rose-700' : 'text-slate-800'}`}>
                      R$ {metricas.totalGasto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                {/* Botão de Acessar a Obra */}
                <button
                  type="button"
                  onClick={() => onSelecionarObra(obra.id)}
                  className="w-full bg-slate-900 hover:bg-indigo-600 text-white text-xs font-bold py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 shadow-2xs group-hover:bg-indigo-600 cursor-pointer"
                >
                  <span>Acessar Painel da Obra</span>
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Modal: Cadastrar Nova Obra */}
      {modalNovaObraAberto && (
        <div
          onClick={() => setModalNovaObraAberto(false)}
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150 cursor-pointer"
        >
          <div
            onClick={e => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200 cursor-default"
          >
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center">
                  <Building2 className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-bold">Cadastrar Nova Obra</h3>
                  <p className="text-[10px] text-slate-300">Defina o nome e orçamento inicial</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalNovaObraAberto(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCriarObra} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nome da Obra / Projeto *
                </label>
                <input
                  required
                  type="text"
                  placeholder="Ex: Residencial Alphaville, Reforma Clínica..."
                  value={novoNome}
                  onChange={e => setNovoNome(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Orçamento Previsto (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0,00"
                    value={novoOrcamento}
                    onChange={e => setNovoOrcamento(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Data de Início
                  </label>
                  <input
                    type="date"
                    value={novaDataInicio}
                    onChange={e => setNovaDataInicio(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Status Inicial
                </label>
                <select
                  value={novoStatus}
                  onChange={e => setNovoStatus(e.target.value as ObraStatus)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="EM_ANDAMENTO">Em Andamento</option>
                  <option value="PAUSADA">Pausada</option>
                  <option value="CONCLUIDA">Concluída</option>
                </select>
              </div>

              {onAdicionarTarefasIniciais && (
                <label className="flex items-start gap-2.5 p-3 rounded-xl bg-indigo-50/70 border border-indigo-100 text-xs text-indigo-950 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={incluirEtapasPadrao}
                    onChange={e => setIncluirEtapasPadrao(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded mt-0.5"
                  />
                  <div>
                    <span className="font-bold block">Adicionar etapas preliminares sugeridas</span>
                    <span className="text-[10px] text-indigo-800 leading-snug block mt-0.5">
                      Cria automaticamente tarefas base no cronograma (Serviços Preliminares, Fundações, Estrutura).
                    </span>
                  </div>
                </label>
              )}

              <div className="flex gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalNovaObraAberto(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer"
                >
                  Criar e Acessar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Editar Obra */}
      {obraEmEdicao && (
        <div
          onClick={() => setObraEmEdicao(null)}
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150 cursor-pointer"
        >
          <div
            onClick={e => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200 cursor-default"
          >
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Pencil className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-bold">Editar Dados da Obra</h3>
              </div>
              <button
                type="button"
                onClick={() => setObraEmEdicao(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSalvarEdicao} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nome da Obra *
                </label>
                <input
                  required
                  type="text"
                  value={obraEmEdicao.nome}
                  onChange={e => setObraEmEdicao({ ...obraEmEdicao, nome: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Orçamento Previsto (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={obraEmEdicao.orcamentoPrevisto ?? ''}
                    onChange={e => setObraEmEdicao({ ...obraEmEdicao, orcamentoPrevisto: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Data de Início
                  </label>
                  <input
                    type="date"
                    value={obraEmEdicao.dataInicio}
                    onChange={e => setObraEmEdicao({ ...obraEmEdicao, dataInicio: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Status da Obra
                </label>
                <select
                  value={obraEmEdicao.status}
                  onChange={e => setObraEmEdicao({ ...obraEmEdicao, status: e.target.value as ObraStatus })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="EM_ANDAMENTO">Em Andamento</option>
                  <option value="PAUSADA">Pausada</option>
                  <option value="CONCLUIDA">Concluída</option>
                </select>
              </div>

              <div className="flex gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setObraEmEdicao(null)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer"
                >
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Confirmar Exclusão de Obra */}
      {obraParaExcluir && (
        <div
          onClick={() => setObraParaExcluir(null)}
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150 cursor-pointer"
        >
          <div
            onClick={e => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200 cursor-default"
          >
            <div className="bg-rose-600 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-white" />
                <h3 className="text-sm font-bold">Excluir Obra?</h3>
              </div>
              <button
                type="button"
                onClick={() => setObraParaExcluir(null)}
                className="text-rose-200 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-3">
              <p className="text-xs text-slate-600">
                Tem certeza que deseja excluir a obra <strong className="text-slate-900">{obraParaExcluir.nome}</strong>?
              </p>
              <div className="bg-rose-50 border border-rose-100 rounded-xl p-3 text-[11px] text-rose-800 space-y-1">
                <p className="font-bold">Atenção:</p>
                <p>Todas as tarefas, compras, pagamentos, relatórios diários (RDO) e tickets vinculados a esta obra também serão removidos permanentemente.</p>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setObraParaExcluir(null)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmarExclusao}
                  className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer"
                >
                  Sim, Excluir
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
