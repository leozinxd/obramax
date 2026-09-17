import React, { useState, useEffect } from 'react';
import { Camera, Image as ImageIcon } from 'lucide-react';
import { fileToBase64 } from '../store';

interface ImageUploaderProps {
  onImageSelected: (base64: string) => void;
  label?: string;
  preview?: string;
}

export function ImageUploader({ onImageSelected, label = "Anexar Foto", preview }: ImageUploaderProps) {
  const [localPreview, setLocalPreview] = useState<string | null>(preview || null);

  useEffect(() => {
    setLocalPreview(preview || null);
  }, [preview]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const base64 = await fileToBase64(file);
        setLocalPreview(base64);
        onImageSelected(base64);
      } catch (error) {
        console.error("Error converting file to base64", error);
        alert("Erro ao processar a imagem.");
      }
    }
  };

  return (
    <div className="flex flex-col items-start gap-2 w-full">
      <label className="relative flex flex-col items-center justify-center w-full h-32 border-2 border-slate-300 border-dashed rounded-xl cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors overflow-hidden">
        {localPreview ? (
          <img src={localPreview} alt="Preview" className="w-full h-full object-cover" />
        ) : (
          <div className="flex flex-col items-center justify-center pt-5 pb-6 text-slate-500">
            <Camera className="w-8 h-8 mb-2" />
            <p className="text-sm font-semibold">{label}</p>
            <p className="text-xs text-slate-400 mt-1">Toque para abrir a câmera/galeria</p>
          </div>
        )}
        <input 
          type="file" 
          className="hidden" 
          accept="image/*" 
          capture="environment" // Suggests back camera on mobile
          onChange={handleFileChange} 
        />
      </label>
      {localPreview && (
        <button 
          type="button"
          onClick={() => {
            setLocalPreview(null);
            onImageSelected('');
          }}
          className="text-xs text-rose-500 hover:text-rose-700 font-medium px-2 py-1 cursor-pointer transition-colors"
        >
          Remover imagem
        </button>
      )}
    </div>
  );
}
