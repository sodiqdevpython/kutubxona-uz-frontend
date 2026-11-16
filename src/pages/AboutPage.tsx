import { Link, useLocation } from 'react-router-dom';
import Topbar from '../components/layout/Topbar';
import Footer from '../components/layout/Footer';
import PageLoadBar from '../components/ui/PageLoadBar';
import Seo from '../components/Seo';
import { useI18n, type MsgKey } from '../lib/i18n';
import { TELEGRAM_BOT_URL } from '../lib/config';

/**
 * «Jurnal haqida» bo'limi — Figma'dagi 14–17-freymlar.
 * To'rt sahifa bir xil karkasdan foydalanadi: chapda bo'lim navigatsiyasi,
 * markazda matn, o'ngda jurnal pasporti.
 */

const NAV: { to: string; label: MsgKey }[] = [
  { to: '/about',        label: 'nav.about' },
  { to: '/about/board',  label: 'nav.about.board' },
  { to: '/about/policy', label: 'nav.about.policy' },
  { to: '/about/guide',  label: 'nav.about.guide' },
];

/** [kalit, qiymat (kalit yoki tayyor matn), urg'u]. Raqamli qiymatlar tarjima qilinmaydi. */
const PASSPORT: { k: MsgKey; v: MsgKey | { raw: string }; accent?: boolean }[] = [
  { k: 'about.passport.publisher',   v: 'about.passport.publisher_v' },
  { k: 'about.passport.founded',     v: { raw: '2019' } },
  { k: 'about.passport.periodicity', v: 'about.passport.periodicity_v' },
  { k: 'about.passport.access',      v: 'about.passport.access_v', accent: true },
  { k: 'about.passport.review',      v: 'about.passport.review_v' },
  { k: 'about.passport.fee',         v: 'about.passport.fee_v', accent: true },
];

// ── Karkas ───────────────────────────────────────────────────────────────────

function AboutLayout({ title, children }: { title: string; children: React.ReactNode }) {
  const { pathname } = useLocation();
  const { t } = useI18n();

  return (
    <div className="bg-articles" style={{ minHeight: '100vh' }}>
      <Seo title={title} />
      <PageLoadBar />
      <Topbar active="about" />
      <main id="main" className="page-main">

      <div className="wrap" style={{ paddingTop: 30 }}>
        <nav className="crumbs">
          <Link to="/">{t('nav.home')}</Link>
          <span>/</span>
          <span className="cur">{title}</span>
        </nav>
      </div>

      <div className="wrap about-grid">
        {/* Bo'lim navigatsiyasi */}
        <aside className="about-nav">
          <div className="eyebrow" style={{ marginBottom: 12 }}>{t('nav.about')}</div>
          {NAV.map(n => (
            <Link key={n.to} to={n.to} className={pathname === n.to ? 'active' : ''}>
              {t(n.label)}
            </Link>
          ))}
        </aside>

        {/* Matn */}
        <article className="about-body">
          <h1 className="h-display about-title">{title}</h1>
          {children}
        </article>

        {/* Pasport */}
        <aside className="about-side">
          <div className="side-card">
            <div className="side-card-title">{t('about.passport.title')}</div>
            {PASSPORT.map(({ k, v, accent }) => (
              <div key={k} className="pass-row">
                <span className="pass-k">{t(k)}</span>
                <span className="pass-v" data-accent={accent ? 'on' : undefined}>{typeof v === 'string' ? t(v) : v.raw}</span>
              </div>
            ))}
          </div>

          <div className="side-card" style={{ background: 'var(--grey-2)' }}>
            <div className="side-card-title">{t('about.editorial')}</div>
            <p className="side-text" style={{ marginBottom: 8 }}>
              {t('about.address1')}<br />
              {t('about.address2')}
            </p>
            <a className="side-link" href="mailto:jurnal@natlib.uz">jurnal@natlib.uz</a>
            <div className="meta" style={{ marginTop: 6 }}>+998 71 232-83-94</div>
          </div>
        </aside>
      </div>

      </main>
      <Footer />
    </div>
  );
}

// ── Yordamchi bloklar ────────────────────────────────────────────────────────

function H2({ id, children }: { id?: string; children: React.ReactNode }) {
  return <h2 id={id} className="h-display about-h2">{children}</h2>;
}

function NumList({ items }: { items: string[] }) {
  return (
    <ol className="about-list">
      {items.map((text, i) => (
        <li key={i}>
          <span className="about-list-n">{String(i + 1).padStart(2, '0')}</span>
          <span>{text}</span>
        </li>
      ))}
    </ol>
  );
}

// ── 1. Jurnal haqida ─────────────────────────────────────────────────────────

export function AboutJournal() {
  const { t } = useI18n();
  return (
    <AboutLayout title={t('nav.about')}>
      <p className="about-lede">{t('about.journal.lede')}</p>

      <H2>{t('about.journal.scope_h')}</H2>
      <p>{t('about.journal.scope_p')}</p>
      <NumList items={[
        t('about.journal.scope1'),
        t('about.journal.scope2'),
        t('about.journal.scope3'),
        t('about.journal.scope4'),
        t('about.journal.scope5'),
      ]} />

      <H2>{t('about.journal.policy_h')}</H2>
      <p>{t('about.journal.policy_p')}</p>

      <H2 id="indeksatsiya">{t('about.journal.indexing_h')}</H2>
      <p>{t('about.journal.indexing_p')}</p>

      <H2>{t('about.journal.history_h')}</H2>
      <p>{t('about.journal.history_p')}</p>
    </AboutLayout>
  );
}

// ── 2. Tahririyat kengashi ───────────────────────────────────────────────────

/** Ismlar o'zgarmaydi; lavozim va tashkilot nomlari tarjima qilinadi. */
const BOARD: { role: MsgKey; people: { name: string; org: MsgKey }[] }[] = [
  {
    role: 'about.board.role.chief',
    people: [{ name: 'Anvar Umarov', org: 'about.board.org.natlib_phd' }],
  },
  {
    role: 'about.board.role.deputy',
    people: [{ name: 'Dilnoza Hamroyeva', org: 'about.board.org.jizzakh' }],
  },
  {
    role: 'about.board.role.board',
    people: [
      { name: 'Zulfiya Yusupova',  org: 'about.board.org.oriental' },
      { name: 'Kamol Baxromov',    org: 'about.board.org.nuu_docent' },
      { name: 'Feruza Ro‘ziyeva',  org: 'about.board.org.natlib_bibl' },
      { name: 'Hulkar Karimova',   org: 'about.board.org.culture' },
      { name: 'Muzaffar Otaxonov', org: 'about.board.org.wiut' },
    ],
  },
  {
    role: 'about.board.role.intl',
    people: [
      { name: 'Эльвира Азаматова', org: 'about.board.org.rsl' },
      { name: 'Marina Kovaleva',   org: 'about.board.org.ifla' },
    ],
  },
];

export function AboutBoard() {
  const { t } = useI18n();
  return (
    <AboutLayout title={t('nav.about.board')}>
      <p className="about-lede">{t('about.board.lede')}</p>

      {BOARD.map(group => (
        <section key={group.role}>
          <H2>{t(group.role)}</H2>
          <div className="board-list">
            {group.people.map(p => (
              <div key={p.name} className="board-row">
                <span className="board-name">{p.name}</span>
                <span className="board-org">{t(p.org)}</span>
              </div>
            ))}
          </div>
        </section>
      ))}
    </AboutLayout>
  );
}

// ── 3. Taqriz siyosati va etika ──────────────────────────────────────────────

export function AboutPolicy() {
  const { t } = useI18n();
  return (
    <AboutLayout title={t('nav.about.policy')}>
      <p className="about-lede">{t('about.policy.lede')}</p>

      <H2 id="taqriz">{t('about.policy.stages_h')}</H2>
      <NumList items={[
        t('about.policy.stage1'),
        t('about.policy.stage2'),
        t('about.policy.stage3'),
        t('about.policy.stage4'),
        t('about.policy.stage5'),
      ]} />

      <H2 id="etika">{t('about.policy.ethics_h')}</H2>
      <p>{t('about.policy.ethics_p1')}</p>
      <p>{t('about.policy.ethics_p2')}</p>

      <H2>{t('about.policy.rights_h')}</H2>
      <p>{t('about.policy.rights_p')}</p>
    </AboutLayout>
  );
}

// ── 4. Mualliflar uchun qo'llanma ────────────────────────────────────────────

export function AboutGuide() {
  const { t } = useI18n();
  return (
    <AboutLayout title={t('nav.about.guide')}>
      <p className="about-lede">{t('about.guide.lede')}</p>

      <H2 id="qabul">{t('about.guide.terms_h')}</H2>
      <NumList items={[
        t('about.guide.term1'),
        t('about.guide.term2'),
        t('about.guide.term3'),
        t('about.guide.term4'),
        t('about.guide.term5'),
      ]} />

      <H2 id="formatlash">{t('about.guide.format_h')}</H2>
      <p>{t('about.guide.format_p')}</p>

      <H2 id="yuborish">{t('about.guide.submit_h')}</H2>
      <p>{t('about.guide.submit_p')}</p>
      <p style={{ marginTop: 20 }}>
        <a className="btn primary" href={TELEGRAM_BOT_URL}
          target="_blank" rel="noreferrer">
          {t('home.cta.button')}
        </a>
      </p>
    </AboutLayout>
  );
}
