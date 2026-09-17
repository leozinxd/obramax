import React, { useState } from 'react';
import { AppState, generateId } from '../store';
import { DiarioObra as IDiarioObra, ItemChecadoDiario } from '../types';
import { 
  Cloud, 
  Sun, 
  CloudRain, 
  Wind, 
  FileText, 
  CheckSquare, 
  Square, 
  ListChecks, 
  CheckCircle2,
  Calendar, 
  CalendarCheck,
  ChevronDown,
  ChevronUp,
  ChevronsDownUp,
  ChevronsUpDown,
  Camera,
  Edit2,
  Trash2,
  AlertTriangle,
  X,
  Undo2,
  Check,
  Sparkles,
  Plus,
  FileCheck2
} from 'lucide-react';
import { ImageUploader } from './ImageUploader';
import { ModalConfirmacaoCiente } from './ModalConfirmacaoCiente';

interface DiarioProps {
  state: AppState;
  onAddDiario: (diario: IDiarioObra) => void;
  onAddDiarioComChecks?: (
    diario: IDiarioObra, 
    checks: { tarefaId: string; subtarefaId?: string; dataConclusao: string; concluirTarefaCompleta?: boolean }[]
  ) => void;
  onUpdateDiario?: (
    id: string,
    diario: IDiarioObra,
    checks: { tarefaId: string; subtarefaId?: string; dataConclusao: string; concluirTarefaCompleta?: boolean }[]
  ) => void;
  onConfirmarRdo?: (id: string) => void;
  onDeleteDiario?: (id: string) => void;
}

export function DiarioObra({ 
  state, 
  onAddDiario, 
  onAddDiarioComChecks,
  onUpdateDiario,
  onConfirmarRdo,
  onDeleteDiario
}: DiarioProps) {
  const [showNovo, setShowNovo] = useState(false);
  const [diarioEmEdicao, setDiarioEmEdicao] = useState<IDiarioObra | null>(null);
  const [diarioParaExcluir, setDiarioParaExcluir] = useState<IDiarioObra | null>(null);
  const [mensagemSucesso, setMensagemSucesso] = useState<string | null>(null);

  const obraId = state.obraAtivaId;

  const handleConfirmarRdoDireto = (id: string) => {
    if (onConfirmarRdo) {
      onConfirmarRdo(id);
      setMensagemSucesso("RDO confirmado com sucesso!");
      setTimeout(() => setMensagemSucesso(null), 3500);
    } else if (onUpdateDiario) {
      const d = state.diarioObra.find(item => item.id === id);
      if (d) {
        onUpdateDiario(id, { ...d, statusConfirmacao: 'CONFIRMADO' }, []);
        setMensagemSucesso("RDO confirmado com sucesso!");
        setTimeout(() => setMensagemSucesso(null), 3500);
      }
    }
  };

  const diarios = [...state.diarioObra.filter(d => d.obraId === obraId)].sort((a, b) => 
    new Date(b.data).getTime() - new Date(a.data).getTime()
  );

  const tarefasObra = state.tarefas.filter(t => t.obraId === obraId);

  // Form State (Novo RDO)
  const [data, setData] = useState(new Date().toISOString().split('T')[0]);
  const [clima, setClima] = useState('SOL');
  const [resumo, setResumo] = useState('');
  const [eventos, setEventos] = useState('');
  const [foto1, setFoto1] = useState('');
  const [foto2, setFoto2] = useState('');
  const [tarefasSelecionadas, setTarefasSelecionadas] = useState<{ [tarefaId: string]: boolean }>({});
  const [subtarefasSelecionadas, setSubtarefasSelecionadas] = useState<{ [subId: string]: boolean }>({});
  const [tarefasExpandidas, setTarefasExpandidas] = useState<{ [tarefaId: string]: boolean }>({});

  // Form State (Edição de RDO)
  const [editData, setEditData] = useState('');
  const [editClima, setEditClima] = useState('SOL');
  const [editResumo, setEditResumo] = useState('');
  const [editEventos, setEditEventos] = useState('');
  const [editFoto1, setEditFoto1] = useState('');
  const [editFoto2, setEditFoto2] = useState('');
  const [editTarefasSelecionadas, setEditTarefasSelecionadas] = useState<{ [tarefaId: string]: boolean }>({});
  const [editSubtarefasSelecionadas, setEditSubtarefasSelecionadas] = useState<{ [subId: string]: boolean }>({});
  const [editTarefasExpandidas, setEditTarefasExpandidas] = useState<{ [tarefaId: string]: boolean }>({});

  // Alterna expansão de sub-tarefas (Novo)
  const toggleExpansaoTarefa = (tarefaId: string) => {
    setTarefasExpandidas(prev => ({ ...prev, [tarefaId]: !prev[tarefaId] }));
  };

  // Alterna expansão de sub-tarefas (Edição)
  const toggleEditExpansaoTarefa = (tarefaId: string) => {
    setEditTarefasExpandidas(prev => ({ ...prev, [tarefaId]: !prev[tarefaId] }));
  };

  // Expandir / Recolher todas as tarefas no formulário Novo
  const handleExpandirTodasTarefasNovo = () => {
    const mapa: { [id: string]: boolean } = {};
    tarefasObra.forEach(t => { mapa[t.id] = true; });
    setTarefasExpandidas(mapa);
  };

  const handleRecolherTodasTarefasNovo = () => {
    setTarefasExpandidas({});
  };

  // Expandir / Recolher todas as tarefas no formulário Edição
  const handleExpandirTodasTarefasEdit = () => {
    const mapa: { [id: string]: boolean } = {};
    tarefasObra.forEach(t => { mapa[t.id] = true; });
    setEditTarefasExpandidas(mapa);
  };

  const handleRecolherTodasTarefasEdit = () => {
    setEditTarefasExpandidas({});
  };

  // Estado para colapsar/expandir diários individuais ou todos na lista
  const [diariosColapsados, setDiariosColapsados] = useState<{ [diarioId: string]: boolean }>({});
  const [todosDiariosColapsados, setTodosDiariosColapsados] = useState(true);

  const isDiarioColapsado = (diarioId: string) => {
    if (diariosColapsados[diarioId] !== undefined) {
      return diariosColapsados[diarioId];
    }
    return todosDiariosColapsados;
  };

  const toggleColapsarDiario = (diarioId: string) => {
    setDiariosColapsados(prev => {
      const atual = prev[diarioId] !== undefined ? prev[diarioId] : todosDiariosColapsados;
      return { ...prev, [diarioId]: !atual };
    });
  };

  const handleColapsarTodosDiarios = () => {
    setTodosDiariosColapsados(true);
    const mapa: { [id: string]: boolean } = {};
    diarios.forEach(d => { mapa[d.id] = true; });
    setDiariosColapsados(mapa);
  };

  const handleExpandirTodosDiarios = () => {
    setTodosDiariosColapsados(false);
    const mapa: { [id: string]: boolean } = {};
    diarios.forEach(d => { mapa[d.id] = false; });
    setDiariosColapsados(mapa);
  };

  // Iniciar Edição de RDO
  const handleStartEdit = (diario: IDiarioObra) => {
    setDiarioEmEdicao(diario);
    setShowNovo(false);
    setEditData(diario.data);
    setEditClima(diario.clima);
    setEditResumo(diario.resumoDia);
    setEditEventos(diario.eventos || '');
    setEditFoto1(diario.fotosDia?.[0] || '');
    setEditFoto2(diario.fotosDia?.[1] || '');

    // Inicializa seleção das tarefas e subtarefas que pertencem a este RDO
    const tarSel: { [id: string]: boolean } = {};
    const subSel: { [id: string]: boolean } = {};
    const expMap: { [id: string]: boolean } = {};

    (diario.itensChecados || []).forEach(item => {
      if (item.tipo === 'TAREFA') {
        tarSel[item.tarefaId] = true;
        expMap[item.tarefaId] = true;
      } else if (item.tipo === 'SUBTAREFA' && item.subtarefaId) {
        subSel[item.subtarefaId] = true;
        expMap[item.tarefaId] = true;
      }
    });

    setEditTarefasSelecionadas(tarSel);
    setEditSubtarefasSelecionadas(subSel);
    setEditTarefasExpandidas(expMap);

    // Rola para o topo suavemente para ver o formulário
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setDiarioEmEdicao(null);
  };

  // Toggle de seleção de tarefa completa no formulário Novo
  const handleToggleTarefaCheck = (tarefaId: string) => {
    const novoValor = !tarefasSelecionadas[tarefaId];
    setTarefasSelecionadas(prev => ({ ...prev, [tarefaId]: novoValor }));

    const tarefa = tarefasObra.find(t => t.id === tarefaId);
    if (tarefa && tarefa.subtarefas) {
      setSubtarefasSelecionadas(prev => {
        const next = { ...prev };
        tarefa.subtarefas?.forEach(st => {
          if (!st.concluida) {
            next[st.id] = novoValor;
          }
        });
        return next;
      });
    }
  };

  // Toggle de seleção de sub-tarefa individual no formulário Novo
  const handleToggleSubtarefaCheck = (tarefaId: string, subId: string) => {
    setSubtarefasSelecionadas(prev => {
      const next = { ...prev, [subId]: !prev[subId] };
      
      const tarefa = tarefasObra.find(t => t.id === tarefaId);
      if (tarefa && tarefa.subtarefas) {
        const todasPendentesMarcadas = tarefa.subtarefas
          .filter(st => !st.concluida)
          .every(st => (st.id === subId ? !prev[subId] : next[st.id]));
        
        if (todasPendentesMarcadas) {
          setTarefasSelecionadas(tPrev => ({ ...tPrev, [tarefaId]: true }));
        } else if (!next[subId]) {
          setTarefasSelecionadas(tPrev => ({ ...tPrev, [tarefaId]: false }));
        }
      }

      return next;
    });
  };

  // Toggle de seleção de tarefa completa na Edição
  const handleToggleEditTarefaCheck = (tarefaId: string) => {
    const novoValor = !editTarefasSelecionadas[tarefaId];
    setEditTarefasSelecionadas(prev => ({ ...prev, [tarefaId]: novoValor }));

    const tarefa = tarefasObra.find(t => t.id === tarefaId);
    if (tarefa && tarefa.subtarefas) {
      const itensDesteRdo = diarioEmEdicao?.itensChecados || [];
      setEditSubtarefasSelecionadas(prev => {
        const next = { ...prev };
        tarefa.subtarefas?.forEach(st => {
          // Permite marcar se estiver pendente OU se tiver sido checada por este RDO
          const pertenceAEsteRdo = itensDesteRdo.some(i => i.tipo === 'SUBTAREFA' && i.subtarefaId === st.id);
          if (!st.concluida || pertenceAEsteRdo) {
            next[st.id] = novoValor;
          }
        });
        return next;
      });
    }
  };

  // Toggle de seleção de sub-tarefa individual na Edição
  const handleToggleEditSubtarefaCheck = (tarefaId: string, subId: string) => {
    setEditSubtarefasSelecionadas(prev => {
      const next = { ...prev, [subId]: !prev[subId] };
      
      const tarefa = tarefasObra.find(t => t.id === tarefaId);
      if (tarefa && tarefa.subtarefas) {
        const itensDesteRdo = diarioEmEdicao?.itensChecados || [];
        const elegiveis = tarefa.subtarefas.filter(st => 
          !st.concluida || itensDesteRdo.some(i => i.tipo === 'SUBTAREFA' && i.subtarefaId === st.id)
        );
        const todasElegiveisMarcadas = elegiveis.length > 0 && elegiveis.every(st => 
          st.id === subId ? !prev[subId] : next[st.id]
        );
        
        if (todasElegiveisMarcadas) {
          setEditTarefasSelecionadas(tPrev => ({ ...tPrev, [tarefaId]: true }));
        } else if (!next[subId]) {
          setEditTarefasSelecionadas(tPrev => ({ ...tPrev, [tarefaId]: false }));
        }
      }

      return next;
    });
  };

  // Salvar Novo RDO
  const handleSalvar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!obraId) return;

    const fotos = [foto1, foto2].filter(Boolean);
    const itensChecados: ItemChecadoDiario[] = [];
    const checksParaStore: { tarefaId: string; subtarefaId?: string; dataConclusao: string; concluirTarefaCompleta?: boolean }[] = [];

    tarefasObra.forEach(tarefa => {
      const tarefaMarcada = tarefasSelecionadas[tarefa.id];
      const subs = tarefa.subtarefas || [];
      const subtarefasMarcadasDestaTarefa = subs.filter(st => !st.concluida && subtarefasSelecionadas[st.id]);

      subtarefasMarcadasDestaTarefa.forEach(st => {
        itensChecados.push({
          tarefaId: tarefa.id,
          tarefaTitulo: tarefa.titulo,
          subtarefaId: st.id,
          subtarefaTitulo: st.titulo,
          tipo: 'SUBTAREFA'
        });
        checksParaStore.push({
          tarefaId: tarefa.id,
          subtarefaId: st.id,
          dataConclusao: data,
          concluirTarefaCompleta: false
        });
      });

      if (tarefaMarcada) {
        itensChecados.push({
          tarefaId: tarefa.id,
          tarefaTitulo: tarefa.titulo,
          tipo: 'TAREFA'
        });
        checksParaStore.push({
          tarefaId: tarefa.id,
          dataConclusao: data,
          concluirTarefaCompleta: true
        });
      }
    });

    const novoDiario: IDiarioObra = {
      id: generateId(),
      obraId,
      data,
      clima,
      resumoDia: resumo,
      eventos,
      fotosDia: fotos,
      itensChecados: itensChecados.length > 0 ? itensChecados : undefined
    };

    if (onAddDiarioComChecks) {
      onAddDiarioComChecks(novoDiario, checksParaStore);
    } else {
      onAddDiario(novoDiario);
    }

    setShowNovo(false);
    setResumo(''); 
    setEventos(''); 
    setFoto1(''); 
    setFoto2('');
    setTarefasSelecionadas({});
    setSubtarefasSelecionadas({});
  };

  // Salvar Alterações de RDO Existente
  const handleSalvarEdicao = (e: React.FormEvent, confirmar: boolean = false) => {
    e.preventDefault();
    if (!obraId || !diarioEmEdicao) return;

    const fotos = [editFoto1, editFoto2].filter(Boolean);
    const itensChecadosNovos: ItemChecadoDiario[] = [];
    const checksParaStoreNovos: { tarefaId: string; subtarefaId?: string; dataConclusao: string; concluirTarefaCompleta?: boolean }[] = [];

    const itensDesteRdoAntigo = diarioEmEdicao.itensChecados || [];

    tarefasObra.forEach(tarefa => {
      const tarefaMarcada = editTarefasSelecionadas[tarefa.id];
      const subs = tarefa.subtarefas || [];
      
      // Subtarefas elegíveis marcadas
      const subsMarcadas = subs.filter(st => {
        const pertenciaAoRdo = itensDesteRdoAntigo.some(i => i.tipo === 'SUBTAREFA' && i.subtarefaId === st.id);
        const podeEditar = !st.concluida || pertenciaAoRdo;
        return podeEditar && editSubtarefasSelecionadas[st.id];
      });

      subsMarcadas.forEach(st => {
        itensChecadosNovos.push({
          tarefaId: tarefa.id,
          tarefaTitulo: tarefa.titulo,
          subtarefaId: st.id,
          subtarefaTitulo: st.titulo,
          tipo: 'SUBTAREFA'
        });
        checksParaStoreNovos.push({
          tarefaId: tarefa.id,
          subtarefaId: st.id,
          dataConclusao: editData,
          concluirTarefaCompleta: false
        });
      });

      if (tarefaMarcada) {
        itensChecadosNovos.push({
          tarefaId: tarefa.id,
          tarefaTitulo: tarefa.titulo,
          tipo: 'TAREFA'
        });
        checksParaStoreNovos.push({
          tarefaId: tarefa.id,
          dataConclusao: editData,
          concluirTarefaCompleta: true
        });
      }
    });

    const statusFinal = (diarioEmEdicao.statusConfirmacao === 'PENDENTE' && !confirmar)
      ? 'PENDENTE'
      : 'CONFIRMADO';

    const diarioAtualizado: IDiarioObra = {
      ...diarioEmEdicao,
      data: editData,
      clima: editClima,
      resumoDia: editResumo,
      eventos: editEventos,
      fotosDia: fotos,
      statusConfirmacao: statusFinal,
      itensChecados: itensChecadosNovos.length > 0 ? itensChecadosNovos : undefined
    };

    if (onUpdateDiario) {
      onUpdateDiario(diarioEmEdicao.id, diarioAtualizado, checksParaStoreNovos);
      if (confirmar) {
        setMensagemSucesso("RDO revisado e confirmado com sucesso!");
        setTimeout(() => setMensagemSucesso(null), 3500);
      } else {
        setMensagemSucesso("RDO salvo com sucesso!");
        setTimeout(() => setMensagemSucesso(null), 3500);
      }
    }

    setDiarioEmEdicao(null);
  };

  // Confirmar Exclusão de RDO
  const handleConfirmarExclusao = () => {
    if (!diarioParaExcluir) return;
    if (onDeleteDiario) {
      onDeleteDiario(diarioParaExcluir.id);
    }
    setDiarioParaExcluir(null);
  };

  const getClimaIcon = (c: string) => {
    switch (c) {
      case 'SOL': return <Sun className="w-5 h-5 text-amber-500" />;
      case 'CHUVA': return <CloudRain className="w-5 h-5 text-blue-500" />;
      case 'NUBLADO': return <Cloud className="w-5 h-5 text-slate-500" />;
      default: return <Wind className="w-5 h-5 text-slate-400" />;
    }
  };

  // Contagem de itens selecionados no formulário Novo
  const totalTarefasChecadas = Object.values(tarefasSelecionadas).filter(Boolean).length;
  const totalSubsChecadas = Object.values(subtarefasSelecionadas).filter(Boolean).length;

  // Contagem de itens selecionados no formulário Edição
  const totalEditTarefasChecadas = Object.values(editTarefasSelecionadas).filter(Boolean).length;
  const totalEditSubsChecadas = Object.values(editSubtarefasSelecionadas).filter(Boolean).length;

  return (
    <div className="space-y-6 pb-24">
      {/* Toast de Sucesso */}
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

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Diário de Obra</h1>
          <p className="text-sm text-slate-500">Registros diários da obra</p>
        </div>
        {!showNovo && !diarioEmEdicao && (
          <button 
            onClick={() => setShowNovo(true)}
            className="shrink-0 flex items-center bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Novo RDO
          </button>
        )}
      </div>

      {/* ========================================================================= */}
      {/* FORMULÁRIO DE EDIÇÃO DE RDO */}
      {/* ========================================================================= */}
      {diarioEmEdicao && (
        <form onSubmit={handleSalvarEdicao} className="bg-white p-5 rounded-2xl shadow-md border-2 border-indigo-500/40 space-y-4 animate-fadeIn">
          <div className="flex justify-between items-center pb-2 border-b border-indigo-100">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-indigo-100 text-indigo-700 rounded-lg">
                <Edit2 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-base">Editar Registro Diário (RDO)</h3>
                <p className="text-xs text-indigo-600 font-medium">Modifique atividades ou gerencie checks vinculados</p>
              </div>
            </div>
            <button 
              type="button" 
              onClick={handleCancelEdit} 
              className="text-slate-400 hover:text-slate-600 text-xs font-semibold px-2 py-1 flex items-center gap-1 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <X className="w-4 h-4" />
              Cancelar
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Data do Registro *</label>
              <input 
                required 
                type="date" 
                value={editData} 
                onChange={e => setEditData(e.target.value)} 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500" 
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Condição Climática</label>
              <select 
                value={editClima} 
                onChange={e => setEditClima(e.target.value)} 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="SOL">Céu Claro / Sol</option>
                <option value="NUBLADO">Nublado</option>
                <option value="CHUVA">Chuva</option>
              </select>
            </div>
          </div>

          {/* Seção: Check de Tarefas e Subtarefas do Cronograma na Edição */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <ListChecks className="w-4 h-4 text-indigo-600" />
                Avanço do Cronograma (Itens Checados neste RDO)
              </label>
              <div className="flex items-center gap-2">
                {(totalEditTarefasChecadas > 0 || totalEditSubsChecadas > 0) && (
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                    {totalEditTarefasChecadas} etapa(s), {totalEditSubsChecadas} sub-tarefa(s)
                  </span>
                )}
                {tarefasObra.length > 0 && (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={handleRecolherTodasTarefasEdit}
                      className="text-[10px] text-slate-500 hover:text-slate-800 bg-white border border-slate-200 px-1.5 py-0.5 rounded transition-colors cursor-pointer"
                      title="Recolher sub-tarefas"
                    >
                      Recolher
                    </button>
                    <button
                      type="button"
                      onClick={handleExpandirTodasTarefasEdit}
                      className="text-[10px] text-indigo-600 hover:text-indigo-800 bg-white border border-indigo-200 px-1.5 py-0.5 rounded transition-colors cursor-pointer"
                      title="Expandir todas as sub-tarefas"
                    >
                      Expandir
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="text-[11px] bg-indigo-50/80 text-indigo-900 p-2.5 rounded-lg border border-indigo-200/60 leading-relaxed">
              <strong>Atenção:</strong> Desmarcar um item removerá a conclusão do cronograma automaticamente ao salvar. Você também pode marcar novas etapas ou sub-tarefas pendentes.
            </div>

            {tarefasObra.length === 0 ? (
              <p className="text-xs text-slate-400 italic">Nenhuma etapa cadastrada no cronograma desta obra.</p>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {tarefasObra.map(tarefa => {
                  const itensDesteRdo = diarioEmEdicao?.itensChecados || [];
                  const tarefaChecadaPorEsteRdo = itensDesteRdo.some(i => i.tipo === 'TAREFA' && i.tarefaId === tarefa.id);
                  const tarefaConcluidaPorOutro = tarefa.status === 'CONCLUIDA' && !tarefaChecadaPorEsteRdo;

                  const subs = tarefa.subtarefas || [];
                  const temSubs = subs.length > 0;
                  const isChecked = !!editTarefasSelecionadas[tarefa.id];
                  const isExpanded = editTarefasExpandidas[tarefa.id] ?? true;

                  return (
                    <div 
                      key={tarefa.id} 
                      className={`p-2.5 rounded-xl border transition-colors ${
                        isChecked 
                          ? 'bg-emerald-50/60 border-emerald-300' 
                          : tarefaConcluidaPorOutro 
                          ? 'bg-slate-100/60 border-slate-200' 
                          : 'bg-white border-slate-200'
                      }`}
                    >
                      {/* Linha da Tarefa Principal */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <button
                            type="button"
                            disabled={tarefaConcluidaPorOutro}
                            onClick={() => handleToggleEditTarefaCheck(tarefa.id)}
                            className={`flex items-center gap-2 text-left flex-1 min-w-0 ${
                              tarefaConcluidaPorOutro ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
                            }`}
                          >
                            {tarefaConcluidaPorOutro ? (
                              <CheckCircle2 className="w-4 h-4 text-slate-400 flex-shrink-0" />
                            ) : isChecked ? (
                              <CheckSquare className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                            ) : (
                              <Square className="w-4 h-4 text-slate-400 flex-shrink-0" />
                            )}
                            <span className={`text-xs font-semibold truncate ${
                              tarefaConcluidaPorOutro ? 'line-through text-slate-400' : isChecked ? 'text-emerald-900 font-bold' : 'text-slate-800'
                            }`}>
                              {tarefa.titulo}
                            </span>
                          </button>
                        </div>

                        <div className="flex items-center gap-1 flex-shrink-0">
                          {tarefaConcluidaPorOutro && tarefa.dataConclusao ? (
                            <span className="text-[10px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded">
                              Outro RDO ({new Date(tarefa.dataConclusao + 'T00:00:00').toLocaleDateString('pt-BR')})
                            </span>
                          ) : isChecked ? (
                            <span className="text-[10px] bg-emerald-100 text-emerald-800 font-semibold px-1.5 py-0.5 rounded">
                              Checado neste RDO
                            </span>
                          ) : null}

                          {temSubs && (
                            <button
                              type="button"
                              onClick={() => toggleEditExpansaoTarefa(tarefa.id)}
                              className="text-slate-400 hover:text-slate-600 p-1"
                              title="Ver sub-tarefas"
                            >
                              {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Lista de Sub-tarefas da Tarefa */}
                      {temSubs && isExpanded && (
                        <div className="mt-2 pl-6 space-y-1.5 border-t border-slate-100 pt-2">
                          {subs.map(sub => {
                            const subChecadaPorEsteRdo = itensDesteRdo.some(i => i.tipo === 'SUBTAREFA' && i.subtarefaId === sub.id);
                            const subConcluidaPorOutro = sub.concluida && !subChecadaPorEsteRdo;
                            const subChecked = !!editSubtarefasSelecionadas[sub.id];

                            return (
                              <div 
                                key={sub.id} 
                                className="flex items-center justify-between text-xs py-0.5"
                              >
                                <button
                                  type="button"
                                  disabled={subConcluidaPorOutro}
                                  onClick={() => handleToggleEditSubtarefaCheck(tarefa.id, sub.id)}
                                  className={`flex items-center gap-1.5 text-left flex-1 min-w-0 ${
                                    subConcluidaPorOutro ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
                                  }`}
                                >
                                  {subConcluidaPorOutro ? (
                                    <CheckCircle2 className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                                  ) : subChecked ? (
                                    <CheckSquare className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                                  ) : (
                                    <Square className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                                  )}
                                  <span className={`truncate text-[11px] ${
                                    subConcluidaPorOutro 
                                      ? 'line-through text-slate-400' 
                                      : subChecked 
                                      ? 'text-emerald-900 font-bold' 
                                      : 'text-slate-600'
                                  }`}>
                                    {sub.titulo}
                                  </span>
                                </button>

                                {subConcluidaPorOutro && sub.dataConclusao && (
                                  <span className="text-[9px] text-slate-400 ml-1">
                                    {new Date(sub.dataConclusao + 'T00:00:00').toLocaleDateString('pt-BR')}
                                  </span>
                                )}

                                {subChecked && (
                                  <span className="text-[9px] text-emerald-700 bg-emerald-50 px-1 py-0.5 rounded font-medium ml-1">
                                    Checada
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Atividades Executadas (Resumo do Dia) *</label>
            <textarea 
              required 
              value={editResumo} 
              onChange={e => setEditResumo(e.target.value)} 
              rows={3} 
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500" 
              placeholder="Ex: Concretagem das vigas, alvenaria concluída, assentamento de blocos..."
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Ocorrências / Observações (Opcional)</label>
            <textarea 
              value={editEventos} 
              onChange={e => setEditEventos(e.target.value)} 
              rows={2} 
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500" 
              placeholder="Ex: Chuva leve das 14h às 15h sem interrupção de tarefas críticas..."
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Fotos do Dia</label>
            <div className="grid grid-cols-2 gap-2">
              <ImageUploader onImageSelected={setEditFoto1} label="Foto 1" preview={editFoto1} />
              <ImageUploader onImageSelected={setEditFoto2} label="Foto 2" preview={editFoto2} />
            </div>
          </div>

          <div className="flex gap-2 pt-1 flex-wrap">
            <button
              type="button"
              onClick={handleCancelEdit}
              className="flex-1 min-w-[80px] bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 rounded-xl transition-all text-xs cursor-pointer"
            >
              Cancelar
            </button>
            {diarioEmEdicao.statusConfirmacao === 'PENDENTE' ? (
              <>
                <button 
                  type="button"
                  onClick={(e) => handleSalvarEdicao(e, false)}
                  className="flex-1 min-w-[120px] bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 font-bold py-3 rounded-xl transition-all text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  Salvar Rascunho
                </button>
                <button 
                  type="button"
                  onClick={(e) => handleSalvarEdicao(e, true)}
                  className="flex-[2] min-w-[160px] bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-bold py-3 rounded-xl shadow-md transition-all text-xs flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  Salvar e Criar RDO
                </button>
              </>
            ) : (
              <button 
                type="submit" 
                className="flex-[2] min-w-[140px] bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white font-bold py-3 rounded-xl shadow-md transition-all text-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                Salvar Alterações do RDO
              </button>
            )}
          </div>
        </form>
      )}

      {/* ========================================================================= */}
      {/* FORMULÁRIO DE NOVO RDO */}
      {/* ========================================================================= */}
      {showNovo && !diarioEmEdicao && (
        <form onSubmit={handleSalvar} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-slate-800 text-base">Novo Registro Diário (RDO)</h3>
              <p className="text-xs text-slate-500">Apontamento das atividades e avanço do cronograma</p>
            </div>
            <button 
              type="button" 
              onClick={() => setShowNovo(false)} 
              className="text-slate-400 hover:text-slate-600 text-xs font-semibold px-2 py-1"
            >
              Cancelar
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Data do Registro *</label>
              <input 
                required 
                type="date" 
                value={data} 
                onChange={e => setData(e.target.value)} 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500" 
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Condição Climática</label>
              <select 
                value={clima} 
                onChange={e => setClima(e.target.value)} 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="SOL">Céu Claro / Sol</option>
                <option value="NUBLADO">Nublado</option>
                <option value="CHUVA">Chuva</option>
              </select>
            </div>
          </div>

          {/* Seção: Check de Tarefas e Subtarefas do Cronograma */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <ListChecks className="w-4 h-4 text-indigo-600" />
                Avanço do Cronograma (Check de Itens)
              </label>
              <div className="flex items-center gap-2">
                {(totalTarefasChecadas > 0 || totalSubsChecadas > 0) && (
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                    {totalTarefasChecadas} etapa(s), {totalSubsChecadas} sub-tarefa(s)
                  </span>
                )}
                {tarefasObra.length > 0 && (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={handleRecolherTodasTarefasNovo}
                      className="text-[10px] text-slate-500 hover:text-slate-800 bg-white border border-slate-200 px-1.5 py-0.5 rounded transition-colors cursor-pointer"
                      title="Recolher sub-tarefas"
                    >
                      Recolher
                    </button>
                    <button
                      type="button"
                      onClick={handleExpandirTodasTarefasNovo}
                      className="text-[10px] text-indigo-600 hover:text-indigo-800 bg-white border border-indigo-200 px-1.5 py-0.5 rounded transition-colors cursor-pointer"
                      title="Expandir todas as sub-tarefas"
                    >
                      Expandir
                    </button>
                  </div>
                )}
              </div>
            </div>

            <p className="text-[11px] text-slate-500 leading-normal">
              Marque as etapas ou sub-tarefas executadas hoje. A data do check registrada será <strong>{new Date(data + 'T00:00:00').toLocaleDateString('pt-BR')}</strong>.
            </p>

            {tarefasObra.length === 0 ? (
              <p className="text-xs text-slate-400 italic">Nenhuma etapa cadastrada no cronograma desta obra.</p>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {tarefasObra.map(tarefa => {
                  const jaConcluida = tarefa.status === 'CONCLUIDA';
                  const subs = tarefa.subtarefas || [];
                  const temSubs = subs.length > 0;
                  const isChecked = !!tarefasSelecionadas[tarefa.id];
                  const isExpanded = tarefasExpandidas[tarefa.id] ?? true;

                  return (
                    <div 
                      key={tarefa.id} 
                      className={`p-2.5 rounded-xl border transition-colors ${
                        isChecked 
                          ? 'bg-emerald-50/60 border-emerald-300' 
                          : jaConcluida 
                          ? 'bg-slate-100/60 border-slate-200' 
                          : 'bg-white border-slate-200'
                      }`}
                    >
                      {/* Linha da Tarefa Principal */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <button
                            type="button"
                            disabled={jaConcluida}
                            onClick={() => handleToggleTarefaCheck(tarefa.id)}
                            className={`flex items-center gap-2 text-left flex-1 min-w-0 ${
                              jaConcluida ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
                            }`}
                          >
                            {jaConcluida ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                            ) : isChecked ? (
                              <CheckSquare className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                            ) : (
                              <Square className="w-4 h-4 text-slate-400 flex-shrink-0" />
                            )}
                            <span className={`text-xs font-semibold truncate ${
                              jaConcluida ? 'line-through text-slate-500' : isChecked ? 'text-emerald-900' : 'text-slate-800'
                            }`}>
                              {tarefa.titulo}
                            </span>
                          </button>
                        </div>

                        <div className="flex items-center gap-1 flex-shrink-0">
                          {jaConcluida && tarefa.dataConclusao && (
                            <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded">
                              Concluída {new Date(tarefa.dataConclusao + 'T00:00:00').toLocaleDateString('pt-BR')}
                            </span>
                          )}

                          {temSubs && (
                            <button
                              type="button"
                              onClick={() => toggleExpansaoTarefa(tarefa.id)}
                              className="text-slate-400 hover:text-slate-600 p-1"
                              title="Ver sub-tarefas"
                            >
                              {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Lista de Sub-tarefas da Tarefa */}
                      {temSubs && isExpanded && (
                        <div className="mt-2 pl-6 space-y-1.5 border-t border-slate-100 pt-2">
                          {subs.map(sub => {
                            const subJaConcluida = sub.concluida;
                            const subChecked = !!subtarefasSelecionadas[sub.id];

                            return (
                              <div 
                                key={sub.id} 
                                className="flex items-center justify-between text-xs py-0.5"
                              >
                                <button
                                  type="button"
                                  disabled={subJaConcluida}
                                  onClick={() => handleToggleSubtarefaCheck(tarefa.id, sub.id)}
                                  className={`flex items-center gap-1.5 text-left flex-1 min-w-0 ${
                                    subJaConcluida ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
                                  }`}
                                >
                                  {subJaConcluida ? (
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                                  ) : subChecked ? (
                                    <CheckSquare className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                                  ) : (
                                    <Square className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                                  )}
                                  <span className={`truncate text-[11px] ${
                                    subJaConcluida 
                                      ? 'line-through text-slate-400' 
                                      : subChecked 
                                      ? 'text-emerald-900 font-medium' 
                                      : 'text-slate-600'
                                  }`}>
                                    {sub.titulo}
                                  </span>
                                </button>

                                {subJaConcluida && sub.dataConclusao && (
                                  <span className="text-[9px] text-slate-400 ml-1">
                                    {new Date(sub.dataConclusao + 'T00:00:00').toLocaleDateString('pt-BR')}
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Atividades Executadas (Resumo do Dia) *</label>
            <textarea 
              required 
              value={resumo} 
              onChange={e => setResumo(e.target.value)} 
              rows={3} 
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500" 
              placeholder="Ex: Concretagem das vigas, alvenaria concluída, assentamento de blocos..."
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Ocorrências / Observações (Opcional)</label>
            <textarea 
              value={eventos} 
              onChange={e => setEventos(e.target.value)} 
              rows={2} 
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500" 
              placeholder="Ex: Chuva leve das 14h às 15h sem interrupção de tarefas críticas..."
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Fotos do Dia</label>
            <div className="grid grid-cols-2 gap-2">
              <ImageUploader onImageSelected={setFoto1} label="Foto 1" preview={foto1} />
              <ImageUploader onImageSelected={setFoto2} label="Foto 2" preview={foto2} />
            </div>
          </div>

          <button 
            type="submit" 
            className="w-full bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white font-bold py-3.5 rounded-xl shadow-md transition-all text-xs flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            Salvar Diário
          </button>
        </form>
      )}

      {/* ========================================================================= */}
      {/* LISTA DE DIÁRIOS CADASTRADOS */}
      {/* ========================================================================= */}
      {/* Barra de Ações Rápidas: Contagem de RDOs & Botões de Expandir/Recolher */}
      {diarios.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white px-4 py-2.5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
            <FileText className="w-4 h-4 text-indigo-600" />
            <span>{diarios.length} {diarios.length === 1 ? 'relatório registrado' : 'relatórios registrados'}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleColapsarTodosDiarios}
              className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer active:scale-95"
              title="Recolher todos os RDOs para visualização compacta"
            >
              <ChevronsDownUp className="w-3.5 h-3.5 text-slate-500" />
              Recolher todos
            </button>
            <button
              type="button"
              onClick={handleExpandirTodosDiarios}
              className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer active:scale-95"
              title="Expandir todos os RDOs com fotos e detalhes"
            >
              <ChevronsUpDown className="w-3.5 h-3.5 text-indigo-600" />
              Expandir todos
            </button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {diarios.map(diario => {
          const isColapsado = isDiarioColapsado(diario.id);
          const isPendente = diario.statusConfirmacao === 'PENDENTE';
          const totalChecks = diario.itensChecados?.length || 0;
          const totalFotos = diario.fotosDia?.length || 0;
          const temEventos = !!diario.eventos?.trim();

          return (
            <div 
              key={diario.id} 
              className={`bg-white rounded-2xl transition-all ${
                isPendente 
                  ? 'border-2 border-amber-400/90 shadow-sm bg-amber-50/10' 
                  : 'border border-slate-100 hover:border-slate-200 shadow-sm'
              } ${
                isColapsado ? 'p-3.5 hover:shadow-md' : 'p-5'
              }`}
            >
              {/* Header do Card RDO */}
              <div className={`flex justify-between items-start ${isColapsado ? '' : 'mb-3 border-b border-slate-100 pb-3'}`}>
                <div 
                  onClick={() => toggleColapsarDiario(diario.id)}
                  className="flex items-center gap-3 cursor-pointer select-none flex-1 min-w-0 pr-2 group/rdoheader"
                >
                  <div className={`p-2 rounded-xl flex-shrink-0 transition-colors ${
                    isPendente 
                      ? 'bg-amber-100 text-amber-800 group-hover/rdoheader:bg-amber-200' 
                      : 'bg-indigo-50 text-indigo-600 group-hover/rdoheader:bg-indigo-100'
                  }`}>
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="flex items-center gap-1 font-bold text-slate-800 text-xs group-hover/rdoheader:text-indigo-600 transition-colors">
                        <Calendar className="w-3 h-3" /> {new Date(diario.data + 'T00:00:00').toLocaleDateString('pt-BR')}
                      </h3>
                      <div className="flex items-center gap-1 text-xs text-slate-500 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100">
                        {getClimaIcon(diario.clima)} 
                        <span className="capitalize">{diario.clima.toLowerCase()}</span>
                      </div>
                      {isPendente && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded-full animate-pulse">
                          <Sparkles className="w-3 h-3 text-amber-700" />
                          RDO Automático • Aguarda Confirmação
                        </span>
                      )}
                    </div>

                    {/* Se colapsado, mostra linha compacta de resumo */}
                    {isColapsado && (
                      <p className="text-xs text-slate-500 truncate mt-1 max-w-[550px]">
                        {diario.resumoDia}
                      </p>
                    )}
                  </div>
                </div>

                {/* Ações: Confirmar (se pendente), Editar, Excluir e Chevron Colapsar */}
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {/* {isPendente && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleConfirmarRdoDireto(diario.id);
                      }}
                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-xs transition-colors flex items-center gap-1 cursor-pointer shrink-0 active:scale-95"
                      title="Confirmar este Diário de Obra"
                    >
                      <Check className="w-3.5 h-3.5" />
                      Confirmar
                    </button>
                  )} */}
                  <button
                    type="button"
                    onClick={() => handleStartEdit(diario)}
                    className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer active:scale-95"
                    title="Editar este RDO"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDiarioParaExcluir(diario)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer active:scale-95"
                    title="Excluir este RDO"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleColapsarDiario(diario.id)}
                    className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer active:scale-95"
                    title={isColapsado ? "Expandir relatório completo" : "Recolher relatório"}
                  >
                    {isColapsado ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Badges de Resumo quando Colapsado */}
              {isColapsado && (
                <div 
                  onClick={() => toggleColapsarDiario(diario.id)}
                  className="mt-2.5 pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 cursor-pointer select-none"
                >
                  <div className="flex flex-wrap items-center gap-2 text-[11px]">
                    {isPendente && (
                      <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded-md font-bold text-[10px]">
                        <AlertTriangle className="w-3 h-3 text-amber-700" />
                        Pendente de confirmação
                      </span>
                    )}

                    {totalChecks > 0 && (
                      <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 border border-emerald-200/80 px-2 py-0.5 rounded-md font-semibold">
                        <CalendarCheck className="w-3 h-3 text-emerald-600" />
                        {totalChecks} {totalChecks === 1 ? 'avanço checado' : 'avanços checados'}
                      </span>
                    )}

                    {temEventos && (
                      <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-800 border border-amber-200/80 px-2 py-0.5 rounded-md font-medium">
                        <AlertTriangle className="w-3 h-3 text-amber-600" />
                        Ocorrência
                      </span>
                    )}

                    {totalFotos > 0 && (
                      <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-medium">
                        <Camera className="w-3 h-3 text-slate-500" />
                        {totalFotos} {totalFotos === 1 ? 'foto' : 'fotos'}
                      </span>
                    )}
                  </div>

                  <div className="text-[11px] text-indigo-600 font-semibold flex items-center gap-0.5 hover:underline">
                    <span>Ver detalhes</span>
                    <ChevronDown className="w-3 h-3" />
                  </div>
                </div>
              )}

              {/* Detalhes Completos quando Expandido */}
              {!isColapsado && (
                <div className="space-y-3 text-sm">
                  {/* Banner de Aviso de RDO Automático Pendente */}
                  {isPendente && (
                    <div className="p-3.5 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-300 rounded-xl flex items-center justify-between gap-3 text-xs text-amber-950">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="p-2 bg-amber-200 text-amber-900 rounded-lg shrink-0">
                          <Sparkles className="w-4 h-4 text-amber-800" />
                        </div>
                        <div className="min-w-0">
                          <span className="font-bold block text-slate-900">RDO Automático Gerado</span>
                          <span className="text-[11px] text-slate-600 block mt-0.5">
                            Gerado a partir das tarefas checadas no cronograma. Edite os detalhes caso queira ajustar antes de confirmar.
                          </span>
                        </div>
                      </div>
                      
                    </div>
                  )}
                  {/* Itens do Cronograma Checados no RDO */}
                  {diario.itensChecados && diario.itensChecados.length > 0 && (
                    <div className="bg-emerald-50/60 p-3 rounded-xl border border-emerald-200/70">
                      <div className="flex items-center justify-between gap-1 text-xs font-bold text-emerald-900 mb-2">
                        <div className="flex items-center gap-1.5">
                          <CalendarCheck className="w-4 h-4 text-emerald-600" />
                          <span>Avanço do Cronograma Checado neste Dia ({diario.itensChecados.length}):</span>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {diario.itensChecados.map((item, idx) => (
                          <div 
                            key={idx} 
                            className="inline-flex items-center gap-1.5 text-[11px] bg-white text-emerald-900 border border-emerald-200 px-2.5 py-1 rounded-lg shadow-2xs"
                          >
                            <CheckCircle2 className="w-3 h-3 text-emerald-600 flex-shrink-0" />
                            {item.tipo === 'SUBTAREFA' ? (
                              <span>
                                <span className="text-slate-500 font-normal">{item.tarefaTitulo} &gt; </span>
                                <strong>{item.subtarefaTitulo}</strong>
                              </span>
                            ) : (
                              <span><strong>{item.tarefaTitulo}</strong> (Etapa Concluída)</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <span className="font-bold text-slate-700 block mb-1 text-xs">Resumo das Atividades:</span>
                    <p className="text-slate-600 text-xs leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                      {diario.resumoDia}
                    </p>
                  </div>
                  
                  {diario.eventos && (
                    <div>
                      <span className="font-bold text-rose-700 block mb-1 text-xs">Ocorrências:</span>
                      <p className="text-slate-600 text-xs bg-rose-50/70 p-3 rounded-xl border border-rose-100">
                        {diario.eventos}
                      </p>
                    </div>
                  )}

                  {diario.fotosDia && diario.fotosDia.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-100">
                      <span className="font-bold text-slate-700 block mb-2 text-xs">Registros Fotográficos:</span>
                      <div className="flex gap-2 overflow-x-auto pb-1">
                        {diario.fotosDia.map((foto, idx) => (
                          <img 
                            key={idx} 
                            src={foto} 
                            alt={`Registro ${idx + 1}`} 
                            className="w-20 h-20 object-cover rounded-xl border border-slate-200 shadow-2xs" 
                          />
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleStartEdit(diario)}
                          className="px-2.5 py-1.5 bg-white hover:bg-amber-100 border border-amber-300 font-bold rounded-lg text-amber-900 transition-colors cursor-pointer text-xs flex items-center gap-1 shrink-0"
                        >
                          <Edit2 className="w-3 h-3" />
                          Revisar RDO
                        </button>
                        {/* <button
                          type="button"
                          onClick={() => handleConfirmarRdoDireto(diario.id)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-xs transition-colors cursor-pointer text-xs flex items-center gap-1 shrink-0"
                        >
                          <Check className="w-3.5 h-3.5" />
                          Confirmar
                        </button> */}
                      </div>
                </div>
              )}
            </div>
          );
        })}

        {diarios.length === 0 && !showNovo && !diarioEmEdicao && (
          <div className="text-center py-12 bg-white rounded-2xl border border-slate-100 p-6">
            <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-slate-500 font-medium text-sm">Nenhum diário de obra registrado ainda.</p>
            <button 
              onClick={() => setShowNovo(true)} 
              className="mt-3 text-indigo-600 font-semibold text-xs hover:underline"
            >
              Criar o primeiro RDO
            </button>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODAL DE CONFIRMAÇÃO DE EXCLUSÃO DE RDO */}
      {/* ========================================================================= */}
      {diarioParaExcluir && (
        <ModalConfirmacaoCiente
          isOpen={true}
          titulo={
            diarioParaExcluir.itensChecados && diarioParaExcluir.itensChecados.length > 0
              ? 'Excluir RDO e Desfazer Checks?'
              : 'Excluir Registro de RDO?'
          }
          subtitulo={`RDO do dia ${new Date(diarioParaExcluir.data + 'T00:00:00').toLocaleDateString('pt-BR')}`}
          descricao={
            diarioParaExcluir.itensChecados && diarioParaExcluir.itensChecados.length > 0 ? (
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800">
                  <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                  <span>Reversão Automática no Cronograma:</span>
                </div>
                <p className="text-[11px] text-slate-700 leading-relaxed">
                  Este RDO possui <strong>{diarioParaExcluir.itensChecados.length} item(ns)</strong> que foram concluídos por ele. Ao excluir, esses checks serão <strong>desfeitos</strong> e os itens voltarão ao status pendente:
                </p>
                <div className="max-h-28 overflow-y-auto space-y-1 pr-1">
                  {diarioParaExcluir.itensChecados.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-1.5 text-[10px] text-slate-700 bg-white p-1.5 rounded-lg border border-slate-200">
                      <Undo2 className="w-3 h-3 text-amber-600 flex-shrink-0" />
                      <span className="truncate">
                        {item.tipo === 'SUBTAREFA' 
                          ? `${item.tarefaTitulo} > ${item.subtarefaTitulo}` 
                          : `${item.tarefaTitulo} (Etapa Completa)`
                        }
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-600">
                Tem certeza de que deseja excluir este registro de diário? Esta ação é definitiva e não poderá ser revertida.
              </p>
            )
          }
          textoExigido="estou ciente"
          labelBotao={
            diarioParaExcluir.itensChecados && diarioParaExcluir.itensChecados.length > 0
              ? 'Excluir e Desfazer Checks'
              : 'Sim, Excluir Registro'
          }
          tipo="danger"
          icone={diarioParaExcluir.itensChecados && diarioParaExcluir.itensChecados.length > 0 ? 'undo' : 'trash'}
          onConfirm={handleConfirmarExclusao}
          onCancel={() => setDiarioParaExcluir(null)}
        />
      )}
    </div>
  );
}
