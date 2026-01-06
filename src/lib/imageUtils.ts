/**
 * Normalizes image URLs to prevent double-prefixing with Supabase storage URLs.
 * Handles cases where:
 * - URL is already a full Supabase URL
 * - URL is a relative path that needs the Supabase prefix
 * - URL is an external URL (http/https)
 * - URL is a local asset
 */
export function normalizeImageUrl(url: string | null | undefined): string {
  if (!url) return '/placeholder.svg';
  
  const urlStr = String(url).trim();
  if (!urlStr) return '/placeholder.svg';
  
  // If it's already a full URL (http/https), return as-is
  if (urlStr.startsWith('http://') || urlStr.startsWith('https://')) {
    // Check for double Supabase URL issue
    // e.g., "https://xxx.supabase.co/storage/v1/object/public/properties/https://xxx.supabase.co/..."
    const supabaseMatch = urlStr.match(/https:\/\/[^/]+\.supabase\.co\/storage\/v1\/object\/public\/[^/]+\/(https:\/\/)/);
    if (supabaseMatch) {
      // Extract the inner URL
      const innerUrlStart = urlStr.indexOf(supabaseMatch[1]);
      return urlStr.slice(innerUrlStart);
    }
    return urlStr;
  }
  
  // If it starts with /, it's a local path
  if (urlStr.startsWith('/')) {
    return urlStr;
  }
  
  // Otherwise, it might be a relative Supabase storage path
  // But we shouldn't auto-prefix - just return as is and let it fail gracefully
  return urlStr;
}

/**
 * Get the first valid image URL from an images array
 */
export function getFirstImage(images: string[] | null | undefined, fallback = '/placeholder.svg'): string {
  if (!images || !Array.isArray(images) || images.length === 0) {
    return fallback;
  }
  return normalizeImageUrl(images[0]) || fallback;
}
