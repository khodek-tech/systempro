/**
 * Fetch with automatic retry on network errors.
 *
 * Vercel serverless cold starts can cause the first fetch to an external
 * server to fail with transient DNS or connection errors. This wrapper
 * retries once on network-level failures (not HTTP errors).
 */
export async function fetchWithRetry(
  url: string,
  options: RequestInit,
  maxRetries = 1
): Promise<Response> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fetch(url, options);
    } catch (error) {
      lastError = error;
      // Only retry on network-level errors, not abort signals from user
      if (attempt < maxRetries) {
        // Small delay before retry
        await new Promise((r) => setTimeout(r, 500));
      }
    }
  }

  throw lastError;
}
