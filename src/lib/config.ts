// ── API manzillari ───────────────────────────────────────────────────────────
// Docker'da frontend nginx backend'ni proksilaydi, shuning uchun VITE_API_URL
// bo'sh bo'ladi va barcha so'rovlar bir xil origin'ga ketadi.
// Lokal `npm run dev` da esa .env dagi http://localhost:8000 ishlatiladi.

export const API_BASE = (import.meta.env.VITE_API_URL ?? 'http://localhost:8000') as string;

/** Absolyut origin — `new URL(path, origin)` uchun. */
export function apiOrigin(): string {
  if (API_BASE) return API_BASE;
  return typeof window !== 'undefined' ? window.location.origin : 'http://localhost:8000';
}

/** ws:// yoki wss:// bazasi — API_BASE dan kelib chiqib. */
export function wsBase(): string {
  const origin = apiOrigin();
  return origin.replace(/^http/, 'ws');
}

/**
 * Media URL'ni to'liq holga keltiradi.
 * HTTP javoblarda absolyut URL keladi, WebSocket hodisalarida esa nisbiy
 * (`/media/…`) — chunki u yerda `request` konteksti yo'q.
 */
export function mediaUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (/^https?:\/\//i.test(url) || url.startsWith('data:') || url.startsWith('blob:')) return url;
  return `${apiOrigin()}${url.startsWith('/') ? '' : '/'}${url}`;
}
