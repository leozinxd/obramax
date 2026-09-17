import React, { useState, useMemo } from 'react';
import { AppState, generateId } from '../store';
import { Compra, PagamentoCliente, CategoriaDespesa, CATEGORIAS_DESPESA, ItemDespesa } from '../types';
import { 
  Receipt,
  DollarSign, 
  Wallet, 
  Clock, 
  Check,
  CheckCircle2, 
  AlertCircle, 
  CalendarClock, 
  TrendingDown, 
  TrendingUp, 
  Filter, 
  Trash2, 
  Pencil,
  Calendar,
  Sparkles,
  ArrowRight,
  Eye,
  X,
  Package,
  Wrench,
  Truck,
  Utensils,
  Plus,
  ChevronDown,
  ChevronUp,
  Layers,
  Calculator
} from 'lucide-react';
import { ImageUploader } from './ImageUploader';

interface FormItemDespesa {
  id: string;
  item: string;
  valorUnitario: string;
  quantidade: string;
}

const criarItemVazio = (): FormItemDespesa => ({
  id: generateId(),
  item: '',
  valorUnitario: '',
  quantidade: '1'
});

export function getCategoriaInfo(categoria?: CategoriaDespesa) {
  switch (categoria) {
    case 'Serviço':
      return {
        label: 'Serviço',
        Icon: Wrench,
        badgeClass: 'bg-amber-100 text-amber-800 border-amber-200',
        activeBtn: 'bg-amber-500 text-white border-amber-500 shadow-xs ring-2 ring-amber-300',
        inactiveBtn: 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
      };
    case 'Transporte':
      return {
        label: 'Transporte',
        Icon: Truck,
        badgeClass: 'bg-sky-100 text-sky-800 border-sky-200',
        activeBtn: 'bg-sky-600 text-white border-sky-600 shadow-xs ring-2 ring-sky-300',
        inactiveBtn: 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
      };
    case 'Alimentação':
      return {
        label: 'Alimentação',
        Icon: Utensils,
        badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
        activeBtn: 'bg-emerald-600 text-white border-emerald-600 shadow-xs ring-2 ring-emerald-300',
        inactiveBtn: 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
      };
    case 'Material':
    default:
      return {
        label: 'Material',
        Icon: Package,
        badgeClass: 'bg-indigo-100 text-indigo-800 border-indigo-200',
        activeBtn: 'bg-indigo-600 text-white border-indigo-600 shadow-xs ring-2 ring-indigo-300',
        inactiveBtn: 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
      };
  }
}

interface FinanceiroProps {
  state: AppState;
  onAddCompra: (compra: any) => void;
  onUpdateCompra?: (id: string, updates: Partial<Compra>) => void;
  onConfirmarCompra?: (id: string, dataEfetivada?: string) => void;
  onDeleteCompra?: (id: string) => void;
  onAddPagamento: (pag: any) => void;
  onUpdatePagamento?: (id: string, updates: Partial<PagamentoCliente>) => void;
  onConfirmarPagamento?: (id: string, dataEfetivada?: string) => void;
  onDeletePagamento?: (id: string) => void;
}

type FiltroExtrato = 'TODOS' | 'EFETIVADOS' | 'PREVISOES';

interface ItemModalConfirmacao {
  tipo: 'COMPRA' | 'PAGAMENTO';
  item: Compra | PagamentoCliente;
}

export function Financeiro({ 
  state, 
  onAddCompra, 
  onUpdateCompra,
  onConfirmarCompra,
  onDeleteCompra,
  onAddPagamento,
  onUpdatePagamento,
  onConfirmarPagamento,
  onDeletePagamento
}: FinanceiroProps) {
  const [activeTab, setActiveTab] = useState<'RESUMO' | 'NOVA_COMPRA' | 'NOVO_PAGAMENTO'>('RESUMO');
  const [filtroExtrato, setFiltroExtrato] = useState<FiltroExtrato>('TODOS');
  const [filtroCategoria, setFiltroCategoria] = useState<'TODAS' | CategoriaDespesa>('TODAS');
  const [despesasExpandidas, setDespesasExpandidas] = useState<{ [compraId: string]: boolean }>({});
  
  const toggleExpandirDespesa = (id: string) => {
    setDespesasExpandidas(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Modais de confirmação e detalhes
  const [itemParaConfirmar, setItemParaConfirmar] = useState<ItemModalConfirmacao | null>(null);
  const [dataEfetivacao, setDataEfetivacao] = useState(new Date().toISOString().split('T')[0]);
  const [comprovanteConfirmacao, setComprovanteConfirmacao] = useState<string>('');
  const [visualizarComprovante, setVisualizarComprovante] = useState<string | null>(null);
  const [itemParaExcluir, setItemParaExcluir] = useState<{ tipo: 'COMPRA' | 'PAGAMENTO'; id: string; titulo: string } | null>(null);

  // Modal de Edição de Receita / Despesa
  const [itemParaEditar, setItemParaEditar] = useState<{ tipo: 'COMPRA' | 'PAGAMENTO'; item: Compra | PagamentoCliente } | null>(null);
  
  // Estados do formulário de edição - Compra
  const [editCompraCategoria, setEditCompraCategoria] = useState<CategoriaDespesa>('Material');
  const [editCompraMaterial, setEditCompraMaterial] = useState('');
  const [editCompraItens, setEditCompraItens] = useState<FormItemDespesa[]>([]);
  const [editCompraData, setEditCompraData] = useState('');
  const [editCompraTarefa, setEditCompraTarefa] = useState('');
  const [editCompraSubtarefa, setEditCompraSubtarefa] = useState('');
  const [editCompraBase64, setEditCompraBase64] = useState('');
  const [editCompraIsPrevisao, setEditCompraIsPrevisao] = useState(false);

  // Estados do formulário de edição - Pagamento
  const [editPagDescricao, setEditPagDescricao] = useState('');
  const [editPagValor, setEditPagValor] = useState('');
  const [editPagData, setEditPagData] = useState('');
  const [editPagMetodo, setEditPagMetodo] = useState('PIX');
  const [editPagBase64, setEditPagBase64] = useState('');
  const [editPagIsPrevisao, setEditPagIsPrevisao] = useState(false);

  const obraId = state.obraAtivaId;
  if (!obraId) return null;

  const tarefas = state.tarefas.filter(t => t.obraId === obraId);
  const compras = state.compras.filter(c => c.obraId === obraId);
  const pagamentos = state.pagamentosCliente.filter(p => p.obraId === obraId);

  const hojeStr = new Date().toISOString().split('T')[0];

  // Form State - Nova Compra / Despesa
  const [compraCategoria, setCompraCategoria] = useState<CategoriaDespesa>('Material');
  const [compraMaterial, setCompraMaterial] = useState('');
  const [compraItens, setCompraItens] = useState<FormItemDespesa[]>([criarItemVazio()]);
  const [compraData, setCompraData] = useState(hojeStr);
  const [compraTarefa, setCompraTarefa] = useState('');
  const [compraSubtarefa, setCompraSubtarefa] = useState('');
  const [compraBase64, setCompraBase64] = useState('');

  const isCompraDataFutura = compraData > hojeStr;
  const tarefaSelecionadaObj = tarefas.find(t => t.id === compraTarefa);

  // Manipulação de Itens da Nova Compra
  const adicionarItemCompra = () => {
    setCompraItens(prev => [...prev, criarItemVazio()]);
  };

  const removerItemCompra = (id: string) => {
    setCompraItens(prev => prev.length > 1 ? prev.filter(it => it.id !== id) : prev);
  };

  const atualizarItemCompra = (id: string, campo: 'item' | 'valorUnitario' | 'quantidade', valor: string) => {
    setCompraItens(prev => prev.map(it => it.id === id ? { ...it, [campo]: valor } : it));
  };

  // Cálculo do Total da Despesa: soma do total de cada item (valor unitário x quantidade)
  const totalCompraCalculado = useMemo(() => {
    return compraItens.reduce((acc, it) => {
      const vUnit = parseFloat(it.valorUnitario) || 0;
      const qtd = parseFloat(it.quantidade) || 0;
      return acc + (vUnit * qtd);
    }, 0);
  }, [compraItens]);

  // Manipulação de Itens da Edição de Compra
  const adicionarItemEditCompra = () => {
    setEditCompraItens(prev => [...prev, criarItemVazio()]);
  };

  const removerItemEditCompra = (id: string) => {
    setEditCompraItens(prev => prev.length > 1 ? prev.filter(it => it.id !== id) : prev);
  };

  const atualizarItemEditCompra = (id: string, campo: 'item' | 'valorUnitario' | 'quantidade', valor: string) => {
    setEditCompraItens(prev => prev.map(it => it.id === id ? { ...it, [campo]: valor } : it));
  };

  const totalEditCompraCalculado = useMemo(() => {
    return editCompraItens.reduce((acc, it) => {
      const vUnit = parseFloat(it.valorUnitario) || 0;
      const qtd = parseFloat(it.quantidade) || 0;
      return acc + (vUnit * qtd);
    }, 0);
  }, [editCompraItens]);

  const handleSalvarCompra = (e: React.FormEvent) => {
    e.preventDefault();
    const isFutura = compraData > hojeStr;

    // Converte os itens cadastrados
    const itensConvertidos: ItemDespesa[] = compraItens.map((it, idx) => {
      const vUnit = parseFloat(it.valorUnitario) || 0;
      const qtd = parseFloat(it.quantidade) || 0;
      return {
        id: it.id || generateId(),
        item: it.item.trim() || `Item ${idx + 1}`,
        valorUnitario: vUnit,
        quantidade: qtd,
        valorTotal: vUnit * qtd
      };
    });

    const somaTotalItens = itensConvertidos.reduce((acc, it) => acc + it.valorTotal, 0);
    
    // Se o usuário não deu um título geral, usa o primeiro item e indicador de quantidade
    const tituloFinal = compraMaterial.trim() || (
      itensConvertidos[0]?.item + (itensConvertidos.length > 1 ? ` (+${itensConvertidos.length - 1} itens)` : '')
    );

    onAddCompra({
      id: generateId(),
      obraId,
      tarefaId: compraTarefa || undefined,
      subtarefaId: compraSubtarefa || undefined,
      categoria: compraCategoria,
      nomeMaterial: tituloFinal,
      itens: itensConvertidos,
      valorTotal: somaTotalItens,
      dataNecessidade: compraData,
      statusCompra: isFutura ? 'PENDENTE' : 'COMPRADO',
      comprovanteBase64: compraBase64 || undefined,
      isPrevisao: isFutura
    });

    setActiveTab('RESUMO');
    setCompraCategoria('Material');
    setCompraMaterial(''); 
    setCompraItens([criarItemVazio()]);
    setCompraBase64('');
    setCompraTarefa('');
    setCompraSubtarefa('');
    setCompraData(hojeStr);
  };

  // Form State - Pagamento
  const [pagDescricao, setPagDescricao] = useState('');
  const [pagValor, setPagValor] = useState('');
  const [pagData, setPagData] = useState(hojeStr);
  const [pagMetodo, setPagMetodo] = useState('PIX');
  const [pagBase64, setPagBase64] = useState('');

  const isPagDataFutura = pagData > hojeStr;

  const handleSalvarPagamento = (e: React.FormEvent) => {
    e.preventDefault();
    const isFutura = pagData > hojeStr;
    onAddPagamento({
      id: generateId(),
      obraId,
      descricao: pagDescricao.trim() || 'Recebimento do Cliente',
      valor: parseFloat(pagValor),
      data: pagData,
      metodo: pagMetodo,
      comprovanteBase64: pagBase64 || undefined,
      isPrevisao: isFutura
    });
    setActiveTab('RESUMO');
    setPagDescricao('');
    setPagValor(''); 
    setPagBase64('');
    setPagData(hojeStr);
  };

  // Cálculos Financeiros
  // 1. Contabilizados (Apenas efetivados, onde isPrevisao é false ou undefined)
  const pagamentosEfetivados = useMemo(() => pagamentos.filter(p => !p.isPrevisao), [pagamentos]);
  const comprasEfetivadas = useMemo(() => compras.filter(c => !c.isPrevisao), [compras]);
  
  const totalRecebido = useMemo(() => pagamentosEfetivados.reduce((acc, p) => acc + p.valor, 0), [pagamentosEfetivados]);
  const totalGasto = useMemo(() => comprasEfetivadas.reduce((acc, c) => acc + c.valorTotal, 0), [comprasEfetivadas]);
  const saldoReal = totalRecebido - totalGasto;

  // 2. Previsões (onde isPrevisao é true)
  const pagamentosPrevisao = useMemo(() => pagamentos.filter(p => !!p.isPrevisao), [pagamentos]);
  const comprasPrevisao = useMemo(() => compras.filter(c => !!c.isPrevisao), [compras]);
  
  const totalPrevisaoReceita = useMemo(() => pagamentosPrevisao.reduce((acc, p) => acc + p.valor, 0), [pagamentosPrevisao]);
  const totalPrevisaoGasto = useMemo(() => comprasPrevisao.reduce((acc, c) => acc + c.valorTotal, 0), [comprasPrevisao]);
  const saldoProjetado = saldoReal + totalPrevisaoReceita - totalPrevisaoGasto;

  const totalPrevisoesPendentes = pagamentosPrevisao.length + comprasPrevisao.length;

  // Lista unificada para o extrato
  const listaExtrato = useMemo(() => {
    const unificados = [
      ...compras.map(c => ({ ...c, tipoLancamento: 'COMPRA' as const })),
      ...pagamentos.map(p => ({ ...p, tipoLancamento: 'PAGAMENTO' as const }))
    ];

    return unificados
      .filter(item => {
        if (filtroExtrato === 'EFETIVADOS' && item.isPrevisao) return false;
        if (filtroExtrato === 'PREVISOES' && !item.isPrevisao) return false;
        if (filtroCategoria !== 'TODAS') {
          if (item.tipoLancamento === 'COMPRA') {
            const cat = (item as Compra).categoria || 'Material';
            if (cat !== filtroCategoria) return false;
          } else {
            return false;
          }
        }
        return true;
      })
      .sort((a, b) => {
        const dateA = new Date(a.tipoLancamento === 'COMPRA' ? a.dataNecessidade : a.data).getTime();
        const dateB = new Date(b.tipoLancamento === 'COMPRA' ? b.dataNecessidade : b.data).getTime();
        return dateB - dateA;
      });
  }, [compras, pagamentos, filtroExtrato, filtroCategoria]);

  const abrirConfirmacao = (tipo: 'COMPRA' | 'PAGAMENTO', item: Compra | PagamentoCliente) => {
    setItemParaConfirmar({ tipo, item });
    setDataEfetivacao(hojeStr);
    setComprovanteConfirmacao(item.comprovanteBase64 || '');
  };

  const executarConfirmacao = () => {
    if (!itemParaConfirmar) return;
    if (itemParaConfirmar.tipo === 'COMPRA' && onConfirmarCompra) {
      onConfirmarCompra(itemParaConfirmar.item.id, dataEfetivacao);
    } else if (itemParaConfirmar.tipo === 'PAGAMENTO' && onConfirmarPagamento) {
      onConfirmarPagamento(itemParaConfirmar.item.id, dataEfetivacao);
    }
    setItemParaConfirmar(null);
  };

  const executarExclusao = () => {
    if (!itemParaExcluir) return;
    if (itemParaExcluir.tipo === 'COMPRA' && onDeleteCompra) {
      onDeleteCompra(itemParaExcluir.id);
    } else if (itemParaExcluir.tipo === 'PAGAMENTO' && onDeletePagamento) {
      onDeletePagamento(itemParaExcluir.id);
    }
    setItemParaExcluir(null);
  };

  const abrirEdicao = (tipo: 'COMPRA' | 'PAGAMENTO', item: Compra | PagamentoCliente) => {
    setItemParaEditar({ tipo, item });
    if (tipo === 'COMPRA') {
      const c = item as Compra;
      setEditCompraCategoria(c.categoria || 'Material');
      setEditCompraMaterial(c.nomeMaterial || '');
      setEditCompraData(c.dataNecessidade || hojeStr);
      setEditCompraTarefa(c.tarefaId || '');
      setEditCompraSubtarefa(c.subtarefaId || '');
      setEditCompraBase64(c.comprovanteBase64 || '');
      setEditCompraIsPrevisao(!!c.isPrevisao);

      if (c.itens && c.itens.length > 0) {
        setEditCompraItens(c.itens.map(it => ({
          id: it.id || generateId(),
          item: it.item || '',
          valorUnitario: (it.valorUnitario !== undefined && it.valorUnitario !== null) ? it.valorUnitario.toString() : '',
          quantidade: (it.quantidade !== undefined && it.quantidade !== null) ? it.quantidade.toString() : '1'
        })));
      } else {
        setEditCompraItens([{
          id: generateId(),
          item: c.nomeMaterial || '',
          valorUnitario: c.valorTotal ? c.valorTotal.toString() : '',
          quantidade: '1'
        }]);
      }
    } else {
      const p = item as PagamentoCliente;
      setEditPagDescricao(p.descricao || '');
      setEditPagValor(p.valor ? p.valor.toString() : '');
      setEditPagData(p.data || hojeStr);
      setEditPagMetodo(p.metodo || 'PIX');
      setEditPagBase64(p.comprovanteBase64 || '');
      setEditPagIsPrevisao(!!p.isPrevisao);
    }
  };

  const salvarEdicao = (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemParaEditar) return;

    if (itemParaEditar.tipo === 'COMPRA' && onUpdateCompra) {
      const itensConvertidos: ItemDespesa[] = editCompraItens.map((it, idx) => {
        const vUnit = parseFloat(it.valorUnitario) || 0;
        const qtd = parseFloat(it.quantidade) || 0;
        return {
          id: it.id || generateId(),
          item: it.item.trim() || `Item ${idx + 1}`,
          valorUnitario: vUnit,
          quantidade: qtd,
          valorTotal: vUnit * qtd
        };
      });

      const somaTotalItens = itensConvertidos.reduce((acc, it) => acc + it.valorTotal, 0);
      if (somaTotalItens <= 0 && itensConvertidos.length === 0) return;

      const tituloFinal = editCompraMaterial.trim() || (
        itensConvertidos[0]?.item + (itensConvertidos.length > 1 ? ` (+${itensConvertidos.length - 1} itens)` : '')
      );

      onUpdateCompra(itemParaEditar.item.id, {
        categoria: editCompraCategoria,
        nomeMaterial: tituloFinal,
        itens: itensConvertidos,
        valorTotal: somaTotalItens,
        dataNecessidade: editCompraData,
        tarefaId: editCompraTarefa || undefined,
        subtarefaId: editCompraSubtarefa || undefined,
        comprovanteBase64: editCompraBase64 || undefined,
        isPrevisao: editCompraIsPrevisao,
        statusCompra: editCompraIsPrevisao ? 'PENDENTE' : 'COMPRADO'
      });
    } else if (itemParaEditar.tipo === 'PAGAMENTO' && onUpdatePagamento) {
      const valorNum = parseFloat(editPagValor);
      if (isNaN(valorNum) || valorNum <= 0) return;

      onUpdatePagamento(itemParaEditar.item.id, {
        descricao: editPagDescricao.trim() || 'Recebimento do Cliente',
        valor: valorNum,
        data: editPagData,
        metodo: editPagMetodo,
        comprovanteBase64: editPagBase64 || undefined,
        isPrevisao: editPagIsPrevisao
      });
    }

    setItemParaEditar(null);
  };

  return (
    <div className="space-y-5 pb-24">
      {/* Cabeçalho */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Financeiro</h1>
          <p className="text-xs text-slate-500">Gestão de caixa e projeção orçamentária</p>
        </div>
      </div>

      {/* Tabs Principais */}
      <div className="flex bg-slate-200/80 p-1 rounded-xl gap-1">
        <button 
          onClick={() => setActiveTab('RESUMO')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
            activeTab === 'RESUMO' 
              ? 'bg-white shadow-xs text-slate-800' 
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Extrato & Saldo
        </button>
        <button 
          onClick={() => setActiveTab('NOVA_COMPRA')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'NOVA_COMPRA' 
              ? 'bg-white shadow-xs text-rose-700' 
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <TrendingDown className="w-3.5 h-3.5 text-rose-600" />
          Despesa
        </button>
        <button 
          onClick={() => setActiveTab('NOVO_PAGAMENTO')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'NOVO_PAGAMENTO' 
              ? 'bg-white shadow-xs text-emerald-700' 
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
          Receita
        </button>
      </div>

      {/* ========================================================================= */}
      {/* ABA 1: EXTRATO & SALDO                                                    */}
      {/* ========================================================================= */}
      {activeTab === 'RESUMO' && (
        <div className="space-y-4">
          
          {/* Card Resumo do Saldo Real Contabilizado */}
          <div className="bg-slate-900 text-white rounded-2xl p-4 shadow-md space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Saldo Real em Caixa
                </span>
                <div className={`text-2xl font-black tracking-tight mt-0.5 ${saldoReal >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  R$ {saldoReal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
              </div>
              <div className="p-2 text-slate-300">
                <DollarSign className="w-6 h-6" />
              </div>
            </div>

            <div className="text-center grid grid-cols-2 gap-2 pt-2 border-t border-slate-800 text-sm">
              <div className="bg-slate-800/60 p-2 rounded-xl border border-slate-700/50">
                <span className="text-[10px] text-slate-400 block font-medium">RECEITA</span>
                <span className="font-bold text-emerald-400">
                  R$ {totalRecebido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="bg-slate-800/60 p-2 rounded-xl border border-slate-700/50">
                <span className="text-[10px] text-slate-400 block font-medium">DESPESA</span>
                <span className="font-bold text-rose-400">
                  R$ {totalGasto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>

          {/* Card de Previsões & Projeção Futura */}
          {(totalPrevisoesPendentes > 0 || totalPrevisaoGasto > 0 || totalPrevisaoReceita > 0) && (
            <div className="bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border border-amber-200/80 rounded-2xl p-3.5 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-amber-100 text-amber-800 rounded-lg">
                    <CalendarClock className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-amber-950">Previsões Financeiras</h3>
                    <p className="text-[10px] text-amber-700">
                      Valores programados aguardando confirmação
                    </p>
                  </div>
                </div>
                {totalPrevisoesPendentes > 0 && (
                  <span className="bg-amber-100 text-amber-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-amber-300">
                    {totalPrevisoesPendentes}{/*  pendente{totalPrevisoesPendentes > 1 ? 's' : ''} */}
                  </span>
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

          {/* Filtros do Extrato */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs">
                <button
                  type="button"
                  onClick={() => setFiltroExtrato('TODOS')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                    filtroExtrato === 'TODOS'
                      ? 'bg-white shadow-2xs text-slate-800'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Todos ({compras.length + pagamentos.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFiltroExtrato('EFETIVADOS')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                    filtroExtrato === 'EFETIVADOS'
                      ? 'bg-white shadow-2xs text-emerald-800'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Confirmado ({comprasEfetivadas.length + pagamentosEfetivados.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFiltroExtrato('PREVISOES')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1 cursor-pointer ${
                    filtroExtrato === 'PREVISOES'
                      ? 'bg-white shadow-2xs text-amber-800'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Pendente
                  {totalPrevisoesPendentes > 0 && (
                    <span className="bg-amber-200 text-amber-900 text-[9px] px-1.5 py-0.2 rounded-full font-black">
                      {totalPrevisoesPendentes}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Filtro por Categoria de Despesa */}
            <div className="flex items-center gap-1.5 overflow-x-auto py-1 text-xs">
              {/* <span className="text-[11px] font-bold text-slate-400 pl-1">Categoria:</span> */}
              <button
                type="button"
                onClick={() => setFiltroCategoria('TODAS')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  filtroCategoria === 'TODAS'
                    ? 'bg-slate-800 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Todas
              </button>
              {CATEGORIAS_DESPESA.map(cat => {
                const info = getCategoriaInfo(cat);
                const Icone = info.Icon;
                const isSelected = filtroCategoria === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setFiltroCategoria(cat)}
                    className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                      isSelected
                        ? info.activeBtn
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <Icone className="w-4 h-4 shrink-0" />
                    {/* cat */}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Lista do Extrato */}
          <div className="space-y-2.5">
            {listaExtrato.map((item) => {
              const isCompra = item.tipoLancamento === 'COMPRA';
              const isPrevisao = !!item.isPrevisao;
              const dataFormatada = new Date(
                (isCompra ? (item as Compra).dataNecessidade : (item as PagamentoCliente).data) + 'T00:00:00'
              ).toLocaleDateString('pt-BR');

              const isDataPassadaOuHoje = (isCompra ? (item as Compra).dataNecessidade : (item as PagamentoCliente).data) <= hojeStr;
              const itensCompra = isCompra ? ((item as Compra).itens || []) : [];
              const estaExpandido = isCompra && Boolean(despesasExpandidas[item.id]);

              return (
                <div 
                  key={item.id} 
                  className={`bg-white p-3.5 rounded-2xl shadow-xs border transition-all ${
                    isPrevisao 
                      ? 'border-amber-200/90 bg-amber-50/20' 
                      : 'border-slate-100 hover:border-slate-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        isCompra 
                          ? isPrevisao ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-600'
                          : isPrevisao ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-600'
                      }`}>
                        {isCompra ? <Receipt className="w-4 h-4" /> : <Wallet className="w-4 h-4" />}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <p className="font-bold text-slate-800 text-xs truncate">
                            {isCompra 
                              ? (item as Compra).nomeMaterial 
                              : ((item as PagamentoCliente).descricao || 'Recebimento de Cliente')}
                          </p>

                          {/* Badge de Categoria para Despesa */}
                          {isCompra && (() => {
                            const cat = (item as Compra).categoria || 'Material';
                            const catInfo = getCategoriaInfo(cat);
                            const CatIcon = catInfo.Icon;
                            return (
                              <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-md border ${catInfo.badgeClass}`}>
                                <CatIcon className="w-2.5 h-2.5" />
                                {/* catInfo.label */}
                              </span>
                            );
                          })()}

                          {/* Badge de Previsão vs Contabilizado */}
                          {isPrevisao ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded-md border border-amber-200">
                              <Clock className="w-2.5 h-2.5 text-amber-700" />
                              {isCompra ? (<TrendingDown className="w-2.5 h-2.5 text-amber-700" />) : (<TrendingUp className="w-2.5 h-2.5 text-amber-700" />)}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-0.5 text-[9px] font-semibold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                              <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                              {/* Contabilizado */}
                            </span>
                          )}

                          {/* Botão de Expansão de Itens da Despesa */}
                          {isCompra && itensCompra.length > 0 && (
                            <button
                              type="button"
                              onClick={() => toggleExpandirDespesa(item.id)}
                              className="inline-flex items-center gap-1 text-[10px] font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200/70 px-1.5 py-0.5 rounded transition-colors cursor-pointer"
                            >
                              <Layers className="w-2.5 h-2.5" />
                              {itensCompra.length} {itensCompra.length === 1 ? 'item' : 'itens'}
                              {estaExpandido ? <ChevronUp className="w-2.5 h-2.5" /> : <ChevronDown className="w-2.5 h-2.5" />}
                            </button>
                          )}
                        </div>

                        <div className="flex items-center gap-2 flex-wrap text-[11px] text-slate-500 mt-1">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            {isPrevisao ? `${dataFormatada}` : dataFormatada}
                          </span>

                          {!isCompra && (
                            <span className="bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded text-[10px] font-medium">
                              {(item as PagamentoCliente).metodo}
                            </span>
                          )}

                          {isCompra && (item as Compra).tarefaId && (() => {
                            const tar = tarefas.find(t => t.id === (item as Compra).tarefaId);
                            const sub = tar?.subtarefas?.find(s => s.id === (item as Compra).subtarefaId);
                            return (
                              <span className="text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-100 px-1.5 py-0.5 rounded font-medium truncate max-w-[140px]">
                                {tar?.titulo}{sub ? ` • ${sub.titulo}` : ''}
                              </span>
                            );
                          })()}
                        </div>
                      </div>
                    </div>

                    {/* Valor e Ações Rápidas */}
                    <div className="text-right flex-shrink-0">
                      <div className={`font-black text-sm ${
                        isCompra 
                          ? isPrevisao ? 'text-amber-800' : 'text-rose-600'
                          : isPrevisao ? 'text-amber-800' : 'text-emerald-600'
                      }`}>
                        {isCompra ? '-' : '+'} R$ {(isCompra ? (item as Compra).valorTotal : (item as PagamentoCliente).valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </div>

                      <div className="flex items-center justify-end gap-1.5 mt-1.5">
                        {item.comprovanteBase64 && (
                          <button
                            type="button"
                            title="Ver Comprovante"
                            onClick={() => setVisualizarComprovante(item.comprovanteBase64!)}
                            className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          type="button"
                          title="Editar Registro"
                          onClick={() => abrirEdicao(isCompra ? 'COMPRA' : 'PAGAMENTO', item)}
                          className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors cursor-pointer"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          title="Excluir Registro"
                          onClick={() => setItemParaExcluir({
                            tipo: isCompra ? 'COMPRA' : 'PAGAMENTO',
                            id: item.id,
                            titulo: isCompra ? (item as Compra).nomeMaterial : ((item as PagamentoCliente).descricao || 'Recebimento')
                          })}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Tabela detalhada dos itens expandidos */}
                  {isCompra && estaExpandido && itensCompra.length > 0 && (
                    <div className="mt-3 pt-2.5 border-t border-slate-100 bg-slate-50/70 p-2.5 rounded-xl space-y-1.5">
                      {/* <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase tracking-wider px-1">
                        <span>Detalhamento dos Itens</span>
                        <span>Qtd × Unitário = Total</span>
                      </div> */}
                      <div className="space-y-1">
                        {itensCompra.map((it, idx) => (
                          <div key={it.id || idx} className="flex items-center justify-between text-xs bg-white p-2 rounded-lg border border-slate-200/60">
                            <div className="min-w-0 pr-2">
                              <span className="font-semibold text-slate-800 block truncate">{it.item}</span>
                              <span className="text-[10px] text-slate-400">
                                {it.quantidade} un × R$ {it.valorUnitario.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </span>
                            </div>
                            <span className="font-bold text-slate-700 whitespace-nowrap">
                              R$ {it.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Banner de Ação para Previsão Pendente */}
                  {isPrevisao && (
                    <div className="mt-3 pt-2.5 border-t border-amber-100 flex items-center justify-between gap-2">
                      <div className="text-[11px] text-amber-900 flex items-center gap-1 font-medium">
                        {isDataPassadaOuHoje ? (
                          <span className="text-rose-600 font-bold flex items-center gap-1">
                            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                            Previsto pra hoje!
                          </span>
                        ) : (
                          <span className="text-amber-700">Aguardando confirmação:</span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => abrirConfirmacao(isCompra ? 'COMPRA' : 'PAGAMENTO', item)}
                        className="inline-flex items-center gap-1.5 text-xs font-bold bg-amber-500 hover:bg-amber-600 active:scale-95 text-white px-3 py-1.5 rounded-xl shadow-xs transition-all cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Confirmar
                      </button>
                    </div>
                  )}
                </div>
              );
            })}

            {listaExtrato.length === 0 && (
              <div className="text-center py-12 bg-white rounded-2xl border border-slate-100 p-6 space-y-2">
                <CalendarClock className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-slate-500 text-xs font-medium">
                  {filtroExtrato === 'PREVISOES' 
                    ? 'Nenhuma previsão de gasto ou receita cadastrada.'
                    : 'Nenhuma movimentação financeira encontrada.'}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ABA 2: NOVA COMPRA / DESPESA                                              */}
      {/* ========================================================================= */}
      {activeTab === 'NOVA_COMPRA' && (
        <form onSubmit={handleSalvarCompra} className="space-y-4 bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-800">Registrar Despesa</h2>
            <p className="text-xs text-slate-500">
              Selecione a categoria e cadastre os itens. O total da despesa será calculado automaticamente pela soma dos itens.
            </p>
          </div>

          {/* 1. Seleção de Categoria */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">Categoria da Despesa *</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {CATEGORIAS_DESPESA.map(cat => {
                const info = getCategoriaInfo(cat);
                const Icone = info.Icon;
                const isSelected = compraCategoria === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCompraCategoria(cat)}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      isSelected
                        ? info.activeBtn
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div className={`p-1.5 rounded-lg ${isSelected ? 'bg-white/20' : 'bg-slate-200/70 text-slate-600'}`}>
                      <Icone className="w-4 h-4" />
                    </div>
                    <span>{cat}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Identificação / Título Geral da Despesa */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-slate-700">Identificação / Resumo da Despesa (Opcional)</label>
              <span className="text-[10px] text-slate-400">Se vazio, assume os itens</span>
            </div>
            <input 
              type="text" 
              value={compraMaterial} 
              onChange={e => setCompraMaterial(e.target.value)} 
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500" 
              placeholder="Ex: Reforma da Alvenaria, Almoço da Equipe, Frete de Materiais..." 
            />
          </div>

          {/* 2. Cadastro dos Itens da Despesa */}
          <div className="space-y-3 pt-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-rose-600" />
                  Itens da Despesa
                </label>
                <span className="bg-rose-100 text-rose-800 text-[10px] font-extrabold px-2 py-0.2 rounded-full">
                  {compraItens.length}
                </span>
              </div>
              <button
                type="button"
                onClick={adicionarItemCompra}
                className="inline-flex items-center gap-1 text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Adicionar
              </button>
            </div>

            <div className="space-y-3">
              {compraItens.map((itemObj, index) => {
                const vUnit = parseFloat(itemObj.valorUnitario) || 0;
                const qtd = parseFloat(itemObj.quantidade) || 0;
                const itemTotal = vUnit * qtd;

                return (
                  <div 
                    key={itemObj.id} 
                    className="p-3.5 bg-slate-50/90 border border-slate-200 rounded-xl space-y-2.5 transition-all hover:border-slate-300"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-600">Item #{index + 1}</span>
                      {compraItens.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removerItemCompra(itemObj.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Remover item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Input: item */}
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">Descrição</label>
                      <input
                        required
                        type="text"
                        value={itemObj.item}
                        onChange={e => atualizarItemCompra(itemObj.id, 'item', e.target.value)}
                        placeholder="(ex: Saco de Cimento 50kg, Uber, Container...)"
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500"
                      />
                    </div>

                    {/* Inputs: valor unitário, quantidade e total do item */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 items-end">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">Valor Unitário (R$) *</label>
                        <input
                          required
                          type="number"
                          step="0.01"
                          min="0"
                          value={itemObj.valorUnitario}
                          onChange={e => atualizarItemCompra(itemObj.id, 'valorUnitario', e.target.value)}
                          placeholder="0,00"
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500 font-semibold"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">Quantidade *</label>
                        <input
                          required
                          type="number"
                          step="any"
                          min="0.01"
                          value={itemObj.quantidade}
                          onChange={e => atualizarItemCompra(itemObj.id, 'quantidade', e.target.value)}
                          placeholder="1"
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500 font-semibold"
                        />
                      </div>

                      <div className="bg-white border border-rose-200/80 rounded-xl px-3 py-2 flex flex-col justify-center">
                        <span className="text-[10px] text-slate-500 font-medium">Total do Item</span>
                        <span className="text-xs font-black text-rose-600">
                          R$ {itemTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              type="button"
              onClick={adicionarItemCompra}
              className="w-full py-2.5 border-2 border-dashed border-slate-200 hover:border-rose-300 hover:bg-rose-50/50 text-slate-600 hover:text-rose-700 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Adicionar Outro Item
            </button>
          </div>

          {/* 3. Total Geral da Despesa (Soma de todos os itens) */}
          <div className="bg-gradient-to-r from-rose-500/10 via-rose-500/5 to-transparent border border-rose-200 rounded-2xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-rose-100 text-rose-700 rounded-xl">
                <Calculator className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-rose-950 block">
                  Total da Despesa
                </span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-lg font-black text-rose-700 block">
                R$ {totalCompraCalculado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
              <span className="text-[10px] font-bold text-slate-500">
                {compraItens.length} {compraItens.length === 1 ? 'item' : 'itens'}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Data *</label>
            <input 
              required 
              type="date" 
              value={compraData} 
              onChange={e => setCompraData(e.target.value)} 
              className={`w-full bg-slate-50 border rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:ring-2 ${
                isCompraDataFutura ? 'border-amber-400 bg-amber-50/50 text-amber-900 focus:ring-amber-500 font-bold' : 'border-slate-200 focus:ring-rose-500'
              }`} 
            />
          </div>

          {/* Banner Reativo Baseado na Data */}
          {isCompraDataFutura ? (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2.5 text-amber-900 text-xs">
              <Clock className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Data Futura Detectada ({new Date(compraData + 'T00:00:00').toLocaleDateString('pt-BR')}):</p>
                <p className="text-[11px] text-amber-800 leading-relaxed mt-0.5">
                  Esta despesa será cadastrada como <strong>Previsão de Gasto</strong>. Ela <strong>NÃO</strong> será subtraída do saldo atual em caixa até que você a confirme no extrato.
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-2.5 flex items-center gap-2 text-emerald-800 text-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>Data atual ou passada: O valor será <strong>contabilizado imediatamente</strong> no saldo da obra.</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Etapa/Tarefa</label>
            <select 
              value={compraTarefa} 
              onChange={e => {
                setCompraTarefa(e.target.value);
                setCompraSubtarefa('');
              }} 
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500"
            >
              <option value="">Nenhuma (Gasto Geral da Obra)</option>
              {tarefas.map(t => <option key={t.id} value={t.id}>{t.titulo}</option>)}
            </select>
          </div>

          {tarefaSelecionadaObj && tarefaSelecionadaObj.subtarefas && tarefaSelecionadaObj.subtarefas.length > 0 && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Vincular à Subtarefa (Opcional)</label>
              <select 
                value={compraSubtarefa} 
                onChange={e => setCompraSubtarefa(e.target.value)} 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500"
              >
                <option value="">Geral da Etapa ({tarefaSelecionadaObj.titulo})</option>
                {tarefaSelecionadaObj.subtarefas.map(st => (
                  <option key={st.id} value={st.id}>{st.titulo}</option>
                ))}
              </select>
            </div>
          )}
          
          <div className="pt-1">
            <ImageUploader onImageSelected={setCompraBase64} label="Anexar Nota Fiscal / Recibo (Opcional)" preview={compraBase64} />
          </div>

          <button 
            type="submit" 
            className={`w-full mt-4 font-bold py-3.5 rounded-xl shadow-md active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-xs text-white cursor-pointer ${
              isCompraDataFutura 
                ? 'bg-amber-600 hover:bg-amber-700' 
                : 'bg-rose-600 hover:bg-rose-700'
            }`}
          >
            {isCompraDataFutura ? <Clock className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            {isCompraDataFutura ? 'Prever Despesa' : 'Registrar Despesa'}
          </button>
        </form>
      )}

      {/* ========================================================================= */}
      {/* ABA 3: NOVO PAGAMENTO / RECEITA                                           */}
      {/* ========================================================================= */}
      {activeTab === 'NOVO_PAGAMENTO' && (
        <form onSubmit={handleSalvarPagamento} className="space-y-4 bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-800">Registrar Receita</h2>
            <p className="text-xs text-slate-500">
              Se a data for futura, o valor será gravado como <strong>Previsão de Receita</strong>.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Identificação / Descrição *</label>
            <input 
              required 
              type="text" 
              value={pagDescricao} 
              onChange={e => setPagDescricao(e.target.value)} 
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500" 
              placeholder="Ex: Entrada Inicial (30%), 2ª Parcela, Medição Etapa 1..." 
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Valor (R$) *</label>
              <input 
                required 
                type="number" 
                step="0.01" 
                min="0.01"
                value={pagValor} 
                onChange={e => setPagValor(e.target.value)} 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold" 
                placeholder="0,00" 
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Data *</label>
              <input 
                required 
                type="date" 
                value={pagData} 
                onChange={e => setPagData(e.target.value)} 
                className={`w-full bg-slate-50 border rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:ring-2 ${
                  isPagDataFutura ? 'border-amber-400 bg-amber-50/50 text-amber-900 focus:ring-amber-500 font-bold' : 'border-slate-200 focus:ring-emerald-500'
                }`} 
              />
            </div>
          </div>

          {/* Banner Reativo Baseado na Data */}
          {isPagDataFutura ? (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2.5 text-amber-900 text-xs">
              <Clock className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Data Futura Detectada ({new Date(pagData + 'T00:00:00').toLocaleDateString('pt-BR')}):</p>
                <p className="text-[11px] text-amber-800 leading-relaxed mt-0.5">
                  Esta entrada será cadastrada como <strong>Previsão de Receita</strong>. Ela <strong>NÃO</strong> será somada ao saldo atual em caixa até que o recebimento seja confirmado.
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-2.5 flex items-center gap-2 text-emerald-800 text-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>Data atual ou passada: O valor será <strong>contabilizado imediatamente</strong> no saldo da obra.</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Método de Pagamento</label>
            <select 
              value={pagMetodo} 
              onChange={e => setPagMetodo(e.target.value)} 
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="PIX">PIX</option>
              <option value="TRANSFERENCIA">Transferência Bancária (TED/DOC)</option>
              <option value="BOLETO">Boleto Bancário</option>
              <option value="DINHEIRO">Dinheiro em Espécie</option>
              <option value="CHEQUE">Cheque</option>
              <option value="CARTAO">Cartão de Crédito/Débito</option>
            </select>
          </div>
          
          <div className="pt-1">
            <ImageUploader onImageSelected={setPagBase64} label="Anexar Comprovante de Pagamento (Opcional)" preview={pagBase64} />
          </div>

          <button 
            type="submit" 
            className={`w-full mt-4 font-bold py-3.5 rounded-xl shadow-md active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-xs text-white cursor-pointer ${
              isPagDataFutura 
                ? 'bg-amber-600 hover:bg-amber-700' 
                : 'bg-emerald-600 hover:bg-emerald-700'
            }`}
          >
            {isPagDataFutura ? <Clock className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
            {isPagDataFutura ? 'Cadastrar Previsão de Receita' : 'Registrar Recebimento Contabilizado'}
          </button>
        </form>
      )}

      {/* ========================================================================= */}
      {/* MODAL DE CONFIRMAÇÃO DE PREVISÃO (EFETIVAÇÃO)                             */}
      {/* ========================================================================= */}
      {itemParaConfirmar && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl p-5 border border-slate-100 space-y-4 animate-scaleUp">
            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-xl flex-shrink-0 mt-0.5">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-sm">
                  {itemParaConfirmar.tipo === 'COMPRA' ? 'Confirmar Efetivação de Gasto' : 'Confirmar Recebimento de Receita'}
                </h3>
                <p className="text-xs text-slate-500">
                  O valor sairá da previsão e será <strong>contabilizado oficialmente</strong> no saldo da obra.
                </p>
              </div>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/70 space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Item:</span>
                <span className="font-bold text-slate-800 truncate max-w-[180px]">
                  {itemParaConfirmar.tipo === 'COMPRA'
                    ? (itemParaConfirmar.item as Compra).nomeMaterial
                    : ((itemParaConfirmar.item as PagamentoCliente).descricao || 'Recebimento')}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Valor:</span>
                <span className={`font-black text-sm ${
                  itemParaConfirmar.tipo === 'COMPRA' ? 'text-rose-600' : 'text-emerald-600'
                }`}>
                  R$ {(itemParaConfirmar.tipo === 'COMPRA' 
                    ? (itemParaConfirmar.item as Compra).valorTotal 
                    : (itemParaConfirmar.item as PagamentoCliente).valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Previsão original:</span>
                <span className="text-slate-600 font-semibold">
                  {new Date((itemParaConfirmar.tipo === 'COMPRA'
                    ? (itemParaConfirmar.item as Compra).dataNecessidade
                    : (itemParaConfirmar.item as PagamentoCliente).data) + 'T00:00:00').toLocaleDateString('pt-BR')}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Data Efetiva de Realização *</label>
              <input
                type="date"
                value={dataEfetivacao}
                onChange={e => setDataEfetivacao(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none font-bold"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setItemParaConfirmar(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={executarConfirmacao}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL DE EDIÇÃO DE RECEITA OU DESPESA                                     */}
      {/* ========================================================================= */}
      {itemParaEditar && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white w-full max-w-md max-h-[80vh] overflow-y-auto rounded-2xl shadow-2xl p-4 border border-slate-100 space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className={`p-2 rounded-xl ${itemParaEditar.tipo === 'COMPRA' ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>
                  {itemParaEditar.tipo === 'COMPRA' ? <TrendingDown className="w-5 h-5" /> : <TrendingUp className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">
                    {itemParaEditar.tipo === 'COMPRA' ? 'Editar Despesa' : 'Editar Receita'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Altere os dados cadastrados, valores ou status
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setItemParaEditar(null)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={salvarEdicao} className="space-y-3.5">
              {itemParaEditar.tipo === 'COMPRA' ? (
                <>
                  {/* Seleção de Categoria na Edição */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-2">Categoria da Despesa *</label>
                    <div className="grid grid-cols-2 gap-2">
                      {CATEGORIAS_DESPESA.map(cat => {
                        const info = getCategoriaInfo(cat);
                        const Icone = info.Icon;
                        const isSelected = editCompraCategoria === cat;
                        return (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => setEditCompraCategoria(cat)}
                            className={`flex items-center gap-2 p-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                              isSelected
                                ? info.activeBtn
                                : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            <div className={`p-1 rounded-lg ${isSelected ? 'bg-white/20' : 'bg-slate-200/70 text-slate-600'}`}>
                              <Icone className="w-3.5 h-3.5" />
                            </div>
                            <span>{cat}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Identificação / Resumo (Opcional)</label>
                    <input
                      type="text"
                      value={editCompraMaterial}
                      onChange={e => setEditCompraMaterial(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500"
                      placeholder="Ex: Reforma da Alvenaria, Almoço..."
                    />
                  </div>

                  {/* Itens da Despesa na Edição */}
                  <div className="space-y-2.5 pt-1">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-rose-600" />
                        Itens da Despesa *
                      </label>
                      <button
                        type="button"
                        onClick={adicionarItemEditCompra}
                        className="inline-flex items-center gap-1 text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-2 py-1 rounded-lg transition-colors cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                        Adicionar Item
                      </button>
                    </div>

                    <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                      {editCompraItens.map((itemObj, index) => {
                        const vUnit = parseFloat(itemObj.valorUnitario) || 0;
                        const qtd = parseFloat(itemObj.quantidade) || 0;
                        const itemTotal = vUnit * qtd;

                        return (
                          <div
                            key={itemObj.id}
                            className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-bold text-slate-500">Item #{index + 1}</span>
                              {editCompraItens.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => removerItemEditCompra(itemObj.id)}
                                  className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                  title="Remover item"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              )}
                            </div>

                            <div>
                              <input
                                required
                                type="text"
                                value={itemObj.item}
                                onChange={e => atualizarItemEditCompra(itemObj.id, 'item', e.target.value)}
                                placeholder="Nome do item"
                                className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500"
                              />
                            </div>

                            <div className="grid grid-cols-3 gap-2 items-end">
                              <div>
                                <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Unitário (R$)</label>
                                <input
                                  required
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={itemObj.valorUnitario}
                                  onChange={e => atualizarItemEditCompra(itemObj.id, 'valorUnitario', e.target.value)}
                                  placeholder="0,00"
                                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-rose-500"
                                />
                              </div>

                              <div>
                                <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Qtd</label>
                                <input
                                  required
                                  type="number"
                                  step="any"
                                  min="0.01"
                                  value={itemObj.quantidade}
                                  onChange={e => atualizarItemEditCompra(itemObj.id, 'quantidade', e.target.value)}
                                  placeholder="1"
                                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-rose-500"
                                />
                              </div>

                              <div className="bg-white border border-rose-200 rounded-lg px-2 py-1 flex flex-col justify-center">
                                <span className="text-[9px] text-slate-400 font-medium">Total Item</span>
                                <span className="text-xs font-bold text-rose-600">
                                  R$ {itemTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Total da Despesa Calculado na Edição */}
                  <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-rose-950 block">
                        Total da Despesa
                      </span>
                      <span className="text-[10px] text-rose-700">
                        Soma dos {editCompraItens.length} itens cadastrados
                      </span>
                    </div>
                    <span className="text-base font-black text-rose-700">
                      R$ {totalEditCompraCalculado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Data *</label>
                    <input
                      required
                      type="date"
                      value={editCompraData}
                      onChange={e => {
                        const novaData = e.target.value;
                        setEditCompraData(novaData);
                        if (novaData > hojeStr && !editCompraIsPrevisao) {
                          setEditCompraIsPrevisao(true);
                        }
                      }}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500"
                    />
                  </div>

                  {/* Status de Previsão vs Contabilizado */}
                  <div className={`p-3 rounded-xl border text-xs space-y-1.5 transition-colors ${
                    editCompraIsPrevisao ? 'bg-amber-50/80 border-amber-200 text-amber-900' : 'bg-slate-50 border-slate-200 text-slate-700'
                  }`}>
                    <label className="flex items-start gap-2.5 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={editCompraIsPrevisao}
                        onChange={e => setEditCompraIsPrevisao(e.target.checked)}
                        className="w-4 h-4 mt-0.5 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
                      />
                      <div>
                        <span className="font-bold flex items-center gap-1.5">
                          {editCompraIsPrevisao ? (
                            <>
                              <Clock className="w-3.5 h-3.5 text-amber-600" />
                              Classificado como Previsão de Gasto
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              Classificado como Despesa Contabilizada
                            </>
                          )}
                        </span>
                        <span className="text-[11px] opacity-80 block leading-tight mt-0.5">
                          {editCompraIsPrevisao 
                            ? 'Este valor é uma previsão futura e NÃO desconta do saldo real em caixa até ser confirmado.' 
                            : 'Este valor está efetivado e é descontado diretamente do saldo real em caixa da obra.'}
                        </span>
                      </div>
                    </label>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Vincular à Etapa/Tarefa</label>
                    <select
                      value={editCompraTarefa}
                      onChange={e => {
                        setEditCompraTarefa(e.target.value);
                        setEditCompraSubtarefa('');
                      }}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500"
                    >
                      <option value="">Nenhuma (Gasto Geral da Obra)</option>
                      {tarefas.map(t => (
                        <option key={t.id} value={t.id}>{t.titulo}</option>
                      ))}
                    </select>
                  </div>

                  {(() => {
                    const tarObj = tarefas.find(t => t.id === editCompraTarefa);
                    if (tarObj && tarObj.subtarefas && tarObj.subtarefas.length > 0) {
                      return (
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">Vincular à Subtarefa</label>
                          <select
                            value={editCompraSubtarefa}
                            onChange={e => setEditCompraSubtarefa(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500"
                          >
                            <option value="">Geral da Etapa ({tarObj.titulo})</option>
                            {tarObj.subtarefas.map(st => (
                              <option key={st.id} value={st.id}>{st.titulo}</option>
                            ))}
                          </select>
                        </div>
                      );
                    }
                    return null;
                  })()}

                  <div className="pt-1">
                    <ImageUploader 
                      onImageSelected={setEditCompraBase64} 
                      label="Comprovante / Nota Fiscal" 
                      preview={editCompraBase64} 
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Identificação / Descrição *</label>
                    <input
                      required
                      type="text"
                      value={editPagDescricao}
                      onChange={e => setEditPagDescricao(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      placeholder="Ex: 2ª Parcela, Entrada..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Valor (R$) *</label>
                      <input
                        required
                        type="number"
                        step="0.01"
                        min="0.01"
                        value={editPagValor}
                        onChange={e => setEditPagValor(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Data *</label>
                      <input
                        required
                        type="date"
                        value={editPagData}
                        onChange={e => {
                          const novaData = e.target.value;
                          setEditPagData(novaData);
                          if (novaData > hojeStr && !editPagIsPrevisao) {
                            setEditPagIsPrevisao(true);
                          }
                        }}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                  {/* Status de Previsão vs Contabilizado */}
                  <div className={`p-3 rounded-xl border text-xs space-y-1.5 transition-colors ${
                    editPagIsPrevisao ? 'bg-amber-50/80 border-amber-200 text-amber-900' : 'bg-slate-50 border-slate-200 text-slate-700'
                  }`}>
                    <label className="flex items-start gap-2.5 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={editPagIsPrevisao}
                        onChange={e => setEditPagIsPrevisao(e.target.checked)}
                        className="w-4 h-4 mt-0.5 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
                      />
                      <div>
                        <span className="font-bold flex items-center gap-1.5">
                          {editPagIsPrevisao ? (
                            <>
                              <Clock className="w-3.5 h-3.5 text-amber-600" />
                              Classificado como Previsão de Receita
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              Classificado como Receita Contabilizada
                            </>
                          )}
                        </span>
                        <span className="text-[11px] opacity-80 block leading-tight mt-0.5">
                          {editPagIsPrevisao 
                            ? 'Este valor é uma previsão futura e NÃO entra no saldo real da obra até ser confirmado.' 
                            : 'Este valor está efetivado e soma diretamente no saldo real em caixa da obra.'}
                        </span>
                      </div>
                    </label>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Método de Pagamento</label>
                    <select
                      value={editPagMetodo}
                      onChange={e => setEditPagMetodo(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="PIX">PIX</option>
                      <option value="TRANSFERENCIA">Transferência Bancária (TED/DOC)</option>
                      <option value="BOLETO">Boleto Bancário</option>
                      <option value="DINHEIRO">Dinheiro em Espécie</option>
                      <option value="CHEQUE">Cheque</option>
                      <option value="CARTAO">Cartão de Crédito/Débito</option>
                    </select>
                  </div>

                  <div className="pt-1">
                    <ImageUploader 
                      onImageSelected={setEditPagBase64} 
                      label="Comprovante de Pagamento" 
                      preview={editPagBase64} 
                    />
                  </div>
                </>
              )}

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setItemParaEditar(null)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className={`flex-1 py-2.5 text-white text-xs font-bold rounded-xl shadow-sm active:scale-95 transition-all cursor-pointer ${
                    itemParaEditar.tipo === 'COMPRA'
                      ? 'bg-rose-600 hover:bg-rose-700'
                      : 'bg-emerald-600 hover:bg-emerald-700'
                  }`}
                >
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL DE CONFIRMAÇÃO DE EXCLUSÃO                                         */}
      {/* ========================================================================= */}
      {itemParaExcluir && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl p-5 border border-slate-100 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-2 bg-rose-100 rounded-xl">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-sm">Excluir Lançamento?</h3>
                <p className="text-xs text-slate-500">Esta ação não pode ser desfeita</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
              Tem certeza que deseja excluir <strong>"{itemParaExcluir.titulo}"</strong>?
            </p>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setItemParaExcluir(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={executarExclusao}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-sm transition-colors cursor-pointer"
              >
                Sim, Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL DE VISUALIZAÇÃO DE COMPROVANTE                                      */}
      {/* ========================================================================= */}
      {visualizarComprovante && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white max-w-md w-full rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-800">Comprovante Anexado</h3>
              <button 
                type="button"
                onClick={() => setVisualizarComprovante(null)} 
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="max-h-96 overflow-auto rounded-xl border border-slate-200">
              <img src={visualizarComprovante} alt="Comprovante" className="w-full h-auto object-contain" />
            </div>
            <button
              type="button"
              onClick={() => setVisualizarComprovante(null)}
              className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
