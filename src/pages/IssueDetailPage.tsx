import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Topbar from '../components/layout/Topbar';
import Footer from '../components/layout/Footer';
import PageLoadBar from '../components/ui/PageLoadBar';
import JournalCover from '../components/ui/JournalCover';
import MetaGrid from '../components/ui/MetaGrid';
import PdfViewer from '../components/ui/PdfViewer';
import { useI18n } from '../lib/i18n';
import { isRealDate, issuesApi, type ApiIssueDetail } from '../lib/api';
import { JOURNAL_NAME, mediaUrl } from '../lib/config';
import Seo from '../components/Seo';
import NotFoundPage from './NotFoundPage';

/**
 * Son sahifasi — Figma «Jurnal arxiv detail» freymi.
 * Muqova + tahririyat so'zi + meta jadval, o'ngda statistika kartasi,
 * pastda yo'nalishlar bo'yicha guruhlangan mundarija.
 */

function pageRange(a: number | null, b: number | null): string {
  if (a && b) return a === b ? `${a}` : `${a}–${b}`;
  if (a) return `${a}`;
  return '';
}

export default function IssueDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { t, tn, num, bytes } = useI18n();
  const [issue,   setIssue]   = useState<ApiIssueDetail | null>(null);
  const [loading, setLoading] = useState(!!id);
  // To'liq son PDF'i og'ir — faqat so'ralganda yuklanadi (havolada #pdf bo'lsa darhol)
  const [showPdf, setShowPdf] = useState(window.location.hash === '#pdf');

  // id o'zgarsa — holat render vaqtida yangilanadi
  const [seenId, setSeenId] = useState(id);
  if (seenId !== id) { setSeenId(id); setIssue(null); setLoading(!!id); }

  useEffect(() => {
    if (!id) return;
    issuesApi.detail(id)
      .then(d => { setIssue(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id]);

  const journal = issue?.journal_title ?? JOURNAL_NAME;
  const pdfUrl  = mediaUrl(issue?.pdf_file_url);
  const hasPages = issue?.sections.some(s => s.page_start) ?? false;
  const hasRubrics = issue?.sections.some(s => s.category) ?? false;
  const cover   = mediaUrl(issue?.cover_image_url);
  const totalArts = issue?.sections.reduce((n, s) => n + s.articles.length, 0) ?? 0;

  if (loading) {
    return (
      <div className="bg-detail" style={{ minHeight: '100vh' }}>
        <PageLoadBar /><Topbar active="archive" />
        <main id="main" className="page-main">
        <div className="wrap"><div className="state-box" style={{ marginTop: 40 }}>{t('common.loading')}</div></div>
        </main>
        <Footer />
      </div>
    );
  }
  if (!issue) return <NotFoundPage />;

  const coverAlt = t('issue.cover_alt', { journal, n: issue.number, year: issue.year });
  const hasVol = issue.volume > 0 && issue.volume <= 12;

  return (
    <div className="bg-detail" style={{ minHeight: '100vh' }}>
      <Seo title={`${journal} № ${issue.number} · ${issue.year}`}
        description={issue.editorial_note || t('issue.seo.description', { journal, year: issue.year, n: issue.number })}
        image={cover} />
      <PageLoadBar />
      <Topbar active="archive" />
      <main id="main" className="page-main">

      <div className="wrap" style={{ paddingTop: 26 }}>
        <nav className="crumbs">
          <Link to="/">{t('nav.home')}</Link><span>/</span>
          <Link to="/archive">{t('nav.archive')}</Link><span>/</span>
          <Link to="/archive">{issue.year}</Link><span>/</span>
          <span className="cur">№ {issue.number}{hasVol ? ` · ${t('issue.vol', { vol: issue.volume })}` : ''}</span>
        </nav>
      </div>

      {/* ═══ Yuqori blok: muqova · matn · yon karta ═══ */}
      <div className="wrap issue-hero">
        {/* Muqova + oldingi/keyingi */}
        <div className="issue-cover-col">
          <div className="issue-cover-big">
            {cover ? <img src={cover} alt={coverAlt} /> : <JournalCover palette={issue.palette} />}
          </div>
          {cover && (
            <a className="ic-btn issue-cover-dl" href={cover} download target="_blank" rel="noreferrer">
              {t('issue.download_cover')}
            </a>
          )}
          <div className="issue-nav">
            {issue.prev_issue
              ? <Link to={`/archive/${issue.prev_issue.id}`} className="ic-btn">← № {issue.prev_issue.number} · {issue.prev_issue.year}</Link>
              : <span className="ic-btn" style={{ opacity: .4 }}>{t('issue.first')}</span>}
            {issue.next_issue
              ? issue.next_issue.is_upcoming
                ? <span className="ic-btn" style={{ opacity: .6 }}>{t('issue.upcoming', { n: issue.next_issue.number })}</span>
                : <Link to={`/archive/${issue.next_issue.id}`} className="ic-btn">№ {issue.next_issue.number} · {issue.next_issue.year} →</Link>
              : <span className="ic-btn" style={{ opacity: .4 }}>{t('issue.last')}</span>}
          </div>
        </div>

        {/* Matn */}
        <div className="issue-main">
          <div className="detail-tags">
            {issue.is_current && <span className="pill-cat">{t('issue.latest_badge')}</span>}
            <span className="pill-oa">{t('common.open_access')}</span>
          </div>
          <h1 className="h-display issue-title">{journal} № {issue.number}</h1>
          {/* Yil ichidagi tartib raqami: «2026-yil 2-son» (№ — jurnalning umumiy raqami) */}
          <div className="issue-sub">
            {hasVol ? t('issue.date_with_vol', { year: issue.year, vol: issue.volume }) : t('issue.year_sub', { year: issue.year })}
          </div>

          {/* Bo'sh kataklar tushib qoladi */}
          <MetaGrid className="issue-meta" cells={[
            [t('issue.meta.date'),        isRealDate(issue.date_label) ? issue.date_label : ''],
            [t('issue.meta.articles'),    totalArts ? t('unit.count_ta', { n: totalArts }) : ''],
            [t('issue.meta.volume'),      issue.total_pages ? tn('unit.pages', issue.total_pages) : ''],
            [t('issue.meta.periodicity'), t('issue.meta.quarterly')],
            [t('issue.meta.languages'),   issue.languages.join(' · ')],
          ]} />

          {issue.editorial_note && (
            <div className="editorial">
              <div className="eyebrow" style={{ marginBottom: 12 }}>{t('issue.editorial')}</div>
              <p>{issue.editorial_note}</p>
              {issue.editor_name && (
                <div className="meta" style={{ marginTop: 14 }}>{t('issue.editor', { name: issue.editor_name })}</div>
              )}
            </div>
          )}

          {pdfUrl && !showPdf && (
            <button className="btn primary" style={{ marginTop: 22 }} onClick={() => setShowPdf(true)}>
              {t('issue.read_full')}{issue.pdf_size ? ` · ${bytes(issue.pdf_size)}` : ''}
            </button>
          )}
        </div>

        {/* Yon karta */}
        <aside className="issue-side">
          <div className="side-card">
            <div className="side-card-title">{t('issue.about')}</div>
            <div className="issue-facts">
              <span><b>{num(issue.views)}</b> {tn('unit.views_word', issue.views)}</span>
              <span><b>{totalArts}</b> {tn('unit.articles_word', totalArts)}</span>
              {issue.total_pages > 0 && <span><b>{issue.total_pages}</b> {tn('unit.pages_word', issue.total_pages)}</span>}
            </div>
          </div>

          {issue.categories.length > 0 && (
            <div className="side-card">
              <div className="side-card-title">{t('issue.rubrics')}</div>
              {issue.categories.map(c => (
                <div key={c.name} className="side-row">
                  <span>{c.name}</span>
                  <span className="meta">{c.count}</span>
                </div>
              ))}
            </div>
          )}
        </aside>
      </div>

      {pdfUrl && showPdf && (
        <section id="pdf" className="wrap" style={{ paddingTop: 44 }}>
          <div className="detail-head" style={{ marginBottom: 18 }}>
            <h2 className="h-display" style={{ fontSize: 28 }}>{t('issue.full')}</h2>
            {issue.pdf_size ? <span className="meta">PDF · {bytes(issue.pdf_size)}</span> : null}
          </div>
          <PdfViewer url={pdfUrl} title={`${journal} № ${issue.number}`} />
        </section>
      )}

      {/* ═══ Mundarija ═══ */}
      <div className="wrap" style={{ paddingTop: 44, paddingBottom: 72 }}>
        <div className="detail-head" style={{ marginBottom: 22 }}>
          <h2 className="h-display" style={{ fontSize: 28, display: 'flex', alignItems: 'baseline', gap: 14 }}>
            {t('issue.toc')}
            <span className="meta">{tn('unit.articles', totalArts)}{issue.total_pages ? ` · ${tn('unit.pages', issue.total_pages)}` : ''}</span>
          </h2>
          {(hasRubrics || hasPages) && (
            <span className="meta">
              {[hasRubrics && t('issue.grouped'), hasPages && t('issue.pages_as_printed')].filter(Boolean).join(' · ')}
            </span>
          )}
        </div>

        {issue.sections.length === 0 && (
          <div className="state-box">{t('issue.empty')}</div>
        )}

        {issue.sections.map((sec, index) => (
          <section key={index} className="toc-section">
            {sec.category && (
              <div className="toc-section-head">
                <span className="eyebrow accent">{sec.category}</span>
                <span className="rule" />
                {pageRange(sec.page_start, sec.page_end) && (
                  <span className="meta">{t('unit.pages_abbr', { n: pageRange(sec.page_start, sec.page_end) })}</span>
                )}
              </div>
            )}

            <div className="toc-table">
              {sec.articles.map(a => (
                <Link key={a.id} to={`/articles/${a.slug}`} className="toc-row">
                  <div className="toc-thumb">
                    {a.image_url || cover
                      ? <img src={mediaUrl(a.image_url) ?? cover ?? undefined} alt={a.image_url ? a.title : coverAlt} loading="lazy" />
                      : <div className="home-featured-ph" />}
                  </div>
                  <div className="toc-body">
                    <div className="toc-title">{a.title}</div>
                    <div className="meta">{tn('unit.views', a.views)}</div>
                  </div>
                  <div className="toc-author">{a.authors.join(', ')}</div>
                  <div className="toc-pages meta">{pageRange(a.page_start, a.page_end)}</div>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>

      </main>
      <Footer />
    </div>
  );
}
