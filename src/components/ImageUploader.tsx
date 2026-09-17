import React, { useState, useEffect } from 'react';
import { Camera, Image as ImageIcon, Loader2, X } from 'lucide-react';
import { fileToBase64 } from '../store';

interface ImageUploaderProps {
  onImageSelected: (base64: string) => void;
  label?: string;
  preview?: string;
}

export function ImageUploader({ onImageSelected, label = "Anexar Foto", preview }: ImageUploaderProps) {
  const [localPreview, setLocalPreview] = useState<string | null>(preview || null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  useEffect(() => {
    setLocalPreview(preview || null);
  }, [preview]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        setIsProcessing(true);
        const base64 = await fileToBase64(file);
        if (base64) {
          setLocalPreview(base64);
          onImageSelected(base64);
        }
      } catch (error) {
        console.error("Erro ao processar imagem:", error);
        alert("Não foi possível processar a imagem selecionada. Tente outra foto.");
      } finally {
        setIsProcessing(false);
        e.target.value = '';
      }
    }
  };

  return (
    <div className="flex flex-col items-start gap-2 w-full">
      <label className={`relative flex flex-col items-center justify-center w-full h-32 border-2 border-slate-300 border-dashed rounded-xl cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors overflow-hidden ${
        isProcessing ? 'opacity-70 pointer-events-none' : ''
      }`}>
        {isProcessing ? (
          <div className="flex flex-col items-center justify-center text-indigo-600 gap-2 p-4 text-center">
            <Loader2 className="w-7 h-7 animate-spin" />
            <p className="text-xs font-semibold text-slate-700">Otimizando e preparando foto...</p>
          </div>
        ) : localPreview ? (
          <img src={localPreview} alt="Preview" className="w-full h-full object-cover" />
        ) : (
          <div className="flex flex-col items-center justify-center pt-5 pb-6 text-slate-500">
            <Camera className="w-8 h-8 mb-2" />
            <p className="text-sm font-semibold">{label}</p>
            <p className="text-xs text-slate-400 mt-1">Clique ou toque para tirar foto ou escolher da galeria</p>
          </div>
        )}
        <input 
          type="file" 
          className="hidden" 
          accept="image/*" 
          disabled={isProcessing}
          onChange={handleFileChange} 
        />
      </label>
      {localPreview && !isProcessing && (
        <button 
          type="button"
          onClick={() => {
            setLocalPreview(null);
            onImageSelected('');
          }}
          className="text-xs text-rose-500 hover:text-rose-700 font-medium px-2 py-1 cursor-pointer transition-colors flex items-center gap-1"
        >
          <X className="w-3.5 h-3.5" />
          Remover imagem
        </button>
      )}
    </div>
  );
}
