'use client';

import { DndContext, closestCenter, type DragEndEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Plus, LayoutGrid } from 'lucide-react';
import { useEshopPageBuilderStore } from '@/stores/eshop-page-builder-store';
import { PageBlockCard } from './PageBlockCard';
import { BlockEditorModal } from './BlockEditorModal';
import { BlockTypePicker } from './BlockTypePicker';

export function PageBlockList() {
  const {
    getBlocksForCurrentPage,
    getBlockTypeById,
    openBlockEditor,
    openBlockTypePicker,
    isBlockEditorOpen,
    isBlockTypePickerOpen,
    deletePageBlock,
    toggleBlockActive,
    duplicateBlock,
    reorderBlocks,
  } = useEshopPageBuilderStore();

  const blocks = getBlocksForCurrentPage();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = blocks.findIndex((b) => b.id === active.id);
    const newIndex = blocks.findIndex((b) => b.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = [...blocks];
    const [moved] = reordered.splice(oldIndex, 1);
    reordered.splice(newIndex, 0, moved);

    reorderBlocks(reordered.map((b) => b.id));
  };

  if (blocks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-20 h-20 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
          <LayoutGrid className="w-10 h-10 text-slate-300" />
        </div>
        <p className="text-lg font-semibold text-slate-600 mb-1">Žádné bloky</p>
        <p className="text-sm text-slate-400 mb-6">Přidejte první blok na stránku</p>
        <button
          onClick={openBlockTypePicker}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors active:scale-[0.98]"
        >
          <Plus className="w-5 h-5" />
          Přidat blok
        </button>
        {isBlockTypePickerOpen && <BlockTypePicker />}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
          {blocks.map((block) => (
            <PageBlockCard
              key={block.id}
              block={block}
              blockType={getBlockTypeById(block.blockTypeId)}
              onEdit={() => openBlockEditor(block.id)}
              onDuplicate={() => duplicateBlock(block.id)}
              onDelete={() => deletePageBlock(block.id)}
              onToggleActive={() => toggleBlockActive(block.id)}
            />
          ))}
        </SortableContext>
      </DndContext>

      {/* Add block button */}
      <button
        onClick={openBlockTypePicker}
        className="w-full flex items-center justify-center gap-2 p-4 rounded-xl border-2 border-dashed border-slate-200 text-slate-400 hover:border-emerald-300 hover:text-emerald-600 hover:bg-emerald-50/30 transition-all font-medium"
      >
        <Plus className="w-5 h-5" />
        Přidat blok
      </button>

      {/* Modals */}
      {isBlockEditorOpen && <BlockEditorModal />}
      {isBlockTypePickerOpen && <BlockTypePicker />}
    </div>
  );
}
