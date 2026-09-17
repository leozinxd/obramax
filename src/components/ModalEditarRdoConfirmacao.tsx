import React, { useState, useEffect } from 'react';
import { DiarioObra, ClimaTempo } from '../types';
import { 
  X, 
  Check, 
  Sun, 
  Cloud, 
  CloudRain, 
  Camera, 
  Trash2, 
  FileText, 
  CalendarCheck, 
  Sparkles,
  Save,
  CheckCircle2
} from 'lucide-react';
import { fileToBase64 } from '../store';

interface ModalEditarRdoConfirmacaoProps {
  diario: DiarioObra | null;
  isOpen: boolean;
  onClose: () => void;
  onSalvarEConfirmar: (diarioAtualizado: DiarioObra) => void;
  onSalvarSemConfirmar?: (diarioAtualizado: DiarioObra) => void;
}

export function ModalEditarRdoConfirmacao({
  diario,
  isOpen,
  onClose,
  onSalvarEConfirmar,
  onSalvarSemConfirmar
}: ModalEditarRdoConfirmacaoProps) {
  const [data, setData] = useState('');
  const [clima, setClima] = useState<ClimaTempo>('SOL');
  const [resumo, setResumo] = useState('');
  const [eventos, setEventos] = useState('');
  const [fotos, setFotos] = useState<string[]>([]);
  const [isProcessandoFoto, setIsProcessandoFoto] = useState(false);

  useEffect(() => {
    if (diario) {
      setData(diario.data || new Date().toISOString().split('T')[0]);
      setClima(diario.clima || 'SOL');
      setResumo(diario.resumoDia || '');
      setEventos(diario.eventos || '');
      setFotos(diario.fotosDia ? [...diario.fotosDia] : []);
    }
  }, [diario, isOpen]);

  if (!isOpen || !diario) return null;

  const handleAddFoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsProcessandoFoto(true);
      const base64 = await fileToBase64(file);
      setFotos(prev => [...prev, base64]);
    } catch (err) {
      console.error("Erro ao converter foto:", err);
      alert("Não foi possível carregar a imagem.");
    } finally {
      setIsProcessandoFoto(false);
      e.target.value = '';
    }
  };

  const handleRemoverFoto = (indexParaRemover: number) => {
    setFotos(prev => prev.filter((_, idx) => idx !== indexParaRemover));
  };

  const buildDiarioAtualizado = (statusConfirmacao: 'CONFIRMADO' | 'PENDENTE'): DiarioObra => {
    return {
      ...diario,
      data,
      clima,
      resumoDia: resumo.trim() || 'RDO Automático',
      eventos: eventos.trim(),
      fotosDia: fotos,
      statusConfirmacao
    };
  };

  const handleSalvarApenas = (e: React.FormEvent) => {
    e.preventDefault();
    const atualizado = buildDiarioAtualizado('PENDENTE');
    if (onSalvarSemConfirmar) {
      onSalvarSemConfirmar(atualizado);
    } else {
      onSalvarEConfirmar(atualizado);
    }
    onClose();
  };

  const handleSalvarEConfirmarFinal = (e: React.FormEvent) => {
    e.preventDefault();
    const atualizado = buildDiarioAtualizado('CONFIRMADO');
    onSalvarEConfirmar(atualizado);
    onClose();
  };

  const itensChecados = diario.itensChecados || [];

  return (
    <div className="fixed inset-0 z-50 justify-center p-3 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col max-h-[80vh] my-auto">
        {/* Cabeçalho */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-purple-50 via-indigo-50/50 to-white">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-purple-100 text-purple-700 rounded-xl">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-slate-800 text-base flex items-center gap-1.5">
                Editar RDO Automático
              </h2>
              <p className="text-xs text-slate-500">
                Revise, altere ou complemente os dados antes de confirmar
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-white/80 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corpo com scroll */}
        <div className="p-4 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
          {/* Banner de status */}
          <div className="bg-amber-50 border border-amber-200/90 rounded-xl p-3 flex items-start gap-2.5 text-xs text-amber-900">
            <div className="p-1 bg-amber-100 rounded-lg text-amber-800 shrink-0 mt-0.5">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold block">Status: Aguardando Confirmação</span>
              <span>
                Este RDO foi gerado pelas tarefas do cronograma concluídas no dia. Você pode alterar qualquer informação livremente.
              </span>
            </div>
          </div>

          {/* Data e Clima */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Data do RDO</label>
              <input
                type="date"
                required
                value={data}
                onChange={e => setData(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Clima / Condição</label>
              <div className="relative">
                <select
                  value={clima}
                  onChange={e => setClima(e.target.value as ClimaTempo)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none pr-8"
                >
                  <option value="SOL">Céu Claro / Sol</option>
                  <option value="NUBLADO">Nublado</option>
                  <option value="CHUVA">Chuva</option>
                </select>
                <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
                  {clima === 'SOL' && <Sun className="w-4 h-4 text-amber-500" />}
                  {clima === 'NUBLADO' && <Cloud className="w-4 h-4 text-slate-400" />}
                  {clima === 'CHUVA' && <CloudRain className="w-4 h-4 text-blue-500" />}
                </div>
              </div>
            </div>
          </div>

          {/* Tarefas Checadas Vinculadas */}
          {itensChecados.length > 0 && (
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <CalendarCheck className="w-3.5 h-3.5 text-emerald-600" />
                  Tarefas Checadas neste RDO ({itensChecados.length})
                </span>
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded">
                  Concluídas no Cronograma
                </span>
              </div>
              <div className="space-y-1 pt-1 max-h-32 overflow-y-auto pr-1">
                {itensChecados.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-[11px] bg-white p-1.5 rounded-lg border border-slate-100">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span className="text-slate-700 truncate">
                      {item.tipo === 'SUBTAREFA' ? (
                        <>
                          <strong className="text-slate-900">{item.subtarefaTitulo}</strong> (Etapa: {item.tarefaTitulo})
                        </>
                      ) : (
                        <strong className="text-slate-900">{item.tarefaTitulo}</strong>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Resumo do Dia */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Resumo das Atividades do Dia *
            </label>
            <input
              type="text"
              required
              value={resumo}
              onChange={e => setResumo(e.target.value)}
              placeholder="Ex: Execução de formas e avanço de sapatas"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Detalhes / Anotações */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Eventos, Equipes & Anotações Adicionais
            </label>
            <textarea
              value={eventos}
              onChange={e => setEventos(e.target.value)}
              rows={4}
              placeholder="Observações da obra, equipes presentes, ocorrências..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Galeria de Fotos */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5 text-indigo-600" />
                Fotos do Dia ({fotos.length})
              </label>
              <label className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2 py-1 rounded-lg cursor-pointer transition-colors flex items-center gap-1">
                <Camera className="w-3 h-3" />
                Adicionar Foto
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handleAddFoto}
                  disabled={isProcessandoFoto}
                />
              </label>
            </div>

            {fotos.length === 0 ? (
              <div className="p-4 border-2 border-dashed border-slate-200 rounded-xl text-center bg-slate-50/50">
                <Camera className="w-6 h-6 text-slate-300 mx-auto mb-1" />
                <p className="text-xs text-slate-500 font-medium">Nenhuma foto anexada</p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Fotos tiradas no check das tarefas aparecem aqui automaticamente, ou você pode adicionar mais fotos agora.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {fotos.map((foto, idx) => (
                  <div key={idx} className="relative group rounded-xl overflow-hidden border border-slate-200 bg-slate-100 aspect-video">
                    <img
                      src={foto}
                      alt={`Foto ${idx + 1}`}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoverFoto(idx)}
                      className="absolute top-1 right-1 p-1 bg-rose-600/90 text-white rounded-lg opacity-80 hover:opacity-100 hover:bg-rose-700 transition-all cursor-pointer shadow-xs"
                      title="Remover foto"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Rodapé com Ações */}
        <div className="p-3.5 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-2">
        {/*   <button
            type="button"
            onClick={onClose}
            className="px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer shrink-0"
          >
            Cancelar
          </button> */}

          <div className="flex items-center gap-2">
            {onSalvarSemConfirmar && (
              <button
                type="button"
                onClick={handleSalvarApenas}
                className="px-3 py-2 text-xs font-bold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 shrink-0"
              >
                <Save className="w-3.5 h-3.5" />
                Salvar Rascunho
              </button>
            )}

            <button
              type="button"
              onClick={handleSalvarEConfirmarFinal}
              className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs hover:shadow transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
            >
              <Check className="w-4 h-4" />
              Salvar e Criar RDO
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
