import { useCallback, useMemo } from 'react';
import { useLang, type Lang } from '../../context/LangContext';
import { LOCALE, fmtBytes, fmtDate, fmtNum, relTime, tr, trn, type MsgKey, type Vars } from './runtime';

export { tr, trn, fmtNum, fmtDate, fmtBytes, relTime, currentLang, LOCALE } from './runtime';
export type { MsgKey, Vars, Entry } from './runtime';

export interface I18n {
  lang:   Lang;
  /** BCP-47 lokal (`uz-Latn-UZ`, `ru-RU`…) — `toLocaleString` uchun */
  locale: string;
  /** Oddiy matn: `t('nav.home')`, `t('x.y', { n: 5 })` */
  t:   (key: MsgKey, vars?: Vars) => string;
  /** Sanoq bilan (ko'plik shakli tanlanadi): `tn('articles.count', 12)` */
  tn:  (key: MsgKey, n: number, vars?: Vars) => string;
  num:   (n: number) => string;
  date:  (d: string | Date | null | undefined, opts?: Intl.DateTimeFormatOptions) => string;
  bytes: (b: number | null | undefined) => string;
  rel:   (iso: string) => string;
}

/** Komponentlar uchun asosiy hook. Til o'zgarsa komponent qayta chiziladi. */
export function useI18n(): I18n {
  const { lang } = useLang();
  const t  = useCallback((key: MsgKey, vars?: Vars) => tr(key, vars, lang), [lang]);
  const tn = useCallback((key: MsgKey, n: number, vars?: Vars) => trn(key, n, vars, lang), [lang]);
  return useMemo<I18n>(() => ({
    lang,
    locale: LOCALE[lang],
    t, tn,
    num:   n => fmtNum(n, lang),
    date:  (d, opts) => fmtDate(d, opts, lang),
    bytes: b => fmtBytes(b, lang),
    rel:   iso => relTime(iso, lang),
  }), [lang, t, tn]);
}

/** Qisqa variant — faqat `t` kerak bo'lsa. */
export function useT() {
  return useI18n().t;
}
