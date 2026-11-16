/**
 * Kelgan maqola kartasi uchun hisoblanadigan holatlar (Figma: TAYYOR / AI TO'LDIRDI / TO'LIQSIZ).
 */
import type { AdminSubmission } from './admin-api';
import type { MsgKey } from './i18n';
import { tr } from './i18n/runtime';

export type Readiness = 'ready' | 'ai' | 'incomplete';

export function readiness(s: AdminSubmission): Readiness {
  if (!s.title || !s.abstract) return 'incomplete';
  return s.ai_filled ? 'ai' : 'ready';
}

export const READINESS_LABEL: Record<Readiness, MsgKey> = {
  ready: 'adm.sub.ready', ai: 'adm.sub.ai_filled', incomplete: 'adm.sub.incomplete',
};

export function readinessNote(s: AdminSubmission): string {
  switch (readiness(s)) {
    case 'ready':      return tr('adm.sub.note.ready');
    case 'ai':         return tr('adm.sub.note.ai');
    case 'incomplete': return s.source_file_url ? tr('adm.sub.note.incomplete') : tr('adm.sub.note.no_file');
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
