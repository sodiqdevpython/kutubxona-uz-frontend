/**
 * Kelgan maqola kartasi uchun hisoblanadigan holatlar (Figma: TAYYOR / AI TO'LDIRDI / TO'LIQSIZ).
 */
import type { AdminSubmission } from './admin-api';

export type Readiness = 'ready' | 'ai' | 'incomplete';

export function readiness(s: AdminSubmission): Readiness {
  if (!s.title || !s.abstract) return 'incomplete';
  return s.ai_filled ? 'ai' : 'ready';
}

export const READINESS_LABEL: Record<Readiness, string> = {
  ready: 'Tayyor', ai: "AI to'ldirdi", incomplete: "To'liqsiz",
};

export function readinessNote(s: AdminSubmission): string {
  switch (readiness(s)) {
    case 'ready':      return "Metama'lumot to'liq — songa biriktirib tasdiqlash mumkin.";
    case 'ai':         return "AI to'ldirgan maydonlarni tekshirib chiqing.";
    case 'incomplete': return s.source_file_url
      ? "Metama'lumot to'liq emas. AI bilan to'ldiring yoki qo'lda kiriting."
      : "Fayl yo'q — muallif faylni yubormagan.";
  }
}

/** Annotatsiya tillari: «UZ · RU · EN» (matn yozuvidan taxmin) */
export function abstractLangs(text: string): string[] {
  const t = (text || '').trim();
  if (!t) return [];
  const out: string[] = [];
  const cyr = (t.match(/[а-яё]/gi) || []).length;
  const lat = (t.match(/[a-z]/gi) || []).length;
  if (cyr > 20) out.push(/[ўқғҳ]/i.test(t) ? 'ЎЗ' : 'RU');
  if (lat > 20) out.push(/\b(the|and|of|in|for|with|this|study|library)\b/i.test(t) ? 'EN' : 'UZ');
  return out;
}

/** Adabiyotlar ro'yxatidagi manbalar soni (qatorlar bo'yicha) */
export function refsCount(text: string): number {
  const lines = (text || '').split(/\n+/).map(l => l.trim()).filter(Boolean);
  const numbered = lines.filter(l => /^(\d+[.)]|\[\d+\]|[-•–])/.test(l));
  return numbered.length || lines.length;
}

export function initialsOf(name: string): string {
  return (name || '?').split(/\s+/).map(p => p[0]).join('').slice(0, 2).toUpperCase();
}
