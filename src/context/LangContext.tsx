import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { setCurrentLang } from '../lib/i18n/runtime';

/**
 * Til konteksti — Topbar'dagi til tugmalari orqali boshqariladi.
 *
 * `uz-latn` — O'zbek lotin (default)
 * `uz-cyrl` — Ўзбек кирилл
 * `ru`      — Русский
 * `en`      — English
 *
 * Tanlangan til `localStorage.kb_lang`'da saqlanadi va yangi sessiyada tiklanadi.
 * Server'dan keladigan dinamik matn (maqola tarkibi, sarlavha) tarjima qilinmaydi —
 * faqat sayt interfeysining o'zi (`t('nav.home')` ko'rinishida).
 */
export type Lang = 'uz-latn' | 'uz-cyrl' | 'ru' | 'en';

export const LANGS: readonly Lang[] = ['uz-latn', 'uz-cyrl', 'ru', 'en'];

/** BCP-47 lokal — `<html lang>`, `Intl` va `toLocaleString` uchun. */
export const LOCALE: Record<Lang, string> = {
  'uz-latn': 'uz-Latn-UZ',
  'uz-cyrl': 'uz-Cyrl-UZ',
  ru:        'ru-RU',
  en:        'en-US',
};

const LS_KEY = 'kb_lang';

interface LangContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
}

const LangContext = createContext<LangContextValue>({
  lang: 'uz-latn',
  setLang: () => {},
});

function isLang(v: unknown): v is Lang {
  return typeof v === 'string' && (LANGS as readonly string[]).includes(v);
}

function readInitial(): Lang {
  let lang: Lang = 'uz-latn';
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (isLang(raw)) lang = raw;
  } catch { /* SSR yoki storage yopiq */ }
  // Hook'lardan tashqaridagi yordamchilar (issueDate, relTime…) ham shu tilni ko'rsin
  setCurrentLang(lang);
  return lang;
}

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(readInitial);

  useEffect(() => {
    try { localStorage.setItem(LS_KEY, lang); } catch { /* ignore */ }
    // <html lang="..."> — SEO va A11y uchun
    document.documentElement.lang = LOCALE[lang];
  }, [lang]);

  const value = useMemo<LangContextValue>(() => ({
    lang,
    setLang: (l: Lang) => {
      // Render'dan OLDIN global qiymat yangilanadi — shu renderdagi helper'lar ham yangi tilda
      setCurrentLang(l);
      setLangState(l);
    },
  }), [lang]);

  return (
    <LangContext.Provider value={value}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  return useContext(LangContext);
}
