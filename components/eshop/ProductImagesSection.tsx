'use client';

import { useRef, useState } from 'react';
import { Upload, Trash2, Star, Image as ImageIcon } from 'lucide-react';
import { useEshopProduktyStore } from '@/stores/eshop-produkty-store';

interface Props {
  productId: number;
}

export function ProductImagesSection({ productId }: Props) {
  const { getImagesForProduct, uploadProductImage, deleteProductImage, setMainImage } = useEshopProduktyStore();
  const images = getImagesForProduct(productId);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    for (const file of Array.from(files)) {
      await uploadProductImage(productId, file);
    }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Smazat obrázek?')) return;
    await deleteProductImage(id);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    handleUpload(e.dataTransfer.files);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-base font-semibold text-slate-800">Obrázky ({images.length})</h3>

      {/* Upload zone */}
      <div
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer ${
          uploading ? 'border-emerald-400 bg-emerald-50' : 'border-slate-300 hover:border-emerald-400 hover:bg-emerald-50/50'
        }`}
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
      >
        <Upload className={`w-8 h-8 mx-auto mb-2 ${uploading ? 'text-emerald-500 animate-pulse' : 'text-slate-400'}`} />
        <p className="text-sm font-medium text-slate-600">
          {uploading ? 'Nahrávám...' : 'Klikněte nebo přetáhněte obrázky'}
        </p>
        <p className="text-xs text-slate-400 mt-1">JPG, PNG, WebP</p>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => handleUpload(e.target.files)}
        />
      </div>

      {/* Gallery */}
      {images.length > 0 && (
        <div className="grid grid-cols-4 gap-3">
          {images.map((img) => (
            <div key={img.id} className="relative group rounded-xl overflow-hidden border border-slate-200 aspect-square bg-slate-50">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.url}
                alt={img.altText ?? 'Obrázek produktu'}
                className="w-full h-full object-cover"
              />

              {/* Main badge */}
              {img.isMain && (
                <span className="absolute top-2 left-2 bg-amber-500 text-white px-2 py-0.5 rounded-md text-xs font-bold flex items-center gap-1">
                  <Star className="w-3 h-3" />
                  Hlavní
                </span>
              )}

              {/* Actions overlay */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                {!img.isMain && (
                  <button
                    onClick={() => setMainImage(img.id, productId)}
                    className="p-2 rounded-lg bg-white/90 text-amber-600 hover:bg-white transition-colors"
                    title="Nastavit jako hlavní"
                  >
                    <Star className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => handleDelete(img.id)}
                  className="p-2 rounded-lg bg-white/90 text-red-600 hover:bg-white transition-colors"
                  title="Smazat"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {images.length === 0 && (
        <div className="text-center py-4">
          <ImageIcon className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-sm text-slate-400">Zatím žádné obrázky</p>
        </div>
      )}
    </div>
  );
}
