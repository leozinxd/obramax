import React, { useState } from 'react';
import { useStore } from './store';
import { LayoutDashboard, Wallet, CalendarDays, BookOpen, Ticket } from 'lucide-react';

import { Dashboard } from './components/Dashboard';
import { Financeiro } from './components/Financeiro';
import { Cronograma } from './components/Cronograma';
import { DiarioObra } from './components/DiarioObra';
import { Tickets } from './components/Tickets';

type Tab = 'DASHBOARD' | 'FINANCEIRO' | 'CRONOGRAMA' | 'DIARIO' | 'TICKETS';

export default function App() {
  const { 
    state, 
    addCompra, 
    updateCompra,
    confirmarCompra,
    deleteCompra,
    addPagamento, 
    updatePagamento,
    confirmarPagamento,
    deletePagamento,
    addTarefa, 
    updateTarefa, 
    deleteTarefa, 
    addDiario, 
    addDiarioComChecks, 
    updateDiario, 
    confirmarRdo,
    deleteDiario, 
    addTicket,
    updateTicket,
    updateTicketStatus,
    deleteTicket 
  } = useStore();
  const [activeTab, setActiveTab] = useState<Tab>('DASHBOARD');
  const [filtroCategoriaCronograma, setFiltroCategoriaCronograma] = useState<string>('TODAS');

  const navItems = [
    { id: 'DASHBOARD', icon: LayoutDashboard, label: 'Início' },
    { id: 'FINANCEIRO', icon: Wallet, label: 'Caixa' },
    { id: 'CRONOGRAMA', icon: CalendarDays, label: 'Obras' },
    { id: 'DIARIO', icon: BookOpen, label: 'RDO' },
    { id: 'TICKETS', icon: Ticket, label: 'Tickets' },
  ] as const;

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* Mobile-first main content container */}
      <main className="max-w-md mx-auto min-h-screen bg-slate-50 shadow-2xl relative overflow-hidden">

        {/* Scrollable Content Area */}
        <div className="p-4 h-[calc(100vh)-50px] overflow-y-auto custom-scrollbar">
          {activeTab === 'DASHBOARD' && (
            <Dashboard 
              state={state} 
              onNavigateFinanceiro={() => setActiveTab('FINANCEIRO')} 
              onNavigateCronograma={(catId?: string) => {
                if (catId) setFiltroCategoriaCronograma(catId);
                setActiveTab('CRONOGRAMA');
              }}
              onNavigateDiario={() => setActiveTab('DIARIO')}
              onConfirmarRdo={confirmarRdo}
              onUpdateDiario={updateDiario}
            />
          )}
          {activeTab === 'FINANCEIRO' && (
            <Financeiro 
              state={state} 
              onAddCompra={addCompra} 
              onUpdateCompra={updateCompra}
              onConfirmarCompra={confirmarCompra}
              onDeleteCompra={deleteCompra}
              onAddPagamento={addPagamento} 
              onUpdatePagamento={updatePagamento}
              onConfirmarPagamento={confirmarPagamento}
              onDeletePagamento={deletePagamento}
            />
          )}
          {activeTab === 'CRONOGRAMA' && (
            <Cronograma 
              state={state} 
              filtroInicial={filtroCategoriaCronograma}
              onAddTarefa={addTarefa} 
              onUpdateTarefa={updateTarefa} 
              onDeleteTarefa={deleteTarefa} 
            />
          )}
          {activeTab === 'DIARIO' && (
            <DiarioObra 
              state={state} 
              onAddDiario={addDiario} 
              onAddDiarioComChecks={addDiarioComChecks} 
              onUpdateDiario={updateDiario}
              onConfirmarRdo={confirmarRdo}
              onDeleteDiario={deleteDiario}
            />
          )}
          {activeTab === 'TICKETS' && (
            <Tickets 
              state={state} 
              onAddTicket={addTicket}
              onUpdateTicket={updateTicket}
              onUpdateTicketStatus={updateTicketStatus}
              onDeleteTicket={deleteTicket}
            />
          )}
        </div>

        {/* Bottom Navigation - SEMPRE VISÍVEL */}
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-2 py-3 pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-50">
          <div className="flex justify-between items-center max-w-md mx-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex flex-col items-center justify-center w-full space-y-1 transition-colors ${
                    isActive
                      ? 'text-indigo-600'
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  <div
                    className={`p-1.5 rounded-xl ${
                      isActive ? 'bg-indigo-50' : 'bg-transparent'
                    }`}
                  >
                    <Icon
                      className="w-6 h-6"
                      strokeWidth={isActive ? 2.5 : 2}
                    />
                  </div>

                  <span
                    className={`text-[10px] font-semibold ${
                      isActive ? 'text-indigo-700' : ''
                    }`}
                  >
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        </nav>
      </main>
    </div>
  );
}
