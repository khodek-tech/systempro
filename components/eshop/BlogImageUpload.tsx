'use client';

import { useRef, useState, useCallback } from 'react';
import Image from 'next/image';
import { ImageIcon, X, Upload } from 'lucide-react';

interface BlogImageUploadProps {
  imageUrl?: string;
  onUpload: (file: File) => Promise<{ success: boolean; url?: string }>;
  onRemove: () => void;
}

export function BlogImageUpload({ imageUrl, onUpload, onRemove }: BlogImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    async (file: File) => {
      if (!file.type.startsWith('image/')) return;
      setUploading(true);
      await onUpload(file);
      setUploading(false);
    },
    [onUpload],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
      e.target.value = '';
    },
    [handleFile],
  );

  if (imageUrl) {
    return (
      <div className="relative group">
        <Image
          src={imageUrl}
          alt="Náhledový obrázek"
          width={400}
          height={225}
          unoptimized
          className="w-full aspect-video object-cover rounded-xl border border-slate-200"
        />
        <button
          type="button"
          onClick={onRemove}
          className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div
      onClick={() => fileInputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      className={`flex flex-col items-center justify-center gap-2 py-8 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${
        dragOver ? 'border-emerald-400 bg-emerald-50' : 'border-slate-200 hover:border-slate-300 bg-slate-50'
      }`}
    >
      {uploading ? (
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      ) : (
        <>
          <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center">
            {dragOver ? (
              <Upload className="w-6 h-6 text-emerald-500" />
            ) : (
              <ImageIcon className="w-6 h-6 text-slate-400" />
            )}
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-slate-600">Klikněte nebo přetáhněte obrázek</p>
            <p className="text-xs text-slate-400 mt-1">PNG, JPG, WebP</p>
          </div>
        </>
      )}
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleChange} />
    </div>
  );
}
