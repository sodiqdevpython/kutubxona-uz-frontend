import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Topbar from '../components/layout/Topbar';
import Footer from '../components/layout/Footer';
import PageLoadBar from '../components/ui/PageLoadBar';
import JournalCover from '../components/ui/JournalCover';
import { useFetch } from '../lib/hooks';
import { useI18n } from '../lib/i18n';
import { issueDate, type ApiYearGroup, type ApiIssue, type ApiCategory } from '../lib/api';
import { JOURNAL_NAME, mediaUrl } from '../lib/config';
import Seo from '../components/Seo';

/**
 * Jurnal arxivi — Figma «Jurnal arxivi» freymi.
 * Chapda yillar ustuni + «Jami» kartasi, o'ngda yil bo'yicha guruhlangan sonlar.
 */

const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';
const VISIBLE_YEARS = 4;   // Figma: dastlab 4 yil, qolgani tugma bilan ochiladi

function IssueCard({ i }: { i: ApiIssue }) {
  const { t, tn } = useI18n();
  const cover = mediaUrl(i.cover_image_url);
  return (
    <div className="ic">
      <Link to={`/archive/${i.id}`} className="ic-cover">
        {cover
          ? <img src={cover} alt={t('issue.cover_alt', { journal: i.journal_title ?? JOURNAL_NAME, n: i.number, year: i.year })} loading="lazy" />
          : <JournalCover palette={i.palette} />}
      </Link>
      <div className="ic-body">
        <Link to={`/archive/${i.id}`} className="ic-title">
          № {i.number}
        </Link>
        <div className="meta">{issueDate(i)}</div>
        <div className="ic-count">{tn('unit.articles', i.article_count)}</div>
      </div>
      {/* Tugmalar karta enida — 4 ta son bir qatorga sig'ishi uchun */}
      <div className="ic-actions">
        <Link to={`/archive/${i.id}`} className="ic-btn">{t('common.table_of_contents')}</Link>
        {i.pdf_file_url && <Link to={`/archive/${i.id}#pdf`} className="ic-btn ic-btn-pdf">PDF</Link>}
      </div>
    </div>
  );
}

/** Tayyorlanayotgan son yoki nashr tanaffusi uchun nuqtali karta */
function NoteCard({ title, text }: { title: string; text: string }) {
  return (
    <div className="ic ic-note">
      <div className="eyebrow" style={{ marginBottom: 10 }}>{title}</div>
      <p>{text}</p>
    </div>
  );
}

export default function ArchivePage() {
  const { t, tn } = useI18n();
  const archState = useFetch<ApiYearGroup[]>(`${BASE}/api/issues/archive/`);
  const catState  = useFetch<ApiCategory[]>(`${BASE}/api/categories/`);

  const groups     = archState.status === 'ok' ? archState.data : [];
  const categories = useMemo(() => (
    catState.status === 'ok' ? [...catState.data].sort((x, y) => y.article_count - x.article_count) : []
  ), [catState]);

  const [showAll, setShowAll] = useState(false);
  const [activeYear, setActiveYear] = useState<number | null>(null);

  const allIssues  = useMemo(() => groups.flatMap(g => g.issues), [groups]);
  const totalArts  = allIssues.reduce((n, i) => n + i.article_count, 0);
  const published  = allIssues.filter(i => !i.is_upcoming);
  const yearMin    = groups.length ? groups[groups.length - 1].year : null;
  const currentYear = groups[0]?.year ?? null;

  const visible = showAll ? groups : groups.slice(0, VISIBLE_YEARS);
  const hidden  = groups.length - visible.length;
  const hiddenRange = hidden > 0
    ? `${groups[groups.length - 1].year}–${groups[VISIBLE_YEARS].year}`
    : '';

  function jumpYear(y: number) {
    setActiveYear(y);
    if (groups.findIndex(g => g.year === y) >= VISIBLE_YEARS) setShowAll(true);
    requestAnimationFrame(() => {
      const el = document.getElementById(`year-${y}`);
      if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 140, behavior: 'smooth' });
    });
  }

  return (
    <div className="bg-archive" style={{ minHeight: '100vh' }}>
      <Seo title={t('nav.archive')} description={t('archive.seo.description')} />
      <PageLoadBar />
      <Topbar active="archive" />
      <main id="main" className="page-main">

      <div className="wrap" style={{ paddingTop: 30 }}>
        <nav className="crumbs">
          <Link to="/">{t('nav.home')}</Link><span>/</span>
          <span className="cur">{t('nav.archive')}</span>
        </nav>

        <div className="page-head">
          <div>
            <h1 className="h-display page-title">{t('nav.archive')}</h1>
            <p className="page-sub">
              {archState.status === 'ok'
                ? t('archive.sub', { year: yearMin ?? '', issues: tn('unit.issues', published.length) })
                : '…'}
            </p>
          </div>

          {/* Yo'nalish chiplari — Figma'da o'ng tepada */}
          {categories.length > 0 && (
            <div className="page-head-ctrl" style={{ alignItems: 'flex-start' }}>
              <span className="page-head-lbl" style={{ paddingTop: 8 }}>{t('archive.category')}</span>
              <div className="chip-wrap">
                <Link to="/articles" className="chip active">
                  {t('common.all')} <span className="count">{published.length}</span>
                </Link>
                {categories.slice(0, 3).map(c => (
                  <Link key={c.id} to={`/articles?categories=${c.slug}`} className="chip">
                    {c.name} <span className="count">{c.article_count}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="wrap archive-grid">
        {/* ── Chap: yillar ── */}
        <aside className="years-col">
          <div className="eyebrow" style={{ marginBottom: 10 }}>{t('archive.years')}</div>
          <div className="years-list">
            {groups.map(g => (
              <button key={g.year} onClick={() => jumpYear(g.year)}
                className={activeYear === g.year || (activeYear === null && g.year === currentYear) ? 'active' : ''}>
                <span>{g.year}</span>
                <span className="meta">{tn('unit.issues', g.issues.length)}</span>
              </button>
            ))}
          </div>

          <div className="side-card" style={{ marginTop: 16 }}>
            <div className="eyebrow" style={{ marginBottom: 8 }}>{t('archive.total')}</div>
            <div className="h-display" style={{ fontSize: 24, marginBottom: 4 }}>
              {tn('unit.issues', published.length)}
            </div>
            <div style={{ fontSize: 13, color: 'var(--ink-3)' }}>
              {tn('unit.articles', totalArts)} · {tn('unit.years', groups.length)}
            </div>
          </div>
        </aside>

        {/* ── O'ng: yillar bo'yicha sonlar ── */}
        <div>
          {archState.status === 'loading' && <div className="state-box">{t('common.loading')}</div>}
          {archState.status === 'error'   && <div className="state-box">{t('common.error')}</div>}

          {visible.map(g => {
            const arts = g.issues.reduce((n, i) => n + i.article_count, 0);
            const isCurrent = g.year === currentYear;
            return (
              <section key={g.year} id={`year-${g.year}`} className="year-block">
                <div className="year-head">
                  <h2 className="h-display">{g.year}</h2>
                  <span className="meta">{tn('unit.issues', g.issues.length)} · {tn('unit.articles', arts)}</span>
                  <span className="rule" />
                  {isCurrent && <span className="meta">{t('archive.current_year')}</span>}
                </div>

                <div className="issue-row">
                  {g.issues.map(i =>
                    i.is_upcoming
                      ? <NoteCard key={i.id} title={t('archive.upcoming_title', { n: i.number })}
                          text={t('archive.upcoming_text')} />
                      : <IssueCard key={i.id} i={i} />
                  )}
                  {/* Yilda faqat 1 son bo'lsa — Figma'dagidek izoh kartasi */}
                  {g.issues.length === 1 && !isCurrent && (
                    <NoteCard title={t('archive.single_title')} text={t('archive.single_text')} />
                  )}
                </div>
              </section>
            );
          })}

          {hidden > 0 && (
            <div style={{ textAlign: 'center', paddingTop: 8 }}>
              <button className="btn ghost" onClick={() => setShowAll(true)}>
                {t('archive.show_years', {
                  range: hiddenRange,
                  issues: tn('unit.issues', groups.slice(VISIBLE_YEARS).reduce((n, g) => n + g.issues.length, 0)),
                })}
              </button>
            </div>
          )}
        </div>
      </div>

      </main>
      <Footer />
    </div>
  );
}
