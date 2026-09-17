import React, { useState, useEffect, useRef } from 'react';
import { AlertTriangle, Undo2, Trash2, CheckCircle2, X } from 'lucide-react';

interface ModalConfirmacaoCienteProps {
  isOpen: boolean;
  titulo: string;
  subtitulo?: string;
  descricao: React.ReactNode;
  textoExigido?: string; // Padrão: "estou ciente"
  labelBotao?: string;
  tipo?: 'danger' | 'warning';
  icone?: 'trash' | 'undo' | 'alert';
  onConfirm: () => void;
  onCancel: () => void;
}

export function ModalConfirmacaoCiente({
  isOpen,
  titulo,
  subtitulo,
  descricao,
  textoExigido = 'estou ciente',
  labelBotao = 'Confirmar',
  tipo = 'danger',
  icone = 'alert',
  onConfirm,
  onCancel
}: ModalConfirmacaoCienteProps) {
  const [textoDigitado, setTextoDigitado] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Resetar texto digitado ao abrir modal e dar foco
  useEffect(() => {
    if (isOpen) {
      setTextoDigitado('');
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const fraseNormalizadaEsperada = textoExigido.trim().toLowerCase();
  const fraseNormalizadaDigitada = textoDigitado.trim().toLowerCase();
  const isConfirmado = fraseNormalizadaDigitada === fraseNormalizadaEsperada;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isConfirmado) {
      onConfirm();
    }
  };

  const getIcone = () => {
    switch (icone) {
      case 'trash':
        return <Trash2 className="w-5 h-5 text-rose-600" />;
      case 'undo':
        return <Undo2 className="w-5 h-5 text-amber-600" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-rose-600" />;
    }
  };

  const corFundoIcone = tipo === 'danger' ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600';
  const corBotao = tipo === 'danger' 
    ? 'bg-rose-600 hover:bg-rose-700 text-white' 
    : 'bg-amber-600 hover:bg-amber-700 text-white';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div 
        className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-100 space-y-4 animate-scaleUp"
        onClick={e => e.stopPropagation()}
      >
        {/* Cabeçalho */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className={`p-2.5 rounded-xl flex-shrink-0 mt-0.5 ${corFundoIcone}`}>
              {getIcone()}
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">{titulo}</h3>
              {subtitulo && <p className="text-xs text-slate-500 mt-0.5">{subtitulo}</p>}
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Descrição contextual */}
        <div className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-100 space-y-2">
          {descricao}
        </div>

        {/* Campo de confirmação textual com validação */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Para confirmar esta ação, digite exatamente: <span className="text-rose-600 font-mono font-bold bg-rose-50 px-1.5 py-0.5 rounded border border-rose-100">"{textoExigido}"</span>
            </label>
            <div className="relative">
              <input
                ref={inputRef}
                type="text"
                value={textoDigitado}
                onChange={e => setTextoDigitado(e.target.value)}
                placeholder={`Digite "${textoExigido}"`}
                className={`w-full text-xs px-3.5 py-2.5 rounded-xl border bg-slate-50 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-all ${
                  isConfirmado
                    ? 'border-emerald-400 ring-2 ring-emerald-400/30 bg-emerald-50/20'
                    : 'border-slate-200 focus:ring-indigo-500'
                }`}
              />
              {isConfirmado && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-600 flex items-center gap-1 text-[11px] font-semibold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Validado</span>
                </div>
              )}
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-xl transition-all text-xs"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!isConfirmado}
              className={`flex-1 py-2.5 rounded-xl font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-1.5 ${
                isConfirmado
                  ? `${corBotao} active:scale-[0.98] cursor-pointer`
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed opacity-70'
              }`}
            >
              {labelBotao}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
