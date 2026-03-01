'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  GripVertical,
  Pencil,
  Copy,
  Trash2,
  ImageIcon,
  Grid3x3,
  GalleryHorizontal,
  Type,
  FolderTree,
  Mail,
  CheckCircle,
  Megaphone,
  HelpCircle,
  Star,
} from 'lucide-react';
import type { PageBlock, BlockType } from '@/shared/types';

const BLOCK_TYPE_ICONS: Record<string, React.ReactNode> = {
  hero_banner: <ImageIcon className="w-5 h-5" />,
  produkt_grid: <Grid3x3 className="w-5 h-5" />,
  produkt_carousel: <GalleryHorizontal className="w-5 h-5" />,
  text_blok: <Type className="w-5 h-5" />,
  kategorie_sekce: <FolderTree className="w-5 h-5" />,
  newsletter: <Mail className="w-5 h-5" />,
  vyhody: <CheckCircle className="w-5 h-5" />,
  banner: <Megaphone className="w-5 h-5" />,
  faq: <HelpCircle className="w-5 h-5" />,
  recenze: <Star className="w-5 h-5" />,
};

function getBlockPreview(blockType: BlockType, config: Record<string, unknown>): string {
  const slug = blockType.slug;
  switch (slug) {
    case 'hero_banner':
      return (config.nadpis as string) || 'Bez nadpisu';
    case 'produkt_grid':
      return `${(config.nadpis as string) || 'Produkty'} (${config.pocet_produktu ?? 4} produktů)`;
    case 'produkt_carousel':
      return `${(config.nadpis as string) || 'Carousel'} (${config.pocet_produktu ?? 8} produktů)`;
    case 'text_blok': {
      const text = (config.obsah as string) || '';
      return text.length > 60 ? text.slice(0, 60) + '...' : text || 'Prázdný text';
    }
    case 'kategorie_sekce':
      return (config.nadpis as string) || 'Kategorie';
    case 'newsletter':
      return (config.nadpis as string) || 'Newsletter';
    case 'vyhody': {
      const items = (config.polozky as Array<Record<string, unknown>>) || [];
      return `${items.length} položek`;
    }
    case 'banner':
      return (config.text as string) || 'Banner';
    case 'faq': {
      const faqItems = (config.polozky as Array<Record<string, unknown>>) || [];
      return `${(config.nadpis as string) || 'FAQ'} (${faqItems.length} otázek)`;
    }
    case 'recenze': {
      const reviews = (config.polozky as Array<Record<string, unknown>>) || [];
      return `${(config.nadpis as string) || 'Recenze'} (${reviews.length} recenzí)`;
    }
    default:
      return Object.keys(config).length > 0 ? `${Object.keys(config).length} polí` : 'Prázdná konfigurace';
  }
}

interface PageBlockCardProps {
  block: PageBlock;
  blockType: BlockType | undefined;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onToggleActive: () => void;
}

export function PageBlockCard({ block, blockType, onEdit, onDuplicate, onDelete, onToggleActive }: PageBlockCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: block.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 p-4 bg-white border border-slate-200 rounded-xl transition-all ${
        isDragging ? 'shadow-lg opacity-80 z-50' : 'shadow-sm hover:shadow-md'
      } ${!block.active ? 'opacity-60' : ''}`}
    >
      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        className="flex-shrink-0 p-1 rounded cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-600 touch-none"
        aria-label="Přetáhnout"
      >
        <GripVertical className="w-5 h-5" />
      </button>

      {/* Icon */}
      <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${block.active ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
        {blockType ? (BLOCK_TYPE_ICONS[blockType.slug] ?? <Grid3x3 className="w-5 h-5" />) : <Grid3x3 className="w-5 h-5" />}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-slate-800 text-sm">
          {blockType?.name ?? `Typ #${block.blockTypeId}`}
        </div>
        <div className="text-xs text-slate-500 truncate mt-0.5">
          {blockType ? getBlockPreview(blockType, block.config) : ''}
        </div>
      </div>

      {/* Toggle active */}
      <button
        onClick={onToggleActive}
        className={`flex-shrink-0 w-10 h-6 rounded-full transition-colors relative ${block.active ? 'bg-emerald-500' : 'bg-slate-300'}`}
        aria-label={block.active ? 'Deaktivovat' : 'Aktivovat'}
      >
        <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${block.active ? 'translate-x-4.5' : 'translate-x-0.5'}`} />
      </button>

      {/* Actions */}
      <div className="flex-shrink-0 flex items-center gap-1">
        <button
          onClick={onEdit}
          className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
          aria-label="Upravit"
        >
          <Pencil className="w-4 h-4" />
        </button>
        <button
          onClick={onDuplicate}
          className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
          aria-label="Duplikovat"
        >
          <Copy className="w-4 h-4" />
        </button>
        <button
          onClick={onDelete}
          className="p-2 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors"
          aria-label="Smazat"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
