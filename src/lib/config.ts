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
 * HTTPS sahifada http:// havolani https:// ga ko'taradi.
 *
 * Backend proksi ortida turganda `build_absolute_uri()` ba'zan http:// li
 * manzil qaytaradi. Brauzer bunday faylni HTTPS sahifada bloklaydi
 * («Mixed Content»), natijada PDF ochilmaydi. Shuning uchun mijoz tomonda
 * ham himoya qo'yamiz — backend to'g'rilanmaguncha ishlab turadi.
 */
export function secureUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (typeof window === 'undefined') return url;
  if (window.location.protocol !== 'https:') return url;
  return url.replace(/^http:\/\//i, 'https://');
}

/**
 * Media URL'ni to'liq holga keltiradi.
 * HTTP javoblarda absolyut URL keladi, WebSocket hodisalarida esa nisbiy
 * (`/media/…`) — chunki u yerda `request` konteksti yo'q.
 */
export function mediaUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.startsWith('data:') || url.startsWith('blob:')) return url;
  if (/^https?:\/\//i.test(url)) return secureUrl(url);
  return secureUrl(`${apiOrigin()}${url.startsWith('/') ? '' : '/'}${url}`);
}
