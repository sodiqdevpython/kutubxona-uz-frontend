import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Topbar from '../components/layout/Topbar';
import Footer from '../components/layout/Footer';
import PageLoadBar from '../components/ui/PageLoadBar';
import JournalCover from '../components/ui/JournalCover';
import MetaGrid from '../components/ui/MetaGrid';
import { issuesApi, type ApiIssueDetail } from '../lib/api';
import { mediaUrl } from '../lib/config';
import Seo from '../components/Seo';

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
  const [issue,   setIssue]   = useState<ApiIssueDetail | null>(null);
  const [loading, setLoading] = useState(!!id);

  // id o'zgarsa — holat render vaqtida yangilanadi
  const [seenId, setSeenId] = useState(id);
  if (seenId !== id) { setSeenId(id); setIssue(null); setLoading(!!id); }

  useEffect(() => {
    if (!id) return;
    window.scrollTo({ top: 0 });
    issuesApi.detail(id)
      .then(d => { setIssue(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id]);

  const journal = issue?.journal_title ?? 'Kutubxona';
  const cover   = mediaUrl(issue?.cover_image_url);
  const totalArts = issue?.sections.reduce((n, s) => n + s.articles.length, 0) ?? 0;

  if (loading) {
    return (
      <div className="bg-detail" style={{ minHeight: '100vh' }}>
        <PageLoadBar /><Topbar active="archive" />
        <div className="wrap"><div className="state-box" style={{ marginTop: 40 }}>Yuklanmoqda…</div></div>
        <Footer />
      </div>
    );
  }
  if (!issue) {
    return (
      <div className="bg-detail" style={{ minHeight: '100vh' }}>
        <PageLoadBar /><Topbar active="archive" />
        <div className="wrap">
          <div className="state-box" style={{ marginTop: 40 }}>
            Son topilmadi. <Link to="/archive" className="side-link">Arxivga qaytish →</Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="bg-detail" style={{ minHeight: '100vh' }}>
      <Seo title={`${journal} № ${issue.number} · ${issue.year}`}
        description={issue.editorial_note || `${journal} jurnalining ${issue.year}-yil ${issue.number}-soni.`}
        image={cover} />
      <PageLoadBar />
      <Topbar active="archive" />

      <div className="wrap" style={{ paddingTop: 26 }}>
        <nav className="crumbs">
          <Link to="/">Bosh sahifa</Link><span>/</span>
          <Link to="/archive">Jurnal arxivi</Link><span>/</span>
          <Link to="/archive">{issue.year}</Link><span>/</span>
          <span className="cur">№ {issue.number}</span>
        </nav>
      </div>

      {/* ═══ Yuqori blok: muqova · matn · yon karta ═══ */}
      <div className="wrap issue-hero">
        {/* Muqova + oldingi/keyingi */}
        <div className="issue-cover-col">
          <div className="issue-cover-big">
            {cover ? <img src={cover} alt="" /> : <JournalCover palette={issue.palette} />}
          </div>
          <div className="issue-nav">
            {issue.prev_issue
              ? <Link to={`/archive/${issue.prev_issue.id}`} className="ic-btn">← № {issue.prev_issue.number} · {issue.prev_issue.year}</Link>
              : <span className="ic-btn" style={{ opacity: .4 }}>← Birinchi son</span>}
            {issue.next_issue
              ? issue.next_issue.is_upcoming
                ? <span className="ic-btn" style={{ opacity: .6 }}>№ {issue.next_issue.number} tayyorlanmoqda</span>
                : <Link to={`/archive/${issue.next_issue.id}`} className="ic-btn">№ {issue.next_issue.number} · {issue.next_issue.year} →</Link>
              : <span className="ic-btn" style={{ opacity: .4 }}>So‘nggi son</span>}
          </div>
        </div>

        {/* Matn */}
        <div className="issue-main">
          <div className="detail-tags">
            {issue.is_current && <span className="pill-cat">So‘nggi son</span>}
            <span className="pill-oa">Ochiq kirish</span>
          </div>
          <h1 className="h-display issue-title">{journal} № {issue.number}</h1>
          <div className="issue-sub">
            {issue.year}-yil{issue.season ? ` · ${issue.season.toLowerCase()}` : ''}
          </div>

          {/* e-ISSN va DOI prefiks hali rasmiylashtirilmagan — ko'rsatilmaydi; bo'sh kataklar tushib qoladi */}
          <MetaGrid className="issue-meta" cells={[
            ['Chiqarilgan sana', issue.date_label],
            ['Maqolalar',        totalArts ? `${totalArts} ta` : ''],
            ['Hajm',             issue.total_pages ? `${issue.total_pages} bet` : ''],
            ['Davriylik',        'Choraklik'],
            ['ISSN',             issue.issn],
            ['Tillar',           issue.languages.join(' · ')],
          ]} />

          {issue.editorial_note && (
            <div className="editorial">
              <div className="eyebrow" style={{ marginBottom: 12 }}>Tahririyat so‘zi</div>
              <p>{issue.editorial_note}</p>
              {issue.editor_name && (
                <div className="meta" style={{ marginTop: 14 }}>Bosh muharrir · {issue.editor_name}</div>
              )}
            </div>
          )}
        </div>

        {/* Yon karta */}
        <aside className="issue-side rsp-hide">
          <div className="side-card">
            <div className="side-card-title">Son haqida</div>
            <div className="issue-facts">
              <span><b>{issue.views.toLocaleString()}</b> ko‘rish</span>
              <span><b>{totalArts}</b> maqola</span>
              {issue.total_pages > 0 && <span><b>{issue.total_pages}</b> bet</span>}
            </div>
          </div>

          {issue.categories.length > 0 && (
            <div className="side-card">
              <div className="side-card-title">Sondagi yo‘nalishlar</div>
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

      {/* ═══ Mundarija ═══ */}
      <div className="wrap" style={{ paddingTop: 44, paddingBottom: 72 }}>
        <div className="detail-head" style={{ marginBottom: 22 }}>
          <h2 className="h-display" style={{ fontSize: 28, display: 'flex', alignItems: 'baseline', gap: 14 }}>
            Mundarija
            <span className="meta">{totalArts} maqola{issue.total_pages ? ` · ${issue.total_pages} bet` : ''}</span>
          </h2>
          <span className="meta">Yo‘nalishlar bo‘yicha guruhlangan · sahifa raqamlari jurnaldagidek</span>
        </div>

        {issue.sections.length === 0 && (
          <div className="state-box">Bu songa hali maqola kiritilmagan.</div>
        )}

        {issue.sections.map(sec => (
          <section key={sec.category} className="toc-section">
            <div className="toc-section-head">
              <span className="eyebrow accent">{sec.category}</span>
              <span className="rule" />
              {pageRange(sec.page_start, sec.page_end) && (
                <span className="meta">{pageRange(sec.page_start, sec.page_end)} b.</span>
              )}
            </div>

            <div className="toc-table">
              {sec.articles.map(a => (
                <Link key={a.id} to={`/articles/${a.slug}`} className="toc-row">
                  <div className="toc-thumb">
                    {a.image_url ? <img src={mediaUrl(a.image_url) ?? undefined} alt="" /> : <div className="home-featured-ph" />}
                  </div>
                  <div className="toc-body">
                    <div className="toc-title">{a.title}</div>
                    <div className="meta">{a.views.toLocaleString()} ko‘rish</div>
                  </div>
                  <div className="toc-author">{a.authors.join(', ')}</div>
                  <div className="toc-pages meta">{pageRange(a.page_start, a.page_end)}</div>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>

      <Footer />
    </div>
  );
}
