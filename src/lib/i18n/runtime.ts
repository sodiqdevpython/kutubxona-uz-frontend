/**
 * i18n yadrosi — React'ga bog'liq emas.
 *
 * `tr()`/`trn()` — hook'lardan tashqarida (lib yordamchilari, class komponentlar)
 * ishlatish uchun; joriy til `LangProvider` tomonidan `setCurrentLang()` orqali
 * sinxron yangilanadi. Komponentlar ichida `useI18n()` ishlating.
 *
 * Lug'at formati: har kalit to'rt tilni birga saqlaydi —
 *   'nav.home': { 'uz-latn': 'Bosh sahifa', 'uz-cyrl': 'Бош саҳифа', ru: 'Главная', en: 'Home' }
 * TypeScript bittasi yetishmasa xato beradi, shuning uchun «chala tarjima» bo'lmaydi.
 *
 * Qiymat ichida `{nom}` — o'rniga qo'yiladigan o'zgaruvchi.
 * Ko'plik: shakllar `|` bilan ajratiladi, tartib `PLURAL_ORDER` dagidek —
 *   ru: '{n} статья|{n} статьи|{n} статей'   en: '{n} article|{n} articles'
 * O'zbekcha sanoqdan keyin ko'plik qo'shimchasi olinmaydi, shuning uchun bitta shakl kifoya.
 */
import type { Lang } from '../../context/LangContext';
import { MESSAGES } from './messages';

export type Entry = Record<Lang, string>;
export type MsgKey = keyof typeof MESSAGES;
export type Vars = Record<string, string | number | null | undefined>;

export const LOCALE: Record<Lang, string> = {
  'uz-latn': 'uz-Latn-UZ',
  'uz-cyrl': 'uz-Cyrl-UZ',
  ru:        'ru-RU',
  en:        'en-US',
};

/** Ko'plik shakllarining `|` bo'yicha tartibi (Intl.PluralRules kategoriyalari). */
const PLURAL_ORDER: Record<Lang, Intl.LDMLPluralRule[]> = {
  'uz-latn': ['one', 'other'],
  'uz-cyrl': ['one', 'other'],
  ru:        ['one', 'few', 'many', 'other'],
  en:        ['one', 'other'],
};

let current: Lang = 'uz-latn';

export function setCurrentLang(l: Lang): void { current = l; }
export function currentLang(): Lang { return current; }

const pluralRules = new Map<Lang, Intl.PluralRules>();
function rules(lang: Lang): Intl.PluralRules {
  let r = pluralRules.get(lang);
  if (!r) {
    try { r = new Intl.PluralRules(LOCALE[lang]); }
    catch { r = new Intl.PluralRules('en'); }
    pluralRules.set(lang, r);
  }
  return r;
}

function interpolate(s: string, vars?: Vars): string {
  if (!vars) return s;
  return s.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars && vars[k] != null ? String(vars[k]) : m));
}

function raw(key: MsgKey, lang: Lang): string {
  const entry = MESSAGES[key] as Entry | undefined;
  if (!entry) {
    if (import.meta.env.DEV) console.warn(`[i18n] kalit yo'q: ${key}`);
    return key;
  }
  return entry[lang] ?? entry['uz-latn'];
}

/** Oddiy matn. Ko'plik shakllari bo'lsa ham birinchisi olinadi — `trn()` ishlating. */
export function tr(key: MsgKey, vars?: Vars, lang: Lang = current): string {
  const s = raw(key, lang);
  return interpolate(s.includes('|') ? s.split('|')[0] : s, vars);
}

/** Sanoq bilan: `trn('articles.count', 5)` → «5 maqola» / «5 статей» / «5 articles». */
export function trn(key: MsgKey, n: number, vars?: Vars, lang: Lang = current): string {
  const forms = raw(key, lang).split('|');
  let form = forms[forms.length - 1];
  if (forms.length > 1) {
    const idx = PLURAL_ORDER[lang].indexOf(rules(lang).select(n));
    form = forms[idx >= 0 && idx < forms.length ? idx : forms.length - 1];
  }
  return interpolate(form, { n: fmtNum(n, lang), ...vars });
}

/** Raqam — lokal ajratgichlar bilan («1 250» / «1,250»). */
export function fmtNum(n: number, lang: Lang = current): string {
  try { return n.toLocaleString(LOCALE[lang]); } catch { return String(n); }
}

/** Sana — «12 mart 2026» ko'rinishida (lokalga mos). */
export function fmtDate(
  input: string | Date | null | undefined,
  opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' },
  lang: Lang = current,
): string {
  if (!input) return '';
  const d = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(d.getTime())) return typeof input === 'string' ? input : '';
  try { return d.toLocaleDateString(LOCALE[lang], opts); } catch { return d.toDateString(); }
}

/** Fayl hajmi: 2 400 000 → «2,3 MB» (uz/ru) yoki «2.3 MB» (en). */
export function fmtBytes(bytes: number | null | undefined, lang: Lang = current): string {
  if (!bytes) return '';
  const dec = lang === 'en' ? '.' : ',';
  if (bytes < 1024) return `${bytes} B`;
  const mb = bytes / (1024 * 1024);
  if (mb >= 1) return `${mb.toFixed(1).replace('.', dec)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

/** «hozir», «5 daqiqa oldin», «3 soat oldin», «2 kun oldin», aks holda sana. */
export function relTime(iso: string, lang: Lang = current): string {
  const d  = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const dt = Math.floor((Date.now() - d.getTime()) / 1000);
  if (dt < 60)     return tr('time.just_now', undefined, lang);
  if (dt < 3600)   return trn('time.minutes_ago', Math.floor(dt / 60), undefined, lang);
  if (dt < 86400)  return trn('time.hours_ago',   Math.floor(dt / 3600), undefined, lang);
  if (dt < 604800) return trn('time.days_ago',    Math.floor(dt / 86400), undefined, lang);
  return fmtDate(d, { day: 'numeric', month: 'short', year: 'numeric' }, lang);
}
