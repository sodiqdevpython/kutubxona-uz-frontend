import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Topbar from '../components/layout/Topbar';
import Footer from '../components/layout/Footer';
import PageLoadBar from '../components/ui/PageLoadBar';
import JournalCover from '../components/ui/JournalCover';
import { useFetch } from '../lib/hooks';
import type { ApiYearGroup, ApiIssue, ApiCategory } from '../lib/api';
import { mediaUrl } from '../lib/config';
import Seo from '../components/Seo';

/**
 * Jurnal arxivi — Figma «Jurnal arxivi» freymi.
 * Chapda yillar ustuni + «Jami» kartasi, o'ngda yil bo'yicha guruhlangan sonlar.
 */

const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';
const VISIBLE_YEARS = 4;   // Figma: dastlab 4 yil, qolgani tugma bilan ochiladi

function IssueCard({ i }: { i: ApiIssue }) {
  const cover = mediaUrl(i.cover_image_url);
  return (
    <div className="ic">
      <Link to={`/archive/${i.id}`} className="ic-cover">
        {cover ? <img src={cover} alt="" /> : <JournalCover palette={i.palette} />}
      </Link>
      <div className="ic-body">
        <Link to={`/archive/${i.id}`} className="ic-title">
          № {i.number}{i.season ? ` · ${i.season}` : ''}
        </Link>
        <div className="meta">{i.date_label || i.year}</div>
        <div className="ic-count">{i.article_count} maqola</div>
        <div className="ic-actions">
          <Link to={`/archive/${i.id}`} className="ic-btn">Mundarija</Link>
          {i.pdf_file_url && (
            <a href={mediaUrl(i.pdf_file_url) ?? undefined} target="_blank" rel="noreferrer"
              className="ic-btn ic-btn-pdf">PDF</a>
          )}
        </div>
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
  const archState = useFetch<ApiYearGroup[]>(`${BASE}/api/issues/archive/`);
  const catState  = useFetch<ApiCategory[]>(`${BASE}/api/categories/`);

  const groups     = archState.status === 'ok' ? archState.data : [];
  const categories = catState.status  === 'ok' ? catState.data  : [];

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
      <Seo title="Jurnal arxivi" description="Jurnalning barcha sonlari — muqova, mundarija va to'liq PDF." />
      <PageLoadBar />
      <Topbar active="archive" />

      <div className="wrap" style={{ paddingTop: 30 }}>
        <nav className="crumbs">
          <Link to="/">Bosh sahifa</Link><span>/</span>
          <span className="cur">Jurnal arxivi</span>
        </nav>

        <div className="page-head">
          <div>
            <h1 className="h-display page-title">Jurnal arxivi</h1>
            <p className="page-sub">
              {archState.status === 'ok'
                ? `${yearMin ?? ''}-yildan bugungacha chiqqan ${published.length} son. Har sonda muqova, mundarija va to‘liq PDF.`
                : '…'}
            </p>
          </div>

          {/* Yo'nalish chiplari — Figma'da o'ng tepada */}
          {categories.length > 0 && (
            <div className="page-head-ctrl" style={{ alignItems: 'flex-start' }}>
              <span className="page-head-lbl" style={{ paddingTop: 8 }}>Yo‘nalish</span>
              <div className="chip-wrap">
                <Link to="/articles" className="chip active">
                  Barchasi <span className="count">{published.length}</span>
                </Link>
                {categories.slice(0, 3).map(c => (
                  <Link key={c.id} to="/articles" className="chip">
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
        <aside className="years-col rsp-hide">
          <div className="eyebrow" style={{ marginBottom: 10 }}>Yillar</div>
          <div className="years-list">
            {groups.map(g => (
              <button key={g.year} onClick={() => jumpYear(g.year)}
                className={activeYear === g.year || (activeYear === null && g.year === currentYear) ? 'active' : ''}>
                <span>{g.year}</span>
                <span className="meta">{g.issues.length} son</span>
              </button>
            ))}
          </div>

          <div className="side-card" style={{ marginTop: 16 }}>
            <div className="eyebrow" style={{ marginBottom: 8 }}>Jami</div>
            <div className="h-display" style={{ fontSize: 24, marginBottom: 4 }}>
              {published.length} son
            </div>
            <div style={{ fontSize: 13, color: 'var(--ink-3)' }}>
              {totalArts} maqola · {groups.length} yil
            </div>
          </div>
        </aside>

        {/* ── O'ng: yillar bo'yicha sonlar ── */}
        <div>
          {archState.status === 'loading' && <div className="state-box">Yuklanmoqda…</div>}
          {archState.status === 'error'   && <div className="state-box">Xatolik yuz berdi.</div>}

          {visible.map(g => {
            const arts = g.issues.reduce((n, i) => n + i.article_count, 0);
            const isCurrent = g.year === currentYear;
            return (
              <section key={g.year} id={`year-${g.year}`} className="year-block">
                <div className="year-head">
                  <h2 className="h-display">{g.year}</h2>
                  <span className="meta">{g.issues.length} son · {arts} maqola</span>
                  <span className="rule" />
                  {isCurrent && <span className="meta">joriy yil</span>}
                </div>

                <div className="issue-row">
                  {g.issues.map(i =>
                    i.is_upcoming
                      ? <NoteCard key={i.id} title={`№ ${i.number} tayyorlanmoqda`}
                          text="Kelgusi son uchun maqola qabuli ochiq." />
                      : <IssueCard key={i.id} i={i} />
                  )}
                  {/* Yilda faqat 1 son bo'lsa — Figma'dagidek izoh kartasi */}
                  {g.issues.length === 1 && !isCurrent && (
                    <NoteCard title="Nashr tanaffusi"
                      text="Bu yilda faqat bitta son chiqqan — tahririyat almashuvi davri." />
                  )}
                </div>
              </section>
            );
          })}

          {hidden > 0 && (
            <div style={{ textAlign: 'center', paddingTop: 8 }}>
              <button className="btn ghost" onClick={() => setShowAll(true)}>
                {hiddenRange} yillarni ko‘rsatish · {groups.slice(VISIBLE_YEARS).reduce((n, g) => n + g.issues.length, 0)} son
              </button>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}
