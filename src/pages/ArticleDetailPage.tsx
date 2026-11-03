import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Topbar from '../components/layout/Topbar';
import Footer from '../components/layout/Footer';
import PageLoadBar from '../components/ui/PageLoadBar';
import AuthorAvatar from '../components/ui/AuthorAvatar';
import JournalCover from '../components/ui/JournalCover';
import PdfViewer from '../components/ui/PdfViewer';
import { isPdf, isDocx } from '../lib/file-kind';
import CommentsSection from '../components/CommentsSection';
import CitationBlock from '../components/article/CitationBlock';
import NotFoundPage from './NotFoundPage';
import AskAISection from '../components/article/AskAISection';
import DocxViewer from '../components/article/DocxViewer';
import MetaGrid from '../components/ui/MetaGrid';
import Seo, { type CitationMeta } from '../components/Seo';
import { articlesApi, authorsLine, formatBytes, isRealDate, issueLabel, pageRange, type ApiArticle, type ApiArticleDetail } from '../lib/api';
import { ISSN, JOURNAL_NAME, mediaUrl } from '../lib/config';
import type { CitationData } from '../lib/citation';

/**
 * Maqola sahifasi — Figma «Maqola detail» freymi.
 *
 * Chap ustun: yorliqlar, sarlavha, mualliflar, meta jadval, annotatsiya,
 *             to'liq matn, iqtibos, adabiyotlar, sharhlar, o'xshash maqolalar.
 * O'ng ustun: PDF/ulashish kartasi, chiqqan son, sahifa bo'ylab navigatsiya.
 */

const SECTIONS = [
  { id: 'annotatsiya', label: 'Annotatsiya' },
  { id: 'kalit',       label: 'Kalit so‘zlar' },
  { id: 'matn',        label: 'To‘liq matn' },
  { id: 'iqtibos',     label: 'Iqtibos keltirish' },
  { id: 'adabiyot',    label: 'Adabiyotlar' },
  { id: 'sharh',       label: 'Sharhlar' },
  { id: 'oxshash',     label: 'O‘xshash maqolalar' },
];

const DOI_RE = /\b(10\.\d{4,9}\/[^\s,;]+)/i;

/** Adabiyotlar matnini qatorlarga ajratadi (har qator — bitta manba). */
function splitRefs(raw: string): string[] {
  return (raw || '')
    .split('\n')
    .map(l => l.replace(/^\s*\d+[.)]\s*/, '').trim())
    .filter(Boolean);
}

export default function ArticleDetailPage() {
  const { slug } = useParams<{ slug: string }>();

  const [article, setArticle] = useState<ApiArticleDetail | null>(null);
  const [related, setRelated] = useState<ApiArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed,  setFailed]  = useState(false);

  const [copied, setCopied] = useState<string | null>(null);
  const [active, setActive] = useState('');
  const [pdfPages, setPdfPages] = useState(0);   // PdfViewer'dan sahifalar soni

  // slug o'zgarsa — holat render vaqtida tozalanadi
  const [seenSlug, setSeenSlug] = useState(slug);
  if (seenSlug !== slug) { setSeenSlug(slug); setLoading(true); setFailed(false); }

  useEffect(() => {
    if (!slug) return;
    articlesApi.detail(slug)
      .then(d => { setArticle(d); setLoading(false); })
      .catch(() => { setFailed(true); setLoading(false); });
    articlesApi.related(slug)
      .then(setRelated)
      .catch(() => setRelated([]));
  }, [slug]);

  // Sahifa bo'ylab: qaysi bo'lim ko'rinib turibdi
  useEffect(() => {
    if (!article) return;
    const obs = new IntersectionObserver(
      entries => {
        const vis = entries.filter(e => e.isIntersecting)
          .sort((x, y) => x.boundingClientRect.top - y.boundingClientRect.top)[0];
        if (vis) setActive(vis.target.id);
      },
      { rootMargin: '-150px 0px -70% 0px', threshold: 0 },
    );
    SECTIONS.forEach(s => {
      const el = document.getElementById(s.id);
      if (el) obs.observe(el);
    });
    return () => obs.disconnect();
  }, [article]);

  const refs = useMemo(() => splitRefs(article?.references ?? ''), [article]);

  // Annotatsiya faqat admin kiritgan bo'lsa ko'rinadi: `content` PDF'ning xom matni,
  // undan olingan parcha annotatsiya emas (sarlavha, jurnal nomi, uzilgan so'zlar).
  const abstract = article?.excerpt?.trim() ?? '';
  const refsWithDoi = refs.filter(r => DOI_RE.test(r)).length;

  function copy(text: string, tag: string) {
    navigator.clipboard?.writeText(text).catch(() => {});
    setCopied(tag);
    setTimeout(() => setCopied(null), 1600);
  }

  function jump(id: string) {
    const el = document.getElementById(id);
    if (!el) return;
    window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 140, behavior: 'smooth' });
  }

  if (loading) {
    return (
      <div className="bg-detail" style={{ minHeight: '100vh' }}>
        <PageLoadBar /><Topbar active="articles" />
        <main id="main" className="page-main">
        <div className="wrap"><div className="state-box" style={{ marginTop: 40 }}>Yuklanmoqda…</div></div>
        </main>
        <Footer />
      </div>
    );
  }

  if (failed || !article) return <NotFoundPage />;

  const a = article;
  // Mixed Content'dan himoya: HTTPS sahifada http:// fayl bloklanadi
  const fileUrl = mediaUrl(a.source_file_url);
  const issue = a.issue;
  const journal = issue?.journal_title ?? JOURNAL_NAME;
  const authorNames = a.authors.length ? a.authors.map(x => x.name) : (a.author_names ?? []);
  const year = issue?.year ?? a.year;
  const pages = pageRange(a);
  const pageCount = a.pages || (a.page_start && a.page_end ? a.page_end - a.page_start + 1 : 0);
  const fileLabel = [a.file_kind?.toUpperCase(), pdfPages ? `${pdfPages} bet` : '', formatBytes(a.file_size)].filter(Boolean).join(' · ');
  const hasText = Boolean(fileUrl || a.content);

  const citationData: CitationData = {
    title: a.title, authors: authorNames, journal, issn: ISSN, year,
    number: issue?.number ?? null, pageStart: a.page_start, pageEnd: a.page_end,
    doi: a.doi, url: window.location.origin + window.location.pathname, slug: a.slug,
  };
  const citationMeta: CitationMeta = [
    ['citation_title', a.title],
    ...authorNames.map((n): [string, string] => ['citation_author', n]),
    ['citation_publication_date', String(year)],
    ['citation_journal_title', journal],
    ['citation_issn', ISSN],
    ...(issue ? [['citation_issue', String(issue.number)] as [string, string]] : []),
    ...(a.page_start ? [['citation_firstpage', String(a.page_start)] as [string, string]] : []),
    ...(a.page_end ? [['citation_lastpage', String(a.page_end)] as [string, string]] : []),
    ...(a.doi ? [['citation_doi', a.doi] as [string, string]] : []),
    ...(isPdf(fileUrl) && fileUrl ? [['citation_pdf_url', fileUrl] as [string, string]] : []),
  ];

  // «Sahifa bo'ylab»da faqat sahifada bor bo'limlar
  const present: Record<string, boolean> = {
    annotatsiya: Boolean(abstract), kalit: a.keywords.length > 0, matn: hasText,
    iqtibos: true, adabiyot: refs.length > 0, sharh: true, oxshash: related.length > 0,
  };

  return (
    <div className="bg-detail" style={{ minHeight: '100vh' }}>
      <Seo title={a.title}
        description={a.excerpt || `${authorNames.join(', ')}. ${journal}, ${issue ? `${issue.year}, № ${issue.number}` : a.year}.`}
        image={mediaUrl(a.image_url ?? a.issue_cover_url)} citation={citationMeta} />
      <PageLoadBar />
      <Topbar active="articles" />
      <main id="main" className="page-main">

      <div className="wrap" style={{ paddingTop: 26 }}>
        <nav className="crumbs">
          <Link to="/">Bosh sahifa</Link><span>/</span>
          <Link to="/articles">Maqolalar</Link><span>/</span>
          {issue && (
            <><Link to={`/archive/${issue.id}`}>{issue.year} · № {issue.number}</Link><span>/</span></>
          )}
          <span className="cur">{a.title.slice(0, 42)}{a.title.length > 42 ? '…' : ''}</span>
        </nav>
      </div>

      <div className="wrap detail-grid">
        {/* ═══ Chap ustun ═══ */}
        <article className="detail-main">
          <div className="detail-tags">
            {a.category && <span className="pill-cat">{a.category.name}</span>}
            <span className="pill-oa">Ochiq kirish · CC BY 4.0</span>
            <span className="pill-line">Ikki tomonlama ko‘r taqriz</span>
            <span className="meta">Original maqola</span>
          </div>

          <h1 className="h-display detail-title">{a.title}</h1>

          {(a.authors.length > 0 || (a.author_names ?? []).length > 0) && (
            <div className="detail-authors">
              {a.authors.map((au, i) => (
                <div key={au.id} className="detail-author">
                  <AuthorAvatar name={au.initials} idx={au.avatar_idx}
                    src={au.avatar_url} alt={au.name} size={40} />
                  <div>
                    <div className="detail-author-line">
                      <Link to={`/authors/${au.slug}`} className="detail-author-name">{au.name}</Link>
                      {au.orcid && (
                        <a className="orcid-link" href={`https://orcid.org/${au.orcid}`} target="_blank" rel="noreferrer">
                          ORCID {au.orcid}
                        </a>
                      )}
                      {i === 0 && a.authors.length > 1 && <span className="meta">mas’ul muallif</span>}
                    </div>
                    {(au.org || au.role) && (
                      <div className="detail-author-org">
                        {[au.org, au.role].filter(Boolean).join(' · ')}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {a.authors.length === 0 && (a.author_names ?? []).length > 0 && (
                <div className="detail-author">
                  <AuthorAvatar name={(a.author_names[0] ?? 'M').slice(0, 2).toUpperCase()} size={40} />
                  <div>
                    <div className="detail-author-name" style={{ cursor: 'default' }}>
                      {a.author_names.join(', ')}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          <MetaGrid cells={[
            ['Jurnal',       journal],
            ['Yil / son',    issue ? `${issue.year} · № ${issue.number}` : String(a.year)],
            ['Sahifalar',    pages ? `${pages}${pageCount ? ` (${pageCount} bet)` : ''}` : (pageCount ? `${pageCount} bet` : '')],
            ['UDK',          a.udk],
            ['DOI',          a.doi ? (
              <span className="meta-doi">
                {a.doi}
                <button className="meta-copy" onClick={() => copy(a.doi, 'doi')}>{copied === 'doi' ? 'nusxalandi ✓' : 'nusxalash'}</button>
              </span>
            ) : ''],
            ['Yo‘nalish',    a.category?.name ?? ''],
            ['Nashr etildi', isRealDate(issue?.date_label) ? issue?.date_label ?? '' : ''],
            ['Statistika',   `${a.views.toLocaleString()} ko‘rish`],
          ]} />

          {abstract && (
            <section id="annotatsiya" className="detail-section">
              <SectionHead title="Annotatsiya" />
              <p className="detail-abstract">{abstract}</p>
            </section>
          )}

          {a.keywords.length > 0 && (
            <section id="kalit" className="detail-section">
              <div className="eyebrow" style={{ marginBottom: 10 }}>
                Kalit so‘zlar — bosilganda qidiruvga o‘tadi
              </div>
              <div className="kw-row">
                {a.keywords.map(k => (
                  <Link key={k.slug} to={`/articles?search=${encodeURIComponent(k.name)}`} className="kw">
                    {k.name}
                  </Link>
                ))}
              </div>
            </section>
          )}

        </article>

        {/* ═══ O'ng ustun — faqat sarlavha qismi yonida (Figma), sahifa bo'ylab yopishmaydi ═══ */}
        <aside className="detail-side">
          <div className="side-card">
            {hasText ? (
              <button className="btn primary side-read" onClick={() => jump('matn')}>
                <span>To‘liq matnni o‘qish</span>
                {a.file_size ? <span className="side-read-size">{formatBytes(a.file_size)}</span> : null}
              </button>
            ) : (
              <div className="meta" style={{ padding: '6px 0 10px' }}>Fayl biriktirilmagan</div>
            )}

            <div className="side-actions">
              <button className="btn ghost sm" onClick={() => jump('iqtibos')}>Iqtibos</button>
              <button className="btn ghost sm" onClick={() => copy(window.location.href, 'link')}>
                {copied === 'link' ? 'Nusxalandi ✓' : 'Ulashish'}
              </button>
            </div>

            <div className="dl-stats meta">
              <span>{a.views.toLocaleString()} ko‘rish</span>
            </div>
          </div>

          {issue && (
            <Link to={`/archive/${issue.id}`} className="side-card issue-card">
              <div className="issue-cover">
                {issue.cover_image_url
                  ? <img src={mediaUrl(issue.cover_image_url) ?? undefined} alt={`${journal} № ${issue.number}, ${issue.year} muqovasi`} />
                  : <JournalCover palette={0} />}
              </div>
              <div>
                <div className="eyebrow" style={{ marginBottom: 5 }}>Chiqqan son</div>
                <div className="issue-name">
                  {journal} № {issue.number} · {issue.year}
                </div>
                {issue.season && <div className="meta">{issue.season.toLowerCase()}</div>}
              </div>
            </Link>
          )}

          <div className="side-card toc-card">
            <div className="side-card-title">Sahifa bo‘ylab</div>
            <nav className="toc">
              {SECTIONS.filter(s => present[s.id]).map(s => (
                <button key={s.id} className={active === s.id ? 'active' : ''} onClick={() => jump(s.id)}>
                  {s.label}
                  {s.id === 'matn' && a.file_kind ? ` (${a.file_kind.toUpperCase()})` : ''}
                  {s.id === 'adabiyot' && refs.length > 0 && ` (${refs.length})`}
                </button>
              ))}
            </nav>
          </div>
        </aside>
      </div>

      {/* ═══ To'liq matn — butun kenglikda (Figma); keyin adabiyotlar va sharhlar chap ustun kengligida ═══ */}
      <div className="wrap detail-rest">
          {hasText && (
            <section id="matn" className="detail-section detail-full">
              <SectionHead title="To‘liq matn"
                right={isPdf(fileUrl) || isDocx(fileUrl) ? fileLabel : undefined} />
              {isPdf(fileUrl) && fileUrl
                ? <PdfViewer url={fileUrl} title={a.title} onInfo={i => setPdfPages(i.pages)} />
                : a.content
                  ? <DocxViewer title={a.title} html={a.content} />
                  : <div className="state-box">Fayl mavjud emas.</div>}
            </section>
          )}

        <div className="detail-main">
          <section id="iqtibos" className="detail-section">
            <SectionHead title="Iqtibos keltirish" right="5 format · har biri nusxalanadi" />
            <CitationBlock data={citationData} />
          </section>

          {refs.length > 0 && (
            <section id="adabiyot" className="detail-section">
              <SectionHead title="Adabiyotlar"
                right={`${refs.length} manba${refsWithDoi ? ` · ${refsWithDoi} tasida DOI` : ''}`} />
              <ol className="ref-list">
                {refs.map((r, i) => {
                  const m = r.match(DOI_RE);
                  return (
                    <li key={i}>
                      <span className="ref-n">{i + 1}</span>
                      <span>
                        {m ? r.replace(m[0], '').replace(/[—–-]\s*DOI:?\s*$/i, '').trim() : r}
                        {m && (
                          <a className="ref-doi" href={`https://doi.org/${m[1]}`}
                            target="_blank" rel="noreferrer">doi:{m[1]}</a>
                        )}
                      </span>
                    </li>
                  );
                })}
              </ol>
            </section>
          )}

          {/* CommentsSection o'z sarlavhasini chizadi — takrorlamaymiz */}
          <section id="sharh" className="detail-section">
            <CommentsSection articleId={a.id} />
          </section>
        </div>

          {related.length > 0 && (
            <section id="oxshash" className="detail-section">
              <SectionHead title="O‘xshash maqolalar" right="kalit so‘z va yo‘nalish bo‘yicha" />
              <div className="rel-grid">
                {related.slice(0, 3).map(r => (
                  <Link key={r.id} to={`/articles/${r.slug}`} className="rel-card">
                    <div className="rel-media">
                      {r.image_url || r.issue_cover_url
                        ? <img src={mediaUrl(r.image_url ?? r.issue_cover_url) ?? undefined} alt={r.image_url ? r.title : `${issueLabel(r)} soni muqovasi`} loading="lazy" />
                        : <div className="home-featured-ph" />}
                    </div>
                    <div className="rel-body">
                      {r.category && <span className="tag cat">{r.category.name}</span>}
                      <span className="rel-title">{r.title}</span>
                      <span className="meta">{authorsLine(r)}</span>
                      <span className="rel-foot meta">
                        <span>{issueLabel(r)}</span>
                        <span>{r.views.toLocaleString()}</span>
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}
      </div>

      {a.ai_ready && <AskAISection slug={a.slug} />}

      </main>
      <Footer />
    </div>
  );
}

// ── Kichik komponentlar ──────────────────────────────────────────────────────

function SectionHead({ title, right }: { title: string; right?: string }) {
  return (
    <div className="detail-head">
      <h2 className="h-display">{title}</h2>
      {right && <span className="meta">{right}</span>}
    </div>
  );
}

