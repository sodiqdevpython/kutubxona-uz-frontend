import { Link } from 'react-router-dom';
import { useLang, type Lang } from '../../context/LangContext';
import { useI18n, type MsgKey } from '../../lib/i18n';
import { Wordmark } from './Topbar';

/**
 * Sayt pastki qismi — Figma'dagi to'q rangli, to'rt ustunli footer.
 * Chapda: logotip, jurnal haqida qisqacha va «Ochiq kirish» belgisi.
 * O'ngda: uchta havolalar ustuni. Pastda: mualliflik va til almashtirgich.
 */

const COLUMNS: { title: MsgKey; links: { label: MsgKey; to: string }[] }[] = [
  {
    title: 'footer.col.archive',
    links: [
      { label: 'footer.link.all_articles', to: '/articles' },
      { label: 'footer.link.issues',       to: '/archive' },
      { label: 'nav.authors',              to: '/authors' },
      { label: 'nav.central_asia',         to: '/central-asia' },
      { label: 'footer.link.search',       to: '/articles#search' },
    ],
  },
  {
    title: 'footer.col.journal',
    links: [
      { label: 'nav.about',            to: '/about' },
      { label: 'nav.about.board',      to: '/about/board' },
      { label: 'footer.link.policy',   to: '/about/policy' },
      { label: 'footer.link.ethics',   to: '/about/policy#etika' },
      { label: 'footer.link.indexing', to: '/about#indeksatsiya' },
    ],
  },
  {
    title: 'footer.col.authors',
    links: [
      { label: 'footer.link.terms',      to: '/about/guide#qabul' },
      { label: 'footer.link.formatting', to: '/about/guide#formatlash' },
      { label: 'footer.link.review',     to: '/about/policy#taqriz' },
      { label: 'footer.link.submit',     to: '/about/guide#yuborish' },
    ],
  },
];

/** Til nomlari o'z tilida yoziladi — foydalanuvchi o'z tilini tanimasligi mumkin emas. */
const LANGS: { code: string; value: Lang }[] = [
  { code: 'O‘zbekcha', value: 'uz-latn' },
  { code: 'Ўзбекча',   value: 'uz-cyrl' },
  { code: 'Русский',   value: 'ru'      },
  { code: 'English',   value: 'en'      },
];

export default function Footer() {
  const { lang, setLang } = useLang();
  const { t } = useI18n();

  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        {/* ── Chap ustun: brend ── */}
        <div className="site-footer-brand">
          <div className="brand" style={{ marginBottom: 16 }}>
            <Wordmark light />
          </div>

          <p className="site-footer-about">{t('footer.about')}</p>

          <div className="site-footer-badges">
            <span className="oa-badge">{t('common.open_access')}</span>
          </div>
        </div>

        {/* ── Havolalar ustunlari ── */}
        {COLUMNS.map(col => (
          <nav key={col.title} className="site-footer-col">
            <div className="site-footer-col-title">{t(col.title)}</div>
            {col.links.map(l => (
              <Link key={l.label + l.to} to={l.to}>{t(l.label)}</Link>
            ))}
          </nav>
        ))}
      </div>

      {/* ── Pastki chiziq ── */}
      <div className="site-footer-bottom">
        <div className="meta" style={{ color: 'rgba(255,255,255,0.45)' }}>
          {t('footer.copyright', { year: new Date().getFullYear() })}
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
