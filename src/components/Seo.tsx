import { useEffect } from 'react';

/** Google Scholar teglari: [nom, qiymat] — bir nom bir necha marta kelishi mumkin (citation_author). */
export type CitationMeta = [string, string][];

interface Props {
  title?: string;
  description?: string;
  image?: string | null;
  citation?: CitationMeta;
}

const SITE = 'Kutubxona.uz';

function setMeta(name: string, content: string, useProperty = false) {
  const attr = useProperty ? 'property' : 'name';
  let el = document.querySelector<HTMLMetaElement>(`meta[${attr}="${name}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function setCanonical(url: string) {
  let el = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', 'canonical');
    document.head.appendChild(el);
  }
  el.setAttribute('href', url);
}

/**
 * SEO meta-teglarni har sahifa o'zgarganda yangilab turadi.
 * Sarlavha, description, Open Graph (FB/Telegram preview), Twitter card.
 */
export default function Seo({ title, description, image, citation }: Props) {
  useEffect(() => {
    const fullTitle = title ? `${title} — ${SITE}` : SITE;
    document.title = fullTitle;

    const desc = description?.slice(0, 200) || `${SITE} — O‘zbekiston ilmiy maqolalar arxivi.`;
    const url = window.location.href;

    setMeta('description', desc);

    // Open Graph (Telegram link preview, FB, LinkedIn)
    setMeta('og:title',       fullTitle, true);
    setMeta('og:description', desc,      true);
    setMeta('og:type',        'article', true);
    setMeta('og:url',         url,       true);
    setMeta('og:site_name',   SITE,      true);
    if (image) setMeta('og:image', image, true);

    // Twitter card
    setMeta('twitter:card',        image ? 'summary_large_image' : 'summary');
    setMeta('twitter:title',       fullTitle);
    setMeta('twitter:description', desc);
    if (image) setMeta('twitter:image', image);

    setCanonical(url);

    // Oldingi sahifaning citation_* teglari qolib ketmasin
    const added = (citation ?? []).map(([name, content]) => {
      const el = document.createElement('meta');
      el.setAttribute('name', name);
      el.setAttribute('content', content);
      document.head.appendChild(el);
      return el;
    });
    return () => added.forEach(el => el.remove());
  }, [title, description, image]);

  return null;
}
