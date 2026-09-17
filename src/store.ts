import { useState, useEffect, useCallback } from 'react';
import { AppState, Obra, Tarefa, Compra, PagamentoCliente, DiarioObra, TicketAlteracao, TicketStatus, ItemChecadoDiario } from './types';

export type { AppState };

const STORAGE_KEY = 'gestao_obras_state';

const defaultState: AppState = {
  obras: [],
  tarefas: [],
  compras: [],
  pagamentosCliente: [],
  diarioObra: [],
  ticketsAlteracao: [],
  obraAtivaId: null,
};

// Dados de exemplo para inicializar se estiver vazio
const hojeStr = new Date().toISOString().split('T')[0];
const ontemStr = new Date(Date.now() - 1 * 86400000).toISOString().split('T')[0];
const anteontemStr = new Date(Date.now() - 3 * 86400000).toISOString().split('T')[0];
const em15DiasStr = new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0];
const em1DiaStr = new Date(Date.now() + 1 * 86400000).toISOString().split('T')[0];
const em21DiasStr = new Date(Date.now() + 21 * 86400000).toISOString().split('T')[0];

const initialMockState: AppState = {
  obras: [
    {
      id: 'obra-1',
      nome: 'Residência Silva',
      orcamentoPrevisto: 150000,
      dataInicio: anteontemStr,
      status: 'EM_ANDAMENTO',
    }
  ],
  tarefas: [
    {
      id: 'tar-0',
      obraId: 'obra-1',
      titulo: 'Sondagem do Solo e Topografia',
      dataInicioPrevista: anteontemStr,
      dataFimPrevista: ontemStr,
      duracaoDias: 2,
      status: 'ATRASADA',
      iniciada: true,
      dataInicioReal: anteontemStr,
      fotosExecucao: [],
      subtarefas: [
        {
          id: 'sub-0a',
          titulo: 'Levantamento topográfico planialtimétrico',
          dataInicioPrevista: anteontemStr,
          dataFimPrevista: ontemStr,
          duracaoDias: 2,
          iniciada: true,
          dataInicioReal: anteontemStr,
          concluida: false
        }
      ]
    },
    {
      id: 'tar-1',
      obraId: 'obra-1',
      titulo: 'Fundação e Baldrame',
      dataInicioPrevista: anteontemStr,
      dataFimPrevista: em15DiasStr,
      duracaoDias: 16,
      status: 'PENDENTE',
      iniciada: true,
      dataInicioReal: anteontemStr,
      fotosExecucao: [],
      subtarefas: [
        { 
          id: 'sub-1', 
          titulo: 'Escavação das sapatas', 
          dataInicioPrevista: anteontemStr,
          dataFimPrevista: new Date(Date.now() + 4 * 86400000).toISOString().split('T')[0],
          duracaoDias: 5,
          iniciada: true,
          dataInicioReal: anteontemStr,
          concluida: true, 
          dataConclusao: hojeStr 
        },
        { 
          id: 'sub-2', 
          titulo: 'Armação de aço e formas', 
          dataInicioPrevista: new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0],
          dataFimPrevista: new Date(Date.now() + 10 * 86400000).toISOString().split('T')[0],
          duracaoDias: 6,
          iniciada: false,
          concluida: false 
        },
        { 
          id: 'sub-3', 
          titulo: 'Concretagem usinada', 
          dataInicioPrevista: new Date(Date.now() + 11 * 86400000).toISOString().split('T')[0],
          dataFimPrevista: em15DiasStr,
          duracaoDias: 5,
          iniciada: false,
          concluida: false 
        }
      ]
    },
    {
      id: 'tar-3',
      obraId: 'obra-1',
      titulo: 'Instalações Provisórias e Canteiro',
      dataInicioPrevista: anteontemStr,
      dataFimPrevista: hojeStr,
      duracaoDias: 3,
      status: 'PENDENTE',
      iniciada: true,
      dataInicioReal: anteontemStr,
      fotosExecucao: [],
      subtarefas: [
        {
          id: 'sub-3a',
          titulo: 'Ligação de água e energia provisória',
          dataInicioPrevista: anteontemStr,
          dataFimPrevista: hojeStr,
          duracaoDias: 3,
          iniciada: true,
          dataInicioReal: anteontemStr,
          concluida: false
        }
      ]
    },
    {
      id: 'tar-4',
      obraId: 'obra-1',
      titulo: 'Mobilização de Máquinas e Terraplanagem',
      dataInicioPrevista: hojeStr,
      dataFimPrevista: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
      duracaoDias: 4,
      status: 'PENDENTE',
      iniciada: false,
      fotosExecucao: [],
      subtarefas: [
        {
          id: 'sub-4a',
          titulo: 'Chegada da retroescavadeira na obra',
          dataInicioPrevista: hojeStr,
          dataFimPrevista: hojeStr,
          duracaoDias: 1,
          iniciada: false,
          concluida: false
        }
      ]
    },
    {
      id: 'tar-2',
      obraId: 'obra-1',
      titulo: 'Alvenaria Estrutural',
      dataInicioPrevista: em1DiaStr,
      dataFimPrevista: em21DiasStr,
      duracaoDias: 21,
      status: 'PENDENTE',
      iniciada: false,
      fotosExecucao: [],
      subtarefas: [
        { 
          id: 'sub-4', 
          titulo: 'Marcação de primeiras fiadas', 
          dataInicioPrevista: em1DiaStr,
          dataFimPrevista: new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0],
          duracaoDias: 5,
          iniciada: false,
          concluida: false 
        },
        { 
          id: 'sub-5', 
          titulo: 'Assentamento de blocos e grauteamento', 
          dataInicioPrevista: new Date(Date.now() + 6 * 86400000).toISOString().split('T')[0],
          dataFimPrevista: em21DiasStr,
          duracaoDias: 16,
          iniciada: false,
          concluida: false 
        }
      ]
    }
  ],
  compras: [
    {
      id: 'comp-1',
      obraId: 'obra-1',
      tarefaId: 'tar-1',
      subtarefaId: 'sub-1',
      categoria: 'Serviço',
      nomeMaterial: 'Locação de Mini-Escavadeira',
      itens: [
        {
          id: 'it-1',
          item: 'Diária Mini-Escavadeira c/ Operador',
          valorUnitario: 1800,
          quantidade: 1,
          valorTotal: 1800
        }
      ],
      valorTotal: 1800,
      dataNecessidade: new Date().toISOString().split('T')[0],
      statusCompra: 'COMPRADO',
      isPrevisao: false
    },
    {
      id: 'comp-2',
      obraId: 'obra-1',
      tarefaId: 'tar-1',
      subtarefaId: 'sub-2',
      categoria: 'Material',
      nomeMaterial: 'Aço CA-50 10mm e 8mm (500kg)',
      itens: [
        {
          id: 'it-2a',
          item: 'Barra de Aço CA-50 10mm',
          valorUnitario: 45,
          quantidade: 50,
          valorTotal: 2250
        },
        {
          id: 'it-2b',
          item: 'Barra de Aço CA-50 8mm',
          valorUnitario: 30,
          quantidade: 40,
          valorTotal: 1200
        }
      ],
      valorTotal: 3450,
      dataNecessidade: new Date().toISOString().split('T')[0],
      statusCompra: 'COMPRADO',
      isPrevisao: false
    },
    {
      id: 'comp-3',
      obraId: 'obra-1',
      tarefaId: 'tar-1',
      subtarefaId: 'sub-3',
      categoria: 'Material',
      nomeMaterial: 'Concreto Usinado FCK 25 (8m³)',
      itens: [
        {
          id: 'it-3',
          item: 'Concreto Usinado FCK 25 (m³)',
          valorUnitario: 400,
          quantidade: 8,
          valorTotal: 3200
        }
      ],
      valorTotal: 3200,
      dataNecessidade: new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0],
      statusCompra: 'PENDENTE',
      isPrevisao: true
    },
    {
      id: 'comp-4',
      obraId: 'obra-1',
      tarefaId: 'tar-2',
      subtarefaId: 'sub-4',
      categoria: 'Material',
      nomeMaterial: 'Blocos de Concreto Estruturais (2.000 un)',
      itens: [
        {
          id: 'it-4',
          item: 'Bloco de Concreto Estrutural 14x19x39',
          valorUnitario: 2.4,
          quantidade: 2000,
          valorTotal: 4800
        }
      ],
      valorTotal: 4800,
      dataNecessidade: new Date(Date.now() + 10 * 86400000).toISOString().split('T')[0],
      statusCompra: 'PENDENTE',
      isPrevisao: true
    },
    {
      id: 'comp-5',
      obraId: 'obra-1',
      categoria: 'Transporte',
      nomeMaterial: 'Locação de Andaimes e Caçamba de Entulho',
      itens: [
        {
          id: 'it-5a',
          item: 'Caçamba de Entulho 5m³',
          valorUnitario: 350,
          quantidade: 1,
          valorTotal: 350
        },
        {
          id: 'it-5b',
          item: 'Frete e Locação Andaimes (semana)',
          valorUnitario: 600,
          quantidade: 1,
          valorTotal: 600
        }
      ],
      valorTotal: 950,
      dataNecessidade: new Date().toISOString().split('T')[0],
      statusCompra: 'COMPRADO',
      isPrevisao: false
    }
  ],
  pagamentosCliente: [
    {
      id: 'pag-1',
      obraId: 'obra-1',
      valor: 35000,
      data: new Date().toISOString().split('T')[0],
      metodo: 'PIX',
      descricao: 'Entrada Inicial (30%)',
      isPrevisao: false
    },
    {
      id: 'pag-2',
      obraId: 'obra-1',
      valor: 25000,
      data: new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
      metodo: 'TRANSFERENCIA',
      descricao: '2ª Parcela (Fundação e Alvenaria)',
      isPrevisao: true
    }
  ],
  diarioObra: [],
  ticketsAlteracao: [],
  obraAtivaId: 'obra-1'
};

export function sincronizarRdoAutomaticoComTarefas(
  diarioObra: DiarioObra[],
  tarefas: Tarefa[],
  obraId: string,
  dataAlvo?: string
): DiarioObra[] {
  if (!obraId) return diarioObra;
  const hojeAlvo = dataAlvo || new Date().toISOString().split('T')[0];
  const tarefasDaObra = tarefas.filter(t => t.obraId === obraId);

  // Encontra todas as tarefas e subtarefas checadas nesta data
  const itensChecados: ItemChecadoDiario[] = [];
  const fotosColetadas: string[] = [];

  tarefasDaObra.forEach(t => {
    const subs = t.subtarefas || [];
    let algumaSubChecadaHoje = false;

    subs.forEach(st => {
      if (st.concluida && st.dataConclusao === hojeAlvo) {
        algumaSubChecadaHoje = true;
        itensChecados.push({
          tarefaId: t.id,
          tarefaTitulo: t.titulo,
          subtarefaId: st.id,
          subtarefaTitulo: st.titulo,
          tipo: 'SUBTAREFA'
        });
        if (st.fotosExecucao && st.fotosExecucao.length > 0) {
          fotosColetadas.push(...st.fotosExecucao);
        }
      }
    });

    // Tarefa principal concluída hoje
    if (t.status === 'CONCLUIDA' && t.dataConclusao === hojeAlvo) {
      if (subs.length === 0 || !algumaSubChecadaHoje) {
        itensChecados.push({
          tarefaId: t.id,
          tarefaTitulo: t.titulo,
          tipo: 'TAREFA'
        });
      }
      if (t.fotosExecucao && t.fotosExecucao.length > 0) {
        fotosColetadas.push(...t.fotosExecucao);
      }
    }
  });

  const fotosUnicas = Array.from(new Set(fotosColetadas.filter(Boolean)));
  const indexExistente = diarioObra.findIndex(d => d.obraId === obraId && d.data === hojeAlvo);

  if (indexExistente >= 0) {
    const diarioExistente = diarioObra[indexExistente];
    // Se já confirmado pelo usuário, respeita a confirmação existente
    if (diarioExistente.statusConfirmacao === 'CONFIRMADO') {
      return diarioObra;
    }

    // Se é automático e não há mais itens checados (foram desmarcados), remove o RDO automático pendente
    if (itensChecados.length === 0) {
      if (diarioExistente.isAutomatico) {
        return diarioObra.filter((_, idx) => idx !== indexExistente);
      }
      return diarioObra;
    }

    const totalItens = itensChecados.length;
    const listaEventos = itensChecados.map(i => 
      i.tipo === 'SUBTAREFA' 
        ? `• [Check] Subtarefa: ${i.subtarefaTitulo} (Etapa: ${i.tarefaTitulo})`
        : `• [Check] Etapa: ${i.tarefaTitulo}`
    ).join('\n');

    const fotosMescladas = Array.from(new Set([
      ...(diarioExistente.fotosDia || []),
      ...fotosUnicas
    ]));

    const rdoAtualizado: DiarioObra = {
      ...diarioExistente,
      resumoDia: diarioExistente.resumoDia || `RDO Automático: ${totalItens} ${totalItens === 1 ? 'etapa checada' : 'etapas checadas'} no dia.`,
      eventos: listaEventos,
      itensChecados,
      fotosDia: fotosMescladas,
      statusConfirmacao: 'PENDENTE',
      isAutomatico: true
    };

    return diarioObra.map((d, idx) => idx === indexExistente ? rdoAtualizado : d);
  }

  // Se não existe RDO para hoje e temos itens checados hoje, gera automaticamente
  if (itensChecados.length > 0) {
    const totalItens = itensChecados.length;
    const listaEventos = itensChecados.map(i => 
      i.tipo === 'SUBTAREFA' 
        ? `• [Check] Subtarefa: ${i.subtarefaTitulo} (Etapa: ${i.tarefaTitulo})`
        : `• [Check] Etapa: ${i.tarefaTitulo}`
    ).join('\n');

    const novoRdo: DiarioObra = {
      id: generateId(),
      obraId,
      data: hojeAlvo,
      clima: 'SOL',
      resumoDia: `RDO Automático: ${totalItens} ${totalItens === 1 ? 'etapa checada' : 'etapas checadas'} no cronograma.`,
      eventos: listaEventos,
      fotosDia: fotosUnicas,
      itensChecados,
      statusConfirmacao: 'PENDENTE',
      isAutomatico: true
    };

    return [novoRdo, ...diarioObra];
  }

  return diarioObra;
}

export function useStore() {
  const [state, setState] = useState<AppState>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as AppState;
        // Normalização e retrocompatibilidade de tarefas e subtarefas
        if (parsed.tarefas && Array.isArray(parsed.tarefas)) {
          parsed.tarefas = parsed.tarefas.map(t => {
            const dataInicioPrevista = t.dataInicioPrevista || 
              new Date(new Date(t.dataFimPrevista).getTime() - (Math.max(1, t.duracaoDias || 1) - 1) * 86400000).toISOString().split('T')[0];
            const temAtividade = t.status === 'CONCLUIDA' || 
              Boolean(t.subtarefas && t.subtarefas.some(s => s.concluida)) || 
              Boolean(t.fotosExecucao && t.fotosExecucao.length > 0);
            const iniciada = t.iniciada !== undefined ? t.iniciada : temAtividade;
            const dataInicioReal = t.dataInicioReal || (iniciada ? dataInicioPrevista : undefined);

            const subtarefas = (t.subtarefas || []).map(st => ({
              ...st,
              dataInicioPrevista: st.dataInicioPrevista || dataInicioPrevista,
              dataFimPrevista: st.dataFimPrevista || t.dataFimPrevista,
              iniciada: st.iniciada !== undefined ? st.iniciada : (st.concluida || iniciada),
              fotosExecucao: st.fotosExecucao || []
            }));

            return {
              ...t,
              fotosExecucao: Array.isArray(t.fotosExecucao) ? t.fotosExecucao : [],
              dataInicioPrevista,
              iniciada,
              dataInicioReal,
              subtarefas
            };
          });
        }

        // Normalização e retrocompatibilidade de compras (categoria e itens)
        if (parsed.compras && Array.isArray(parsed.compras)) {
          parsed.compras = parsed.compras.map(c => {
            const categoria = c.categoria || 'Material';
            const itens = (c.itens && c.itens.length > 0) ? c.itens : [
              {
                id: generateId(),
                item: c.nomeMaterial || 'Item sem descrição',
                valorUnitario: c.valorTotal || 0,
                quantidade: 1,
                valorTotal: c.valorTotal || 0
              }
            ];
            return {
              ...c,
              categoria,
              itens
            };
          });
        }

        // Normalização e retrocompatibilidade de RDOs
        if (parsed.diarioObra && Array.isArray(parsed.diarioObra)) {
          parsed.diarioObra = parsed.diarioObra.map(d => ({
            ...d,
            statusConfirmacao: d.statusConfirmacao || 'CONFIRMADO'
          }));
        }

        const obraAtiva = parsed.obraAtivaId || parsed.obras?.[0]?.id;
        if (obraAtiva) {
          parsed.diarioObra = sincronizarRdoAutomaticoComTarefas(parsed.diarioObra || [], parsed.tarefas || [], obraAtiva);
        }

        return parsed;
      } catch (e) {
        console.error("Failed to parse stored state", e);
      }
    }
    const initialWithRdo = {
      ...initialMockState,
      diarioObra: sincronizarRdoAutomaticoComTarefas(initialMockState.diarioObra, initialMockState.tarefas, initialMockState.obraAtivaId || 'obra-1')
    };
    return initialWithRdo;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (err) {
      console.warn("Aviso ao salvar no localStorage (cota de armazenamento atingida):", err);
      try {
        // Se a cota do navegador for ultrapassada, salva versão otimizada
        const backupState: AppState = {
          ...state,
          diarioObra: state.diarioObra.map(d => ({
            ...d,
            fotosDia: (d.fotosDia || []).slice(-4)
          }))
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(backupState));
      } catch (innerErr) {
        console.error("Não foi possível persistir no localStorage:", innerErr);
      }
    }
  }, [state]);

  const setObraAtiva = useCallback((id: string) => {
    setState(s => {
      const diarioSinc = sincronizarRdoAutomaticoComTarefas(s.diarioObra, s.tarefas, id);
      return { ...s, obraAtivaId: id, diarioObra: diarioSinc };
    });
  }, []);

  const addObra = useCallback((obra: Obra) => {
    setState(s => ({ ...s, obras: [...s.obras, obra], obraAtivaId: obra.id }));
  }, []);

  const addTarefa = useCallback((tarefa: Tarefa) => {
    setState(s => {
      const novasTarefas = [...s.tarefas, tarefa];
      const obraId = tarefa.obraId || s.obraAtivaId;
      const novoDiario = obraId ? sincronizarRdoAutomaticoComTarefas(s.diarioObra, novasTarefas, obraId) : s.diarioObra;
      return { ...s, tarefas: novasTarefas, diarioObra: novoDiario };
    });
  }, []);

  const updateTarefa = useCallback((id: string, updates: Partial<Tarefa>) => {
    setState(s => {
      const novasTarefas = s.tarefas.map(t => t.id === id ? { ...t, ...updates } : t);
      const tarefaModificada = novasTarefas.find(t => t.id === id);
      const obraId = tarefaModificada?.obraId || s.obraAtivaId;
      const novoDiario = obraId ? sincronizarRdoAutomaticoComTarefas(s.diarioObra, novasTarefas, obraId) : s.diarioObra;
      return {
        ...s,
        tarefas: novasTarefas,
        diarioObra: novoDiario
      };
    });
  }, []);

  const confirmarInicioTarefa = useCallback((id: string, dataInicioReal?: string) => {
    const hoje = new Date().toISOString().split('T')[0];
    setState(s => ({
      ...s,
      tarefas: s.tarefas.map(t => {
        if (t.id !== id) return t;
        return {
          ...t,
          iniciada: true,
          dataInicioReal: dataInicioReal || hoje
        };
      })
    }));
  }, []);

  const desfazerInicioTarefa = useCallback((id: string) => {
    setState(s => ({
      ...s,
      tarefas: s.tarefas.map(t => {
        if (t.id !== id) return t;
        return {
          ...t,
          iniciada: false,
          dataInicioReal: undefined
        };
      })
    }));
  }, []);

  const confirmarInicioSubtarefa = useCallback((tarefaId: string, subtarefaId: string, dataInicioReal?: string) => {
    const hoje = new Date().toISOString().split('T')[0];
    setState(s => ({
      ...s,
      tarefas: s.tarefas.map(t => {
        if (t.id !== tarefaId) return t;
        const subs = (t.subtarefas || []).map(st => {
          if (st.id !== subtarefaId) return st;
          return {
            ...st,
            iniciada: true,
            dataInicioReal: dataInicioReal || hoje
          };
        });
        return {
          ...t,
          iniciada: true,
          dataInicioReal: t.dataInicioReal || dataInicioReal || hoje,
          subtarefas: subs
        };
      })
    }));
  }, []);

  const desfazerInicioSubtarefa = useCallback((tarefaId: string, subtarefaId: string) => {
    setState(s => ({
      ...s,
      tarefas: s.tarefas.map(t => {
        if (t.id !== tarefaId) return t;
        const subs = (t.subtarefas || []).map(st => {
          if (st.id !== subtarefaId) return st;
          return {
            ...st,
            iniciada: false,
            dataInicioReal: undefined
          };
        });
        return {
          ...t,
          subtarefas: subs
        };
      })
    }));
  }, []);

  const deleteTarefa = useCallback((id: string) => {
    setState(s => ({
      ...s,
      tarefas: s.tarefas.filter(t => t.id !== id),
      compras: s.compras.map(c => c.tarefaId === id ? { ...c, tarefaId: undefined } : c)
    }));
  }, []);

  const addCompra = useCallback((compra: Compra) => {
    const hojeStr = new Date().toISOString().split('T')[0];
    const isFuturo = compra.dataNecessidade > hojeStr;
    const finalCompra: Compra = {
      ...compra,
      isPrevisao: compra.isPrevisao !== undefined ? compra.isPrevisao : isFuturo
    };
    setState(s => ({ ...s, compras: [...s.compras, finalCompra] }));
  }, []);

  const updateCompra = useCallback((id: string, updates: Partial<Compra>) => {
    setState(s => ({
      ...s,
      compras: s.compras.map(c => c.id === id ? { ...c, ...updates } : c)
    }));
  }, []);

  const confirmarCompra = useCallback((id: string, dataEfetivada?: string) => {
    const hojeStr = new Date().toISOString().split('T')[0];
    setState(s => ({
      ...s,
      compras: s.compras.map(c => {
        if (c.id !== id) return c;
        return {
          ...c,
          isPrevisao: false,
          dataConfirmacao: dataEfetivada || hojeStr,
          dataNecessidade: dataEfetivada || c.dataNecessidade,
          statusCompra: c.statusCompra === 'PENDENTE' ? 'COMPRADO' : c.statusCompra
        };
      })
    }));
  }, []);

  const deleteCompra = useCallback((id: string) => {
    setState(s => ({
      ...s,
      compras: s.compras.filter(c => c.id !== id)
    }));
  }, []);

  const addPagamento = useCallback((pagamento: PagamentoCliente) => {
    const hojeStr = new Date().toISOString().split('T')[0];
    const isFuturo = pagamento.data > hojeStr;
    const finalPagamento: PagamentoCliente = {
      ...pagamento,
      isPrevisao: pagamento.isPrevisao !== undefined ? pagamento.isPrevisao : isFuturo
    };
    setState(s => ({ ...s, pagamentosCliente: [...s.pagamentosCliente, finalPagamento] }));
  }, []);

  const updatePagamento = useCallback((id: string, updates: Partial<PagamentoCliente>) => {
    setState(s => ({
      ...s,
      pagamentosCliente: s.pagamentosCliente.map(p => p.id === id ? { ...p, ...updates } : p)
    }));
  }, []);

  const confirmarPagamento = useCallback((id: string, dataEfetivada?: string) => {
    const hojeStr = new Date().toISOString().split('T')[0];
    setState(s => ({
      ...s,
      pagamentosCliente: s.pagamentosCliente.map(p => {
        if (p.id !== id) return p;
        return {
          ...p,
          isPrevisao: false,
          dataConfirmacao: dataEfetivada || hojeStr,
          data: dataEfetivada || p.data
        };
      })
    }));
  }, []);

  const deletePagamento = useCallback((id: string) => {
    setState(s => ({
      ...s,
      pagamentosCliente: s.pagamentosCliente.filter(p => p.id !== id)
    }));
  }, []);

function desfazerChecksNasTarefas(tarefas: Tarefa[], itensParaDesfazer: ItemChecadoDiario[]): Tarefa[] {
  if (!itensParaDesfazer || itensParaDesfazer.length === 0) return tarefas;

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  return tarefas.map(tarefa => {
    const checksDaTarefa = itensParaDesfazer.filter(i => i.tarefaId === tarefa.id);
    if (checksDaTarefa.length === 0) return tarefa;

    let novaTarefa = { ...tarefa };
    let subtarefas = novaTarefa.subtarefas ? [...novaTarefa.subtarefas] : [];

    checksDaTarefa.forEach(item => {
      if (item.tipo === 'SUBTAREFA' && item.subtarefaId) {
        subtarefas = subtarefas.map(st => 
          st.id === item.subtarefaId 
            ? { ...st, concluida: false, dataConclusao: undefined }
            : st
        );
      }
    });

    const desfezTarefaCompleta = checksDaTarefa.some(i => i.tipo === 'TAREFA');
    const temSubtarefas = subtarefas.length > 0;
    const algumaSubPendente = temSubtarefas && subtarefas.some(st => !st.concluida);

    if (desfezTarefaCompleta || algumaSubPendente) {
      const dataFim = new Date(novaTarefa.dataFimPrevista + 'T00:00:00');
      const isAtrasada = dataFim < hoje;
      novaTarefa.status = isAtrasada ? 'ATRASADA' : 'PENDENTE';
      novaTarefa.dataConclusao = undefined;
    }

    novaTarefa.subtarefas = subtarefas;
    return novaTarefa;
  });
}

function aplicarChecksNasTarefas(
  tarefas: Tarefa[], 
  checks: { tarefaId: string; subtarefaId?: string; dataConclusao: string; concluirTarefaCompleta?: boolean }[],
  dataPadrao: string
): Tarefa[] {
  if (!checks || checks.length === 0) return tarefas;

  return tarefas.map(tarefa => {
    const tarefaChecks = checks.filter(c => c.tarefaId === tarefa.id);
    if (tarefaChecks.length === 0) return tarefa;

    let novaTarefa = { ...tarefa };
    let subtarefas = novaTarefa.subtarefas ? [...novaTarefa.subtarefas] : [];

    tarefaChecks.forEach(check => {
      if (check.subtarefaId) {
        subtarefas = subtarefas.map(st => 
          st.id === check.subtarefaId 
            ? { ...st, concluida: true, dataConclusao: check.dataConclusao }
            : st
        );
      }
      if (check.concluirTarefaCompleta || !check.subtarefaId) {
        novaTarefa.status = 'CONCLUIDA';
        novaTarefa.dataConclusao = check.dataConclusao;
      }
    });

    // Se tiver subtarefas e todas estiverem concluídas, conclui a tarefa principal
    if (subtarefas.length > 0 && subtarefas.every(st => st.concluida)) {
      novaTarefa.status = 'CONCLUIDA';
      if (!novaTarefa.dataConclusao) {
        novaTarefa.dataConclusao = dataPadrao;
      }
    }

    novaTarefa.subtarefas = subtarefas;
    return novaTarefa;
  });
}

  const addDiario = useCallback((diario: DiarioObra) => {
    const diarioFormatado: DiarioObra = {
      ...diario,
      statusConfirmacao: diario.statusConfirmacao || 'CONFIRMADO'
    };
    setState(s => ({ ...s, diarioObra: [...s.diarioObra, diarioFormatado] }));
  }, []);

  const addDiarioComChecks = useCallback((
    diario: DiarioObra, 
    checks: { tarefaId: string; subtarefaId?: string; dataConclusao: string; concluirTarefaCompleta?: boolean }[]
  ) => {
    const diarioFormatado: DiarioObra = {
      ...diario,
      statusConfirmacao: diario.statusConfirmacao || 'CONFIRMADO'
    };
    setState(s => {
      const tarefasAtualizadas = aplicarChecksNasTarefas(s.tarefas, checks, diario.data);
      return {
        ...s,
        diarioObra: [...s.diarioObra, diarioFormatado],
        tarefas: tarefasAtualizadas
      };
    });
  }, []);

  const confirmarRdo = useCallback((id: string) => {
    setState(s => ({
      ...s,
      diarioObra: s.diarioObra.map(d => d.id === id ? { ...d, statusConfirmacao: 'CONFIRMADO' } : d)
    }));
  }, []);

  const gerarRdoAutomatico = useCallback((obraId?: string) => {
    setState(s => {
      const idAlvo = obraId || s.obraAtivaId;
      if (!idAlvo) return s;
      const novoDiario = sincronizarRdoAutomaticoComTarefas(s.diarioObra, s.tarefas, idAlvo);
      return { ...s, diarioObra: novoDiario };
    });
  }, []);

  const updateDiario = useCallback((
    id: string,
    novoDiario: DiarioObra,
    novosChecks: { tarefaId: string; subtarefaId?: string; dataConclusao: string; concluirTarefaCompleta?: boolean }[]
  ) => {
    setState(s => {
      const diarioAntigo = s.diarioObra.find(d => d.id === id);
      if (!diarioAntigo) return s;

      const antigosItens = diarioAntigo.itensChecados || [];
      const novosItens = novoDiario.itensChecados || [];

      // Itens que estavam checados no antigo mas deixaram de estar no novo
      const itensRemovidos = antigosItens.filter(ant => {
        if (ant.tipo === 'SUBTAREFA') {
          return !novosItens.some(nov => nov.tipo === 'SUBTAREFA' && nov.subtarefaId === ant.subtarefaId);
        } else {
          return !novosItens.some(nov => nov.tipo === 'TAREFA' && nov.tarefaId === ant.tarefaId);
        }
      });

      // 1. Desfaz os que foram removidos
      let tarefasAtualizadas = desfazerChecksNasTarefas(s.tarefas, itensRemovidos);

      // 2. Aplica / atualiza os checks atuais com a data correspondente
      tarefasAtualizadas = aplicarChecksNasTarefas(tarefasAtualizadas, novosChecks, novoDiario.data);

      return {
        ...s,
        diarioObra: s.diarioObra.map(d => d.id === id ? novoDiario : d),
        tarefas: tarefasAtualizadas
      };
    });
  }, []);

  const deleteDiario = useCallback((id: string) => {
    setState(s => {
      const diarioParaExcluir = s.diarioObra.find(d => d.id === id);
      if (!diarioParaExcluir) return s;

      // Se o diário tem itens checados, desfaz todos os checks nas tarefas
      let tarefasAtualizadas = s.tarefas;
      if (diarioParaExcluir.itensChecados && diarioParaExcluir.itensChecados.length > 0) {
        tarefasAtualizadas = desfazerChecksNasTarefas(s.tarefas, diarioParaExcluir.itensChecados);
      }

      return {
        ...s,
        diarioObra: s.diarioObra.filter(d => d.id !== id),
        tarefas: tarefasAtualizadas
      };
    });
  }, []);

  const addTicket = useCallback((ticket: TicketAlteracao) => {
    setState(s => ({ ...s, ticketsAlteracao: [...s.ticketsAlteracao, ticket] }));
  }, []);

  const updateTicket = useCallback((id: string, updates: Partial<TicketAlteracao>) => {
    setState(s => ({
      ...s,
      ticketsAlteracao: s.ticketsAlteracao.map(t => t.id === id ? { ...t, ...updates } : t)
    }));
  }, []);

  const updateTicketStatus = useCallback((id: string, status: TicketStatus) => {
    setState(s => ({
      ...s,
      ticketsAlteracao: s.ticketsAlteracao.map(t => t.id === id ? { ...t, status } : t)
    }));
  }, []);

  const deleteTicket = useCallback((id: string) => {
    setState(s => ({
      ...s,
      ticketsAlteracao: s.ticketsAlteracao.filter(t => t.id !== id)
    }));
  }, []);

  return {
    state,
    setObraAtiva,
    addObra,
    addTarefa,
    updateTarefa,
    deleteTarefa,
    confirmarInicioTarefa,
    desfazerInicioTarefa,
    confirmarInicioSubtarefa,
    desfazerInicioSubtarefa,
    addCompra,
    updateCompra,
    confirmarCompra,
    deleteCompra,
    addPagamento,
    updatePagamento,
    confirmarPagamento,
    deletePagamento,
    addDiario,
    addDiarioComChecks,
    updateDiario,
    deleteDiario,
    confirmarRdo,
    gerarRdoAutomatico,
    addTicket,
    updateTicket,
    updateTicketStatus,
    deleteTicket
  };
}

export function generateId() {
  return Math.random().toString(36).substring(2, 9);
}

export function fileToBase64(file: File, maxDim = 1200, quality = 0.75): Promise<string> {
  return new Promise((resolve, reject) => {
    // Se não for imagem (ou navegador sem suporte a Image), lê diretamente como DataURL
    if (!file.type || !file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      if (!dataUrl) {
        resolve('');
        return;
      }

      const img = new Image();
      img.onload = () => {
        try {
          let width = img.naturalWidth || img.width;
          let height = img.naturalHeight || img.height;

          // Se a imagem exceder as dimensões máximas, redimensiona proporcionalmente
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = Math.max(1, width);
          canvas.height = Math.max(1, height);
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(dataUrl);
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);
          // Gera JPEG com compressão inteligente (reduz de ~8MB para ~80KB mantendo alta nitidez)
          const compressed = canvas.toDataURL('image/jpeg', quality);
          resolve(compressed);
        } catch (canvasErr) {
          console.warn("Compressão por canvas falhou, usando dataUrl original:", canvasErr);
          resolve(dataUrl);
        }
      };

      img.onerror = () => {
        resolve(dataUrl);
      };

      img.src = dataUrl;
    };

    reader.onerror = error => reject(error);
    reader.readAsDataURL(file);
  });
}
