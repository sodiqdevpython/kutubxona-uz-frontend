import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

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

const LS_KEY = 'kb_lang';

interface LangContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
}

const LangContext = createContext<LangContextValue>({
  lang: 'uz-latn',
  setLang: () => {},
});

function readInitial(): Lang {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw === 'uz-latn' || raw === 'uz-cyrl' || raw === 'ru' || raw === 'en') return raw;
  } catch { /* SSR yoki storage yopiq */ }
  return 'uz-latn';
}

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(readInitial);

  useEffect(() => {
    try { localStorage.setItem(LS_KEY, lang); } catch { /* ignore */ }
    // <html lang="..."> — SEO va A11y uchun
    const htmlLang = lang === 'uz-cyrl' ? 'uz-Cyrl' : lang === 'uz-latn' ? 'uz-Latn' : lang;
    document.documentElement.lang = htmlLang;
  }, [lang]);

  return (
    <LangContext.Provider value={{ lang, setLang: setLangState }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  return useContext(LangContext);
}
