'use client';

import { useState } from 'react';
import Image from 'next/image';
import type { LinkPreview } from '@/types';

interface LinkPreviewCardProps {
  preview: LinkPreview;
}

export function LinkPreviewCard({ preview }: LinkPreviewCardProps) {
  const [imageError, setImageError] = useState(false);
  const [faviconError, setFaviconError] = useState(false);

  const hostname = (() => {
    try {
      return new URL(preview.url).hostname.replace(/^www\./, '');
    } catch {
      return preview.url;
    }
  })();

  return (
    <a
      href={preview.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block max-w-sm border border-slate-200 rounded-xl overflow-hidden mt-2 hover:bg-slate-50 transition-colors duration-200"
    >
      {preview.image && !imageError && (
        <div className="relative w-full h-36">
          <Image
            src={preview.image}
            alt=""
            fill
            className="object-cover"
            unoptimized
            onError={() => setImageError(true)}
          />
        </div>
      )}
      <div className="p-3 space-y-1">
        <div className="flex items-center gap-1.5">
          {preview.favicon && !faviconError && (
            <Image
              src={preview.favicon}
              alt=""
              width={16}
              height={16}
              className="rounded-sm flex-shrink-0"
              unoptimized
              onError={() => setFaviconError(true)}
            />
          )}
          <span className="text-xs text-slate-400 truncate">
            {preview.siteName || hostname}
          </span>
        </div>
        <p className="text-sm font-semibold text-slate-800 line-clamp-2">
          {preview.title}
        </p>
        {preview.description && (
          <p className="text-xs text-slate-500 line-clamp-2">
            {preview.description}
          </p>
        )}
      </div>
    </a>
  );
}
