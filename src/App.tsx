import React, { useEffect, useState } from 'react';
import { useStore } from './store';
import { AuthScreen } from './components/AuthScreen';
import { supabase } from './supabase';
import { Session } from '@supabase/supabase-js';
import { LayoutDashboard, Wallet, CalendarDays, BookOpen, Ticket } from 'lucide-react';

import { Dashboard } from './components/Dashboard';
import { Financeiro } from './components/Financeiro';
import { Cronograma } from './components/Cronograma';
import { DiarioObra } from './components/DiarioObra';
import { Tickets } from './components/Tickets';
import { TelaInicialObras } from './components/TelaInicialObras';
import { Tarefa } from './types';

type Tab = 'DASHBOARD' | 'FINANCEIRO' | 'CRONOGRAMA' | 'DIARIO' | 'TICKETS';

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [isCheckingSession, setIsCheckingSession] = useState(Boolean(supabase));

  useEffect(() => {
    if (!supabase) {
      setIsCheckingSession(false);
      return;
    }

    let isCurrent = true;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setIsCheckingSession(false);
    });
    void supabase.auth.getSession()
      .then(({ data, error }) => {
        if (error) throw error;
        if (!isCurrent) return;
        setSession(data.session);
        setIsCheckingSession(false);
      })
      .catch(error => {
        if (!isCurrent) return;
        console.error('Falha ao recuperar sessão Supabase:', error);
        setIsCheckingSession(false);
      });

    return () => {
      isCurrent = false;
      subscription.unsubscribe();
    };
  }, []);

  if (!supabase) return <AuthScreen />;
  if (isCheckingSession) {
    return <main className="grid min-h-screen place-items-center bg-slate-100 text-sm text-slate-600">Conectando...</main>;
  }
  if (!session) return <AuthScreen />;

  return <AppContent session={session} onSignOut={() => supabase.auth.signOut()} />;
}

function AppContent({ session, onSignOut }: { session: Session; onSignOut: () => Promise<unknown> }) {
  const { 
    state, 
    setObraAtiva,
    addObra,
    updateObra,
    deleteObra,
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
    deleteTicket,
    isLoading,
    isReady,
    storageError
  } = useStore(session.user.id);
  const [activeTab, setActiveTab] = useState<Tab>('DASHBOARD');
  const [filtroCategoriaCronograma, setFiltroCategoriaCronograma] = useState<string>('TODAS');

  if (isLoading) {
    return <main className="grid min-h-screen place-items-center bg-slate-100 text-sm text-slate-600">Carregando seus dados...</main>;
  }
  if (!isReady) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-100 px-5 text-slate-900">
        <section className="max-w-md rounded-lg bg-white p-6 shadow-sm">
          <h1 className="text-lg font-bold">Não foi possível carregar os dados</h1>
          <p className="mt-2 break-words text-sm text-red-700">{storageError || 'Verifique a conexão com o Supabase e tente novamente.'}</p>
          <div className="mt-5 flex gap-3">
            <button className="rounded bg-indigo-700 px-4 py-2 text-sm font-semibold text-white" onClick={() => window.location.reload()}>Tentar novamente</button>
            <button className="rounded border border-slate-300 px-4 py-2 text-sm font-semibold" onClick={() => void onSignOut()}>Sair</button>
          </div>
        </section>
      </main>
    );
  }

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

        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-2 text-xs">
          <span className="max-w-[72%] truncate text-slate-500">{session.user.email}</span>
          <button className="font-semibold text-slate-600 hover:text-indigo-700" onClick={() => void onSignOut()}>Sair</button>
        </header>
        {storageError && (
          <p className="bg-red-50 px-4 py-2 text-xs text-red-800" role="alert">
            Falha ao sincronizar com a nuvem: {storageError}
          </p>
        )}

        {/* Scrollable Content Area */}
        <div className="p-4 h-[calc(100vh)-50px] overflow-y-auto custom-scrollbar">
          {!state.obraAtivaId ? (
            <TelaInicialObras
              state={state}
              onSelecionarObra={(id) => {
                setObraAtiva(id);
                setActiveTab('DASHBOARD');
              }}
              onAddObra={addObra}
              onUpdateObra={updateObra}
              onDeleteObra={deleteObra}
              onAdicionarTarefasIniciais={(tarefas) => {
                tarefas.forEach(t => addTarefa(t));
              }}
            />
          ) : (
            <>
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
                  onVoltarParaTelaInicial={() => {
                    setObraAtiva(null);
                    setActiveTab('DASHBOARD');
                  }}
                  onSelecionarObra={(id) => setObraAtiva(id)}
                  onAbrirNovaObra={() => {
                    setObraAtiva(null);
                    setActiveTab('DASHBOARD');
                  }}
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
            </>
          )}
        </div>

        {/* Bottom Navigation - SEMPRE VISÍVEL */}
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-2 py-3 pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-50">
          <div className="flex justify-between items-center max-w-md mx-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const semObra = !state.obraAtivaId;
              const isItemDesabilitado = semObra && item.id !== 'DASHBOARD';
              const isActive = semObra ? item.id === 'DASHBOARD' : activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    if (isItemDesabilitado) return;
                    setActiveTab(item.id);
                  }}
                  disabled={isItemDesabilitado}
                  className={`flex flex-col items-center justify-center w-full space-y-1 transition-colors ${
                    isItemDesabilitado 
                      ? 'opacity-30 cursor-not-allowed text-slate-400'
                      : isActive
                        ? 'text-indigo-600'
                        : 'text-slate-400 hover:text-slate-600'
                  }`}
                  title={isItemDesabilitado ? 'Selecione uma obra primeiro' : undefined}
                >
                  <div
                    className={`p-1.5 rounded-xl ${
                      isActive && !isItemDesabilitado ? 'bg-indigo-50' : 'bg-transparent'
                    }`}
                  >
                    <Icon
                      className="w-6 h-6"
                      strokeWidth={isActive ? 2.5 : 2}
                    />
                  </div>

                  <span
                    className={`text-[10px] font-semibold ${
                      isActive && !isItemDesabilitado ? 'text-indigo-700' : ''
                    }`}
                  >
                    {semObra && item.id === 'DASHBOARD' ? 'Obras' : item.label}
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
