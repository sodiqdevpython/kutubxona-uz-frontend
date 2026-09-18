/**
 * Local AI (LLM) holati.
 *
 * AI xizmati hozircha ulanmagan. Har bir AI tugmasi bosilganda 60 sekund
 * kutib o'tirmaslik uchun backend holatni Redis'da keshlaydi, frontend esa
 * qo'shimcha ravishda 30 sekund xotirada saqlaydi.
 *
 * AI ulanmagan bo'lsa — tugma modal ko'rsatadi, so'rov yuborilmaydi.
 * AI ulangach hech narsani o'zgartirish shart emas: status `available: true`
 * bo'ladi va tugmalar odatdagidek ishlaydi.
 */
import { API_BASE } from './config';

export interface AiStatus {
  available: boolean;
  /** not_configured | unreachable | http_<kod> | ok */
  reason: string;
  base_url?: string;
}

const CACHE_MS = 30_000;

let cached: { at: number; value: AiStatus } | null = null;
let inflight: Promise<AiStatus> | null = null;

/** Backenddan AI holatini oladi (30 s keshlanadi). */
export async function getAiStatus(force = false): Promise<AiStatus> {
  if (!force && cached && Date.now() - cached.at < CACHE_MS) return cached.value;
  if (inflight) return inflight;

  inflight = (async () => {
    try {
      const res = await fetch(`${API_BASE}/api/ai/status/`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const value = (await res.json()) as AiStatus;
      cached = { at: Date.now(), value };
      return value;
    } catch {
      // Backendga ham yetib bo'lmadi — AI'ni ishlamayapti deb hisoblaymiz
      const value: AiStatus = { available: false, reason: 'unreachable' };
      cached = { at: Date.now(), value };
      return value;
    } finally {
      inflight = null;
    }
  })();

  return inflight;
}

/** Keshni tozalaydi (masalan, 503 javob kelganda). */
export function resetAiStatus() {
  cached = null;
}

/** Backenddan kelgan xato "AI ulanmagan" ga tegishlimi? */
export function isAiUnavailableError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err ?? '');
  return msg.includes('local_ai_unavailable')
      || msg.includes("Local AI xizmatiga ulanib bo'lmadi");
}

/** Sababni foydalanuvchi tiliga o'giradi. */
export function aiReasonText(reason?: string): string {
  switch (reason) {
    case 'not_configured':
      return "AI xizmatining manzili sozlanmagan (LOCAL_LLM_BASE_URL bo'sh).";
    case 'unreachable':
      return 'AI serveri javob bermayapti — o\'chirilgan yoki tarmoqda mavjud emas.';
    case 'ok':
      return 'AI xizmati ishlayapti.';
    default:
      if (reason?.startsWith('http_')) {
        return `AI serveri xato qaytardi (${reason.replace('http_', 'HTTP ')}).`;
      }
      return 'AI xizmatiga ulanib bo\'lmadi.';
  }
}
