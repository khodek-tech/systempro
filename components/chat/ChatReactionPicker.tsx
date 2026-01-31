'use client';

import { useState, useRef, useEffect } from 'react';
import { SmilePlus } from 'lucide-react';
import { ChatReactionType } from '@/types';
import { getAllReactions } from '@/features/chat';

interface ChatReactionPickerProps {
  onSelect: (type: ChatReactionType) => void;
}

export function ChatReactionPicker({ onSelect }: ChatReactionPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const reactions = getAllReactions();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleSelect = (type: ChatReactionType) => {
    onSelect(type);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
        title="Přidat reakci"
      >
        <SmilePlus className="w-4 h-4" />
      </button>

      {isOpen && (
        <div className="absolute bottom-full left-0 mb-1 bg-white border border-slate-200 rounded-lg shadow-lg p-1.5 flex gap-1 z-50 animate-in fade-in slide-in-from-bottom-1 duration-150">
          {reactions.map((reaction) => (
            <button
              key={reaction.type}
              onClick={() => handleSelect(reaction.type)}
              className="w-8 h-8 flex items-center justify-center hover:bg-slate-100 rounded-md transition-colors text-lg"
              title={reaction.type}
            >
              {reaction.emoji}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
