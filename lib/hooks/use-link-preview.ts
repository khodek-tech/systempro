'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { LinkPreview } from '@/types';

// Module-level cache — persists across re-renders and component instances
const cache = new Map<string, LinkPreview | null>();
const pendingRequests = new Map<string, Promise<LinkPreview | null>>();

async function fetchPreview(url: string): Promise<LinkPreview | null> {
  // Return from cache
  if (cache.has(url)) return cache.get(url)!;

  // Deduplicate in-flight requests
  const pending = pendingRequests.get(url);
  if (pending) return pending;

  const promise = (async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase.functions.invoke('fetch-link-preview', {
        body: { url },
      });

      if (error || !data?.title) {
        cache.set(url, null);
        return null;
      }

      const preview: LinkPreview = {
        url: data.url,
        title: data.title,
        description: data.description,
        image: data.image,
        siteName: data.siteName,
        favicon: data.favicon,
      };

      cache.set(url, preview);
      return preview;
    } catch {
      cache.set(url, null);
      return null;
    } finally {
      pendingRequests.delete(url);
    }
  })();

  pendingRequests.set(url, promise);
  return promise;
}

export function useLinkPreview(url: string | null): LinkPreview | null {
  const [preview, setPreview] = useState<LinkPreview | null>(() => {
    if (!url) return null;
    return cache.get(url) ?? null;
  });

  useEffect(() => {
    if (!url || cache.has(url)) return;

    let cancelled = false;

    fetchPreview(url).then((result) => {
      if (!cancelled) {
        setPreview(result);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [url]);

  return preview;
}
