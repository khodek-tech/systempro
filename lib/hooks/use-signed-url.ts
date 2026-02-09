import { useState, useEffect, useMemo } from 'react';
import { getSignedUrl } from '@/lib/supabase/storage';

/**
 * Checks if a URL is a storage path (not a full URL).
 */
function isStoragePath(url: string): boolean {
  return !url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('blob:') && !url.startsWith('data:');
}

/**
 * Hook that resolves a storage path to a signed URL.
 * If the URL is already a full URL (http/https/blob/data), returns it as-is.
 */
export function useSignedUrl(path: string | undefined): string | null {
  const needsResolution = useMemo(
    () => !!path && isStoragePath(path),
    [path]
  );

  const [resolvedUrl, setResolvedUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!needsResolution || !path) return;

    let cancelled = false;

    getSignedUrl(path).then((url) => {
      if (!cancelled) {
        setResolvedUrl(url);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [path, needsResolution]);

  if (!path) return null;
  if (!needsResolution) return path;
  return resolvedUrl;
}
