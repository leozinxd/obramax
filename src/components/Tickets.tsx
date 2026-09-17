import React, { useState } from 'react';
import { AppState, generateId } from '../store';
import { TicketAlteracao, TicketStatus } from '../types';
import { 
  Ticket, 
  AlertCircle, 
  Check, 
  X, 
  Clock, 
  DollarSign, 
  Calendar, 
  Pencil, 
  Trash2, 
  RotateCcw,
  Plus
} from 'lucide-react';

interface TicketsProps {
  state: AppState;
  onAddTicket: (ticket: TicketAlteracao) => void;
  onUpdateTicket?: (id: string, updates: Partial<TicketAlteracao>) => void;
  onUpdateTicketStatus?: (id: string, status: TicketStatus) => void;
  onDeleteTicket?: (id: string) => void;
}

export function Tickets({ 
  state, 
  onAddTicket, 
  onUpdateTicket, 
  onUpdateTicketStatus, 
  onDeleteTicket 
}: TicketsProps) {
  const [showNovo, setShowNovo] = useState(false);
  const [filtroStatus, setFiltroStatus] = useState<string>('TODOS');
  const [ticketEmEdicao, setTicketEmEdicao] = useState<TicketAlteracao | null>(null);
  const [ticketParaExcluir, setTicketParaExcluir] = useState<TicketAlteracao | null>(null);

  const obraId = state.obraAtivaId;

  const todosTickets = [...state.ticketsAlteracao.filter(t => t.obraId === obraId)].reverse();

  // Contadores
  const countAbertos = todosTickets.filter(t => t.status === 'ABERTO').length;
  const countAceitos = todosTickets.filter(t => t.status === 'ACEITO' || (t.status as any) === 'APROVADO').length;
  const countRecusados = todosTickets.filter(t => t.status === 'RECUSADO' || (t.status as any) === 'REJEITADO').length;

  const ticketsFiltrados = todosTickets.filter(ticket => {
    if (filtroStatus === 'TODOS') return true;
    if (filtroStatus === 'ABERTO') return ticket.status === 'ABERTO';
    if (filtroStatus === 'ACEITO') return ticket.status === 'ACEITO' || (ticket.status as any) === 'APROVADO';
    if (filtroStatus === 'RECUSADO') return ticket.status === 'RECUSADO' || (ticket.status as any) === 'REJEITADO';
    return true;
  });

  // Form Novo Ticket
  const [titulo, setTitulo] = useState('');
  const [motivo, setMotivo] = useState('');
  const [impactoDias, setImpactoDias] = useState('0');
  const [custoAdicional, setCustoAdicional] = useState('0');
  const [statusNovo, setStatusNovo] = useState<TicketStatus>('ABERTO');

  const handleSalvar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!obraId || !titulo.trim()) return;

    onAddTicket({
      id: generateId(),
      obraId,
      titulo: titulo.trim(),
      motivo: motivo.trim(),
      impactoDias: parseInt(impactoDias) || 0,
      custoAdicional: parseFloat(custoAdicional) || 0,
      status: statusNovo
    });

    setShowNovo(false);
    setTitulo(''); 
    setMotivo(''); 
    setImpactoDias('0'); 
    setCustoAdicional('0');
    setStatusNovo('ABERTO');
  };

  const handleSalvarEdicao = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketEmEdicao || !onUpdateTicket) return;

    onUpdateTicket(ticketEmEdicao.id, {
      titulo: ticketEmEdicao.titulo.trim(),
      motivo: ticketEmEdicao.motivo.trim(),
      impactoDias: ticketEmEdicao.impactoDias || 0,
      custoAdicional: ticketEmEdicao.custoAdicional || 0,
      status: ticketEmEdicao.status
    });

    setTicketEmEdicao(null);
  };

  const handleMudarStatus = (id: string, novoStatus: TicketStatus) => {
    if (onUpdateTicketStatus) {
      onUpdateTicketStatus(id, novoStatus);
    } else if (onUpdateTicket) {
      onUpdateTicket(id, { status: novoStatus });
    }
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'ABERTO':
        return {
          label: 'Aberto',
          classes: 'bg-amber-100 text-amber-800 border-amber-300'
        };
      case 'ACEITO':
      case 'APROVADO':
        return {
          label: 'Aceito',
          classes: 'bg-emerald-100 text-emerald-800 border-emerald-300'
        };
      case 'RECUSADO':
      case 'REJEITADO':
        return {
          label: 'Recusado',
          classes: 'bg-rose-100 text-rose-800 border-rose-300'
        };
      default:
        return {
          label: status,
          classes: 'bg-slate-100 text-slate-700 border-slate-300'
        };
    }
  };

  return (
    <div className="space-y-5 pb-24">
      {/* Cabeçalho */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Solicitações</h1>
          <p className="text-sm text-slate-500">Mudança no projeto</p>
        </div>
        <button 
          onClick={() => setShowNovo(!showNovo)}
          className="shrink-0 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-3.5 py-2 rounded-xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
        >
          {showNovo ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showNovo ? 'Cancelar' : 'Abrir Chamado'}
        </button>
      </div>

      {/* Resumo de Status / Filtros */}
      <div className="grid grid-cols-4 gap-1.5 bg-slate-200/70 p-1 rounded-xl text-xs font-semibold">
        <button
          type="button"
          onClick={() => setFiltroStatus('TODOS')}
          className={`py-1.5 px-2 rounded-lg text-center transition-all ${
            filtroStatus === 'TODOS'
              ? 'bg-white text-slate-800 shadow-xs font-bold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <span>Todos</span>
          <span className="ml-1 text-[10px] text-slate-400">({todosTickets.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setFiltroStatus('ABERTO')}
          className={`py-1.5 px-2 rounded-lg text-center transition-all ${
            filtroStatus === 'ABERTO'
              ? 'bg-amber-500 text-white shadow-xs font-bold'
              : 'text-amber-800 hover:bg-amber-100/50'
          }`}
        >
          <span>Aberto</span>
          <span className={`ml-1 text-[10px] ${filtroStatus === 'ABERTO' ? 'text-amber-100' : 'text-amber-600'}`}>
            ({countAbertos})
          </span>
        </button>

        <button
          type="button"
          onClick={() => setFiltroStatus('ACEITO')}
          className={`py-1.5 px-2 rounded-lg text-center transition-all ${
            filtroStatus === 'ACEITO'
              ? 'bg-emerald-600 text-white shadow-xs font-bold'
              : 'text-emerald-800 hover:bg-emerald-100/50'
          }`}
        >
          <span>Aceito</span>
          <span className={`ml-1 text-[10px] ${filtroStatus === 'ACEITO' ? 'text-emerald-100' : 'text-emerald-600'}`}>
            ({countAceitos})
          </span>
        </button>

        <button
          type="button"
          onClick={() => setFiltroStatus('RECUSADO')}
          className={`py-1.5 px-2 rounded-lg text-center transition-all ${
            filtroStatus === 'RECUSADO'
              ? 'bg-rose-600 text-white shadow-xs font-bold'
              : 'text-rose-800 hover:bg-rose-100/50'
          }`}
        >
          <span>Recusado</span>
          <span className={`ml-1 text-[10px] ${filtroStatus === 'RECUSADO' ? 'text-rose-100' : 'text-rose-600'}`}>
            ({countRecusados})
          </span>
        </button>
      </div>

      {/* Formulário Novo Ticket */}
      {showNovo && (
        <form onSubmit={handleSalvar} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 space-y-4 animate-in fade-in duration-150">
          <div className="bg-amber-50 p-3 rounded-xl border border-amber-200/80 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800 font-medium">
              Abra um ticket para alterações que impactam o custo adicional ou o prazo original da obra. O status inicial é <strong>Aberto</strong>.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Título da Alteração *</label>
            <input 
              required 
              type="text" 
              value={titulo} 
              onChange={e => setTitulo(e.target.value)} 
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500" 
              placeholder="Ex: Mudança de revestimento da fachada" 
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Motivo / Justificativa *</label>
            <textarea 
              required 
              value={motivo} 
              onChange={e => setMotivo(e.target.value)} 
              rows={3} 
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500" 
              placeholder="Ex: Cliente solicitou alteração do padrão de acabamento..."
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                Impacto (Dias)
              </label>
              <input 
                required 
                type="number" 
                min="0" 
                value={impactoDias} 
                onChange={e => setImpactoDias(e.target.value)} 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500" 
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-slate-500" />
                Custo Adicional (R$)
              </label>
              <input 
                required 
                type="number" 
                step="0.01" 
                min="0" 
                value={custoAdicional} 
                onChange={e => setCustoAdicional(e.target.value)} 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500" 
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Status Inicial</label>
            <select
              value={statusNovo}
              onChange={e => setStatusNovo(e.target.value as TicketStatus)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ABERTO">Aberto (Pendente de aprovação)</option>
              <option value="ACEITO">Aceito (Aprovado)</option>
              <option value="RECUSADO">Recusado (Indeferido)</option>
            </select>
          </div>

          <div className="flex gap-2 pt-2">
            <button 
              type="button" 
              onClick={() => setShowNovo(false)} 
              className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md transition-colors cursor-pointer"
            >
              Registrar Ticket
            </button>
          </div>
        </form>
      )}

      {/* Lista de Tickets */}
      <div className="space-y-3">
        {ticketsFiltrados.map(ticket => {
          const badge = getStatusBadge(ticket.status);
          const isAberto = ticket.status === 'ABERTO';
          const isAceito = ticket.status === 'ACEITO' || (ticket.status as any) === 'APROVADO';
          const isRecusado = ticket.status === 'RECUSADO' || (ticket.status as any) === 'REJEITADO';

          return (
            <div 
              key={ticket.id} 
              className="bg-white p-4 rounded-2xl shadow-xs border border-slate-100 hover:border-slate-200 transition-all space-y-3"
            >
              {/* Topo do Card */}
              <div className="flex justify-between items-start gap-2">
                <div className="min-w-0 flex-1">
                  <h3 className="font-bold text-sm text-slate-800 leading-snug">{ticket.titulo}</h3>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${badge.classes}`}>
                    {badge.label}
                  </span>
                  
                  {/* Botão de Edição */}
                  <button
                    type="button"
                    onClick={() => setTicketEmEdicao(ticket)}
                    className="p-1 text-slate-400 hover:text-indigo-600 transition-colors cursor-pointer"
                    title="Editar ticket"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>

                  {/* Botão de Exclusão */}
                  {onDeleteTicket && (
                    <button
                      type="button"
                      onClick={() => setTicketParaExcluir(ticket)}
                      className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                      title="Excluir ticket"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Motivo */}
              <p className="text-xs text-slate-600 leading-relaxed bg-slate-50/60 p-2.5 rounded-xl border border-slate-100">
                {ticket.motivo}
              </p>
              
              {/* Métricas de Impacto */}
              <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-xs">
                <div>
                  <span className="block text-[10px] text-slate-400 uppercase font-semibold">Prazo Adicional</span>
                  <span className="font-bold text-slate-700 flex items-center gap-1 mt-0.5">
                    <Clock className="w-3.5 h-3.5 text-indigo-500" />
                    +{ticket.impactoDias} {ticket.impactoDias === 1 ? 'dia' : 'dias'}
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] text-slate-400 uppercase font-semibold">Custo Extra</span>
                  <span className="font-bold text-rose-600 flex items-center gap-1 mt-0.5">
                    <DollarSign className="w-3.5 h-3.5 text-rose-500" />
                    + R$ {ticket.custoAdicional.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Ações de Transição de Status */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap">
                <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                  Mudar Status:
                </span>

                <div className="flex items-center gap-1.5">
                  {isAberto && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleMudarStatus(ticket.id, 'ACEITO')}
                        className="bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-[11px] px-2.5 py-1 rounded-lg flex items-center gap-1 transition-all cursor-pointer shadow-2xs"
                        title="Aceitar alteração"
                      >
                        <Check className="w-3 h-3 stroke-[2.5]" />
                        Aceitar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMudarStatus(ticket.id, 'RECUSADO')}
                        className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 active:scale-95 font-bold text-[11px] px-2.5 py-1 rounded-lg flex items-center gap-1 transition-all cursor-pointer"
                        title="Recusar alteração"
                      >
                        <X className="w-3 h-3 stroke-[2.5]" />
                        Recusar
                      </button>
                    </>
                  )}

                  {isAceito && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleMudarStatus(ticket.id, 'ABERTO')}
                        className="bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-semibold text-[11px] px-2 py-1 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                        title="Reabrir chamado"
                      >
                        <RotateCcw className="w-3 h-3" />
                        Reabrir
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMudarStatus(ticket.id, 'RECUSADO')}
                        className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-semibold text-[11px] px-2 py-1 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                        title="Recusar alteração"
                      >
                        <X className="w-3 h-3" />
                        Recusar
                      </button>
                    </>
                  )}

                  {isRecusado && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleMudarStatus(ticket.id, 'ABERTO')}
                        className="bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-semibold text-[11px] px-2 py-1 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                        title="Reabrir chamado"
                      >
                        <RotateCcw className="w-3 h-3" />
                        Reabrir
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMudarStatus(ticket.id, 'ACEITO')}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] px-2.5 py-1 rounded-lg flex items-center gap-1 transition-all cursor-pointer shadow-2xs"
                        title="Aceitar alteração"
                      >
                        <Check className="w-3 h-3 stroke-[2.5]" />
                        Aceitar
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        
        {ticketsFiltrados.length === 0 && !showNovo && (
          <div className="text-center py-12 bg-white rounded-2xl border border-slate-100 p-6">
            <Ticket className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-slate-500 font-medium text-sm">
              {filtroStatus === 'TODOS' 
                ? 'Nenhum ticket de alteração registrado.' 
                : `Nenhum ticket com status "${filtroStatus === 'ABERTO' ? 'Aberto' : filtroStatus === 'ACEITO' ? 'Aceito' : 'Recusado'}".`}
            </p>
            {todosTickets.length === 0 && (
              <button 
                onClick={() => setShowNovo(true)} 
                className="mt-3 text-indigo-600 font-semibold text-xs hover:underline"
              >
                Abrir o primeiro chamado
              </button>
            )}
          </div>
        )}
      </div>

      {/* Modal de Edição de Ticket */}
      {ticketEmEdicao && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col">
            <div className="p-4 bg-slate-900 text-white flex justify-between items-center">
              <h3 className="font-bold text-base flex items-center gap-2">
                <Pencil className="w-4 h-4 text-indigo-400" />
                Editar Ticket de Alteração
              </h3>
              <button 
                type="button" 
                onClick={() => setTicketEmEdicao(null)} 
                className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSalvarEdicao} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Título da Alteração *</label>
                <input 
                  required 
                  type="text" 
                  value={ticketEmEdicao.titulo} 
                  onChange={e => setTicketEmEdicao({ ...ticketEmEdicao, titulo: e.target.value })} 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500" 
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Motivo / Justificativa *</label>
                <textarea 
                  required 
                  value={ticketEmEdicao.motivo} 
                  onChange={e => setTicketEmEdicao({ ...ticketEmEdicao, motivo: e.target.value })} 
                  rows={3} 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500" 
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Impacto (Dias)</label>
                  <input 
                    required 
                    type="number" 
                    min="0" 
                    value={ticketEmEdicao.impactoDias} 
                    onChange={e => setTicketEmEdicao({ ...ticketEmEdicao, impactoDias: parseInt(e.target.value) || 0 })} 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Custo Adicional (R$)</label>
                  <input 
                    required 
                    type="number" 
                    step="0.01" 
                    min="0" 
                    value={ticketEmEdicao.custoAdicional} 
                    onChange={e => setTicketEmEdicao({ ...ticketEmEdicao, custoAdicional: parseFloat(e.target.value) || 0 })} 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500" 
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Status do Ticket</label>
                <select
                  value={ticketEmEdicao.status}
                  onChange={e => setTicketEmEdicao({ ...ticketEmEdicao, status: e.target.value as TicketStatus })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold"
                >
                  <option value="ABERTO">Aberto</option>
                  <option value="ACEITO">Aceito</option>
                  <option value="RECUSADO">Recusado</option>
                </select>
              </div>

              <div className="flex gap-2 pt-2 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => setTicketEmEdicao(null)} 
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md transition-colors cursor-pointer"
                >
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Exclusão de Ticket */}
      {ticketParaExcluir && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl p-5 border border-slate-100 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-2 bg-rose-100 rounded-xl">
                <Trash2 className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-slate-900">Excluir Ticket?</h3>
            </div>
            
            <p className="text-xs text-slate-600">
              Tem certeza que deseja excluir o ticket <strong>"{ticketParaExcluir.titulo}"</strong>? Esta ação não pode ser desfeita.
            </p>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setTicketParaExcluir(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onDeleteTicket) onDeleteTicket(ticketParaExcluir.id);
                  setTicketParaExcluir(null);
                }}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-md transition-colors cursor-pointer"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
