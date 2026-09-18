import { Link } from 'react-router-dom';
import { useLang, type Lang } from '../../context/LangContext';
import { Wordmark } from './Topbar';

/**
 * Sayt pastki qismi — Figma'dagi to'q rangli, to'rt ustunli footer.
 * Chapda: logotip, jurnal haqida qisqacha, ISSN va «Ochiq kirish» belgisi.
 * O'ngda: uchta havolalar ustuni. Pastda: mualliflik va til almashtirgich.
 */

const COLUMNS: { title: string; links: { label: string; to: string }[] }[] = [
  {
    title: 'Arxiv',
    links: [
      { label: 'Barcha maqolalar', to: '/articles' },
      { label: 'Jurnal sonlari',   to: '/archive' },
      { label: 'Mualliflar',       to: '/authors' },
      { label: 'Central Asia',     to: '/central-asia' },
      { label: 'Qidiruv',          to: '/articles' },
    ],
  },
  {
    title: 'Jurnal',
    links: [
      { label: 'Jurnal haqida',       to: '/about' },
      { label: 'Tahririyat kengashi', to: '/about/board' },
      { label: 'Taqriz siyosati',     to: '/about/policy' },
      { label: 'Nashr etikasi',       to: '/about/policy' },
      { label: 'Indeksatsiya',        to: '/about' },
    ],
  },
  {
    title: 'Mualliflarga',
    links: [
      { label: 'Qabul shartlari',      to: '/about/guide' },
      { label: 'Formatlash talablari', to: '/about/guide' },
      { label: '.docx shablon',        to: '/about/guide' },
      { label: 'Taqriz jarayoni',      to: '/about/policy' },
      { label: 'Maqola yuborish',      to: '/about/guide' },
    ],
  },
];

const LANGS: { code: string; value: Lang }[] = [
  { code: "O'zbekcha", value: 'uz-latn' },
  { code: 'Ўзбекча',   value: 'uz-cyrl' },
  { code: 'Русский',   value: 'ru'      },
  { code: 'English',   value: 'en'      },
];

export default function Footer() {
  const { lang, setLang } = useLang();

  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        {/* ── Chap ustun: brend ── */}
        <div className="site-footer-brand">
          <div className="brand" style={{ marginBottom: 16 }}>
            <Wordmark light />
          </div>

          <p className="site-footer-about">
            «Kutubxona» ilmiy-amaliy jurnali arxivi. 2019-yildan beri chiqadi.
            O‘zbekiston Milliy kutubxonasi nashri.
          </p>

          <div className="site-footer-badges">
            <span className="issn-badge">ISSN 2181-1732 · e-ISSN 2181-1740</span>
            <span className="oa-badge">Ochiq kirish</span>
          </div>
        </div>

        {/* ── Havolalar ustunlari ── */}
        {COLUMNS.map(col => (
          <nav key={col.title} className="site-footer-col">
            <div className="site-footer-col-title">{col.title}</div>
            {col.links.map(l => (
              <Link key={l.label + l.to} to={l.to}>{l.label}</Link>
            ))}
          </nav>
        ))}
      </div>

      {/* ── Pastki chiziq ── */}
      <div className="site-footer-bottom">
        <div className="meta" style={{ color: 'rgba(255,255,255,0.45)' }}>
          © {new Date().getFullYear()} O‘zbekiston Milliy kutubxonasi · DOI prefiks 10.62499
        </div>
        <div className="site-footer-langs">
          {LANGS.map(l => (
            <button key={l.value}
              className={lang === l.value ? 'active' : ''}
              onClick={() => setLang(l.value)}>
              {l.code}
            </button>
          ))}
        </div>
      </div>
    </footer>
  );
}
