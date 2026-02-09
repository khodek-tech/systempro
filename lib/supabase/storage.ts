import { createClient } from './client';

const BUCKET = 'attachments';
const SIGNED_URL_EXPIRY = 3600; // 1 hour
const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB

interface UploadResult {
  success: boolean;
  url?: string;
  path?: string;
  error?: string;
}

/**
 * Upload a single file to Supabase Storage.
 * @param folder - e.g. 'chat/groupId' or 'tasks/taskId'
 * @param file - File object to upload
 */
export async function uploadFile(folder: string, file: File): Promise<UploadResult> {
  if (file.size > MAX_FILE_SIZE) {
    return { success: false, error: `Soubor je příliš velký (max ${formatBytes(MAX_FILE_SIZE)})` };
  }

  const supabase = createClient();
  const timestamp = Date.now();
  const uuid = crypto.randomUUID().slice(0, 8);
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const path = `${folder}/${timestamp}-${uuid}-${safeName}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, file);

  if (error) {
    console.error('Storage upload error:', error);
    return { success: false, error: error.message };
  }

  return { success: true, url: path, path };
}

/**
 * Upload multiple files in parallel.
 */
export async function uploadFiles(folder: string, files: File[]): Promise<UploadResult[]> {
  return Promise.all(files.map((file) => uploadFile(folder, file)));
}

/**
 * Delete a file from storage.
 */
export async function deleteFile(path: string): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();
  const { error } = await supabase.storage.from(BUCKET).remove([path]);

  if (error) {
    console.error('Storage delete error:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Get a signed URL for a private file (valid for 1 hour).
 */
export async function getSignedUrl(path: string): Promise<string | null> {
  const supabase = createClient();
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, SIGNED_URL_EXPIRY);

  if (error) {
    console.error('Signed URL error:', error);
    return null;
  }

  return data.signedUrl;
}

/**
 * Get total storage usage in bytes for the attachments bucket.
 */
export async function getStorageUsage(): Promise<number> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc('get_storage_usage');

  if (error) {
    console.error('Storage usage error:', error);
    return 0;
  }

  return (data as number) || 0;
}

/**
 * Format bytes to human-readable string (Czech locale).
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';

  const units = ['B', 'KB', 'MB', 'GB'];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const value = bytes / Math.pow(k, i);

  return `${value.toLocaleString('cs-CZ', { maximumFractionDigits: 1 })} ${units[i]}`;
}
