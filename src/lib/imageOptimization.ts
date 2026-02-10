/**
 * Transforms a Supabase Storage public URL to use the image transformation API
 * for serving optimized, resized images.
 */
export function getOptimizedImageUrl(
  originalUrl: string,
  width: number,
  quality: number = 75
): string {
  if (!originalUrl) return originalUrl;

  // Only transform Supabase Storage URLs
  const match = originalUrl.match(
    /^(https:\/\/[^/]+\/storage\/v1\/)object\/(public\/.+)$/
  );
  if (!match) return originalUrl;

  const [, base, path] = match;
  return `${base}render/image/${path}?width=${width}&quality=${quality}`;
}
